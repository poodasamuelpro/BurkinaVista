/**
 * app/api/admin/medias/route.ts — API admin pour la gestion des médias
 * PATCH : mettre à jour le statut (approve/reject)
 * DELETE : supprimer un média (Cloudinary + B2 + Neon)
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : La suppression vidéo ne supprimait PAS le fichier dans Backblaze B2 !
 *  - Ajout validation UUID pour le paramètre id (évite injections)
 *  - Ajout rejection_reason lors d'un reject (champ prévu en DB mais non utilisé)
 *  - PATCH sans statut valide retournait 400 sans détail — message amélioré
 *
 * AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [MOD-LOG-01] Toute action de modération (approve/reject/delete) effectuée par
 *               l'admin est désormais journalisée dans la table moderation_logs
 *               (migration neon-migration.sql). La source est 'dashboard' pour
 *               distinguer des actions effectuées via les liens email
 *               (/api/moderation, source='email_link').
 *  [MOD-LOG-02] L'écriture du log est non-bloquante : si la table est indisponible,
 *               l'opération PATCH/DELETE réussit quand même (priorité métier).
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { sendApprovalConfirmation } from '@/lib/email'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { getB2Client, getB2BucketName } from '@/lib/b2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { logModerationAction } from '@/lib/moderation-log'
import { UUID_V4_REGEX } from '@/lib/security'
import type { Media } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

// PATCH — Changer le statut d'un média
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id, statut, rejection_reason } = await req.json()

    if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id)) {
      return NextResponse.json({ error: 'id invalide (UUID v4 requis)' }, { status: 400 })
    }

    if (!statut) {
      return NextResponse.json({ error: 'statut requis' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'pending'].includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide. Valeurs acceptées : approved, rejected, pending' },
        { status: 400 }
      )
    }

    // Enregistrement de rejection_reason lors d'un refus
    const updateQuery = statut === 'rejected'
      ? 'UPDATE medias SET statut = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *'
      : 'UPDATE medias SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *'

    const updateParams = statut === 'rejected'
      ? [statut, rejection_reason || null, id]
      : [statut, id]

    const [media] = await query<Media>(updateQuery, updateParams)

    if (!media) {
      return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })
    }

    // Envoyer email de confirmation si approuvé
    if (statut === 'approved' && media.contributeur_email && media.contributeur_prenom) {
      sendApprovalConfirmation(
        media.contributeur_email,
        media.contributeur_prenom,
        media.titre,
        media.slug
      ).catch((err) => console.error('Erreur email approbation:', err))
    }

    // [MOD-LOG-01] Journalisation de l'action (approve/reject seulement,
    // 'pending' n'est pas réellement une modération mais un retour en file d'attente)
    if (statut === 'approved' || statut === 'rejected') {
      logModerationAction({
        mediaId: id,
        action: statut === 'approved' ? 'approve' : 'reject',
        source: 'dashboard',
        reason: statut === 'rejected' ? (rejection_reason || null) : null,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error('Erreur PATCH media:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Supprimer un média (Neon + Cloudinary/B2)
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    if (!id || typeof id !== 'string' || !UUID_V4_REGEX.test(id)) {
      return NextResponse.json({ error: 'id invalide (UUID v4 requis)' }, { status: 400 })
    }

    // Récupérer le média avant suppression
    const media = await queryOne<Media>('SELECT * FROM medias WHERE id = $1', [id])

    if (!media) {
      return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })
    }

    // ── Suppression du fichier physique ──────────────────────
    if (media.type === 'photo' && media.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(media.cloudinary_public_id)
      } catch (err) {
        console.error('Erreur suppression Cloudinary:', err)
      }
    } else if (media.type === 'video' && media.b2_key) {
      try {
        await deleteFromB2(media.b2_key)
      } catch (err) {
        console.error('Erreur suppression B2:', err)
      }
    }

    // Supprimer de Neon
    await query('DELETE FROM medias WHERE id = $1', [id])

    // [MOD-LOG-01] Journalisation de la suppression
    logModerationAction({
      mediaId: id,
      action: 'delete',
      source: 'dashboard',
      reason: `Suppression admin du média "${media.titre}"`,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE media:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Supprime un fichier de Backblaze B2
 */
async function deleteFromB2(b2Key: string): Promise<void> {
  const b2Client = getB2Client()
  const bucketName = getB2BucketName()

  await b2Client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: b2Key,
  }))
}
