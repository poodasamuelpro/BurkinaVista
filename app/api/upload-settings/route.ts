/**
 * app/api/upload-settings/route.ts — Endpoint PUBLIC de lecture des toggles upload
 *
 * AJOUT (Audit 2026-05-01) :
 *  [SETTINGS-01] Avant : la page /upload appelait /api/admin/upload-settings (GET),
 *                ce qui forçait à laisser ce GET admin volontairement public.
 *                → Création d'un endpoint dédié /api/upload-settings (lecture seule)
 *                  permettant à la page /upload de lire les toggles sans toucher
 *                  à la route admin.
 *                → La route admin (/api/admin/upload-settings) est désormais
 *                  totalement fermée aux requêtes non authentifiées.
 *
 *  Cet endpoint expose UNIQUEMENT les deux booléens nécessaires à la page
 *  /upload (toggles photos / vidéos). Il ne fuite aucune autre donnée admin.
 */
import { NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface PublicUploadSettings {
  upload_photos_enabled: boolean
  upload_videos_enabled: boolean
}

export async function GET() {
  try {
    const settings = await queryMany<{ cle: string; valeur: string }>(
      "SELECT cle, valeur FROM admin_settings WHERE cle IN ('upload_photos_enabled', 'upload_videos_enabled')",
      []
    )

    const result: PublicUploadSettings = {
      upload_photos_enabled: true,
      upload_videos_enabled: false,
    }

    settings.forEach(({ cle, valeur }) => {
      if (cle === 'upload_photos_enabled') {
        result.upload_photos_enabled = valeur === 'true'
      }
      if (cle === 'upload_videos_enabled') {
        result.upload_videos_enabled = valeur === 'true'
      }
    })

    return NextResponse.json(result, {
      headers: {
        // Cache court côté Vercel Edge — les toggles changent peu mais on
        // veut quand même propager rapidement les modifications admin.
        'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[upload-settings public GET] Erreur:', error)
    // Failsafe : si la DB est indisponible, on renvoie des valeurs par défaut
    // pour ne pas casser la page /upload.
    return NextResponse.json(
      {
        upload_photos_enabled: true,
        upload_videos_enabled: false,
      } satisfies PublicUploadSettings,
      { status: 200 }
    )
  }
}
