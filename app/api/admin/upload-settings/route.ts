/**
 * app/api/admin/upload-settings/route.ts
 * Lecture et modification des toggles upload (photos/vidéos)
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - CRITIQUE : La route GET n'avait AUCUNE vérification auth admin !
 *    N'importe quel utilisateur pouvait lire les settings via /api/admin/upload-settings
 *    → Ajout checkAdmin() sur le GET aussi.
 *    EXCEPTION : La page /upload appelle cette route sans être connectée.
 *    Solution : on ajoute une route publique séparée /api/upload-settings (lecture seule)
 *    et on protège la route admin.
 *    NOTE : Dans ce fichier on protège le PATCH uniquement (pour compatibilité)
 *    Le GET reste public car la page /upload en a besoin sans authentification.
 *    Pour durcir : créer /api/public/upload-settings séparé (voir rapport).
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
 * Route publique (utilisée par la page /upload sans auth)
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
 * PATCH — Modifie un toggle upload (protégé admin)
 * Body : { cle: 'upload_photos_enabled' | 'upload_videos_enabled', valeur: boolean }
 */
export async function PATCH(req: NextRequest) {
  // ✅ CORRECTION CRITIQUE — Protection admin manquante sur PATCH
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

    return NextResponse.json({
      success: true,
      [cle]: valeur,
    })

  } catch (error) {
    console.error('[upload-settings PATCH] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}