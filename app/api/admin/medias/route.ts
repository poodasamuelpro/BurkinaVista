/**
 * app/api/admin/medias/route.ts — API admin pour la gestion des médias
 * PATCH : mettre à jour le statut (approve/reject)
 * DELETE : supprimer un média
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { sendApprovalConfirmation } from '@/lib/email'
import type { Media } from '@/types'

export const dynamic = 'force-dynamic'

// Vérifie l'authentification admin via cookie
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
    const { id, statut } = await req.json()

    if (!id || !statut) {
      return NextResponse.json({ error: 'id et statut requis' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'pending'].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const [media] = await query<Media>(
      'UPDATE medias SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [statut, id]
    )

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

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error('Erreur PATCH media:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — Supprimer un média
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    // Récupérer le média avant suppression (pour éventuellement supprimer sur Cloudinary)
    const media = await queryOne<Media>('SELECT * FROM medias WHERE id = $1', [id])

    if (!media) {
      return NextResponse.json({ error: 'Média introuvable' }, { status: 404 })
    }

    // Supprimer de Cloudinary si c'est une photo
    if (media.type === 'photo' && media.cloudinary_public_id) {
      try {
        const { deleteFromCloudinary } = await import('@/lib/cloudinary')
        await deleteFromCloudinary(media.cloudinary_public_id)
      } catch (err) {
        console.error('Erreur suppression Cloudinary:', err)
        // On continue même si Cloudinary échoue
      }
    }

    await query('DELETE FROM medias WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE media:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
