/**
 * app/api/admin/upload-settings/route.ts
 * Lecture et modification des toggles upload (photos/vidéos)
 * Protégé par le middleware JWT admin existant
 */
import { NextRequest, NextResponse } from 'next/server'
import { query, queryMany } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET — Récupère les paramètres d'upload actuels
 */
export async function GET() {
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
    console.error('[upload-settings GET] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH — Modifie un toggle upload
 * Body : { cle: 'upload_photos_enabled' | 'upload_videos_enabled', valeur: boolean }
 */
export async function PATCH(req: NextRequest) {
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

    return NextResponse.json({
      success: true,
      [cle]: valeur,
    })

  } catch (error) {
    console.error('[upload-settings PATCH] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
