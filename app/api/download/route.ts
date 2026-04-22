/**
 * app/api/download/route.ts — Téléchargement de médias
 * Incrémente le compteur downloads dans Neon
 * Retourne cloudinary_url pour les photos, b2_url pour les vidéos
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  AUDIT BurkinaVista — 2026-04-22                               ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  CORRECTIONS APPLIQUÉES :                                        ║
 * ║  [DL-01] CORS manquants sur la route /api/download              ║
 * ║          → Le navigateur peut bloquer le retour de l'URL        ║
 * ║          → Ajout OPTIONS + getCorsHeaders()                     ║
 * ║  [DL-02] Validation UUID sur mediaId absente                    ║
 * ║          → Injection possible via mediaId non validé            ║
 * ║          → Ajout UUID_REGEX validation                          ║
 * ║  [DL-03] L'URL retournée pour les vidéos pouvait être l'ancienne║
 * ║          valeur b2_url (avec mauvais préfixe /videos/xxx)       ║
 * ║          → Les vidéos déjà en DB ont b2_url avec mauvais préfixe ║
 * ║          → Ajout de fixB2Url() pour corriger à la volée         ║
 * ║  [DL-04] Aucun CORS header sur les réponses d'erreur            ║
 * ║          → Ajout corsHeaders sur tous les NextResponse.json()   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Regex UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ALLOWED_CORS_ORIGINS = [
  'https://burkina-vista.vercel.app',
  'https://burkinavistabf.poodasamuel.com',
  'http://localhost:3000',
]

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin =
    process.env.NODE_ENV !== 'production'
      ? '*'
      : ALLOWED_CORS_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_CORS_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

// [FIX DL-01] — Preflight CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) })
}

/**
 * [FIX DL-03] — Correction à la volée des anciennes b2_url en 404
 *
 * Contexte : les vidéos uploadées AVANT la correction de B2_PUBLIC_URL
 * ont été enregistrées en DB avec une URL de la forme :
 *   https://burkinavistabf.poodasamuel.com/videos/xxx.mp4  ← 404
 *
 * Cette fonction la transforme en :
 *   https://burkinavistabf.poodasamuel.com/file/burkinavista-videos/videos/xxx.mp4  ← 200
 *
 * Elle est idempotente : si l'URL est déjà correcte (contient /file/), elle est retournée telle quelle.
 */
function fixB2Url(b2Url: string | null): string | null {
  if (!b2Url) return null

  // URL déjà au bon format
  if (b2Url.includes('/file/')) return b2Url

  // URL CDN avec mauvais chemin : https://cdn.example.com/videos/xxx.mp4
  // On ne peut pas déduire le bucket name de façon sûre sans B2_PUBLIC_URL
  const correctPublicUrl = process.env.B2_PUBLIC_URL?.replace(/\/$/, '').trim()
  if (!correctPublicUrl) return b2Url

  // Si l'URL correspond au CDN configuré
  const cdnBase = correctPublicUrl.includes('/file/')
    ? correctPublicUrl.split('/file/')[0]  // https://cdn.example.com
    : correctPublicUrl                      // https://cdn.example.com (ancienne valeur)

  if (b2Url.startsWith(cdnBase)) {
    // Extraire le chemin relatif (ex: /videos/xxx.mp4)
    const relativePath = b2Url.slice(cdnBase.length)
    // Construire l'URL corrigée avec le bon préfixe
    return `${correctPublicUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`
  }

  return b2Url
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  try {
    const { mediaId } = await req.json()

    // [FIX DL-02] — Validation UUID pour éviter les injections
    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId requis' }, { status: 400, headers: corsHeaders })
    }

    if (!UUID_REGEX.test(mediaId)) {
      return NextResponse.json(
        { error: 'mediaId invalide (UUID v4 requis)' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Récupérer le média
    const media = await queryOne<{
      id: string
      cloudinary_url: string | null
      b2_url: string | null
      slug: string
      type: string
    }>(
      'SELECT id, cloudinary_url, b2_url, slug, type FROM medias WHERE id = $1 AND statut = $2',
      [mediaId, 'approved']
    )

    if (!media) {
      return NextResponse.json(
        { error: 'Média introuvable' },
        { status: 404, headers: corsHeaders }
      )
    }

    // Incrémenter le compteur de téléchargements
    await query(
      'UPDATE medias SET downloads = downloads + 1 WHERE id = $1',
      [mediaId]
    )

    // [FIX DL-03] — Corriger à la volée les anciennes URLs B2 mal formées
    const rawUrl = media.type === 'photo' ? media.cloudinary_url : media.b2_url
    const url = media.type === 'video' ? fixB2Url(rawUrl) : rawUrl

    return NextResponse.json({ url }, { headers: corsHeaders })

  } catch (error) {
    console.error('[download] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500, headers: corsHeaders }
    )
  }
}