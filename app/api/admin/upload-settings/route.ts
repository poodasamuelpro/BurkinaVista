/**
 * app/api/admin/upload-settings/route.ts
 * Lecture et modification des toggles upload (photos/vidéos)
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : Le PATCH n'avait AUCUNE vérification auth admin → ajout checkAdmin()
 *  - Le GET restait public car la page /upload en avait besoin sans authentification
 *
 * AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [ADMIN-SETTINGS-01] Le GET de cette route était volontairement laissé public.
 *                      → Création d'une route publique dédiée /api/upload-settings
 *                        (lecture seule) pour la page /upload.
 *                      → Cette route admin est désormais protégée par le middleware
 *                        (matcher /api/admin/:path*) ET par checkAdmin() en
 *                        defense-in-depth sur GET et PATCH.
 *                      → Le GET ne sert plus que pour le dashboard admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth'
import { query, queryMany } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return false
  return verifyAdminToken(token)
}

/**
 * GET — Récupère les paramètres d'upload actuels
 * [ADMIN-SETTINGS-01] Désormais PROTÉGÉ. Pour un accès public utiliser
 * la route /api/upload-settings.
 */
export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const settings = await queryMany<{ cle: string; valeur: string }>(
      "SELECT cle, valeur FROM admin_settings WHERE cle IN ('upload_photos_enabled', 'upload_videos_enabled')",
      []
    )

    const result = {
      upload_photos_enabled: true,
      upload_videos_enabled: false,
    }

    settings.forEach(({ cle, valeur }) => {
      if (cle === 'upload_photos_enabled') result.upload_photos_enabled = valeur === 'true'
      if (cle === 'upload_videos_enabled') result.upload_videos_enabled = valeur === 'true'
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/upload-settings GET] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH — Modifie un toggle upload (protégé admin)
 * Body : { cle: 'upload_photos_enabled' | 'upload_videos_enabled', valeur: boolean }
 */
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { cle, valeur } = await req.json()

    const allowedKeys = ['upload_photos_enabled', 'upload_videos_enabled']
    if (!allowedKeys.includes(cle)) {
      return NextResponse.json({ error: 'Clé non autorisée' }, { status: 400 })
    }

    if (typeof valeur !== 'boolean') {
      return NextResponse.json({ error: 'valeur doit être un booléen' }, { status: 400 })
    }

    await query(
      `INSERT INTO admin_settings (cle, valeur)
       VALUES ($1, $2)
       ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur`,
      [cle, valeur ? 'true' : 'false']
    )

    return NextResponse.json({ success: true, [cle]: valeur })
  } catch (error) {
    console.error('[admin/upload-settings PATCH] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
