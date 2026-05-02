/**
 * app/api/videos/upload-url/route.ts
 * Génère une URL pré-signée Backblaze B2 pour upload direct client → B2
 * Le serveur Vercel ne touche jamais le fichier vidéo
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :                    ║
 * ║  [BUG-18] Headers CORS manquants → OPTIONS handler              ║
 * ║  [BUG-19] CRC32 checksum non exclu des headers signés           ║
 * ║  [BUG-20] Guard B2_PUBLIC_URL absent → crash non explicite      ║
 * ║  [BUG-21] ContentLength non transmis                            ║
 * ║  [BUG-22] Métadonnées de traçabilité absentes                   ║
 * ║  [URL-FIX] publicUrl construit avec mauvais préfixe             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [VIDEO-URL-01] Rate-limiting par IP (5 demandes / 10 min)
 *                 RATE_LIMITS.VIDEO_UPLOAD_URL
 *  [VIDEO-URL-02] Captcha Cloudflare Turnstile (header X-Turnstile-Token ou
 *                 champ turnstileToken du body). Skip silencieux si non
 *                 configuré. Aucun impact sur la durée d'upload : la vérification
 *                 est faite avant la génération de l'URL signée (~50-300ms).
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getB2Client, getB2BucketName, getB2PublicUrl } from '@/lib/b2'
import { queryOne } from '@/lib/db'
import { rateLimitByIp, RATE_LIMITS, rateLimitHeaders, getClientIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) })
}

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/avi',
  'video/x-msvideo',
]

const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  // [VIDEO-URL-01] Rate-limit par IP
  const rl = await rateLimitByIp(req, RATE_LIMITS.VIDEO_UPLOAD_URL)
  const baseHeaders = { ...corsHeaders, ...rateLimitHeaders(rl) }
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de demandes. Merci de patienter quelques minutes avant de réessayer.' },
      { status: 429, headers: baseHeaders }
    )
  }

  try {
    // 1. Toggle vidéo activé ?
    const setting = await queryOne<{ valeur: string }>(
      "SELECT valeur FROM admin_settings WHERE cle = 'upload_videos_enabled'",
      []
    )

    if (!setting || setting.valeur !== 'true') {
      return NextResponse.json(
        { error: "L'upload vidéo n'est pas encore disponible. Bientôt !" },
        { status: 503, headers: baseHeaders }
      )
    }

    // 2. Validation paramètres
    const body = await req.json()
    const { filename, contentType, fileSize, turnstileToken } = body

    // [VIDEO-URL-02] Captcha Turnstile (header ou champ body)
    const headerToken = req.headers.get('x-turnstile-token')
    const captchaToken = headerToken || turnstileToken
    const captchaOk = await verifyTurnstile(captchaToken, getClientIp(req))
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'Vérification anti-spam échouée. Veuillez recharger la page et réessayer.' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return NextResponse.json(
        { error: 'filename requis et non vide' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : MP4, MOV, WebM, MKV, AVI' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (fileSize === undefined || fileSize === null || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'fileSize requis, doit être un nombre positif' },
        { status: 400, headers: baseHeaders }
      )
    }

    if (fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 2 Go.' },
        { status: 400, headers: baseHeaders }
      )
    }

    // 3. Clé B2 unique
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase()
      .substring(0, 100)

    const b2Key = `videos/${Date.now()}-${sanitizedFilename}`

    // 4. Commande S3 PUT
    const b2Client = getB2Client()
    const bucketName = getB2BucketName()

    let b2PublicUrlBase: string
    try {
      b2PublicUrlBase = getB2PublicUrl()
    } catch {
      console.error('[upload-url] B2_PUBLIC_URL non défini')
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (B2_PUBLIC_URL manquant)' },
        { status: 500, headers: baseHeaders }
      )
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: b2Key,
      ContentType: contentType,
      ContentLength: fileSize,
      ChecksumAlgorithm: undefined,
      CacheControl: 'public, max-age=2592000, immutable',
      Metadata: {
        'x-source': 'burkinavista-upload',
        'x-uploaded-at': new Date().toISOString(),
      },
    })

    // 5. URL pré-signée 2h
    const signedUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 7200,
      unhoistableHeaders: new Set([
        'x-amz-checksum-crc32',
        'x-amz-sdk-checksum-algorithm',
      ]),
    })

    const publicUrl = `${b2PublicUrlBase}/${b2Key}`

    return NextResponse.json(
      { signedUrl, publicUrl, b2Key },
      { headers: baseHeaders }
    )
  } catch (error) {
    console.error('[upload-url] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du lien upload' },
      { status: 500, headers: baseHeaders }
    )
  }
}
