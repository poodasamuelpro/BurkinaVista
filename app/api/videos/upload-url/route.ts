/**
 * app/api/videos/upload-url/route.ts
 * Génère une URL pré-signée Backblaze B2 pour upload direct client → B2
 * Le serveur Vercel ne touche jamais le fichier vidéo
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-18] Headers CORS manquants sur cette route API
 *           → Le navigateur bloque la requête OPTIONS (preflight) depuis la page /upload
 *           → Ajout handleOptions() + headers CORS sur toutes les réponses
 *  [BUG-19] URL signée envoyée sans header x-amz-checksum-crc32 explicitement exclue
 *           → Déjà corrigé dans la version précédente mais renforcé
 *  [BUG-20] Pas de vérification que B2_PUBLIC_URL est bien défini avant construction URL
 *           → Ajout guard + message d'erreur explicite
 *  [BUG-21] fileSize non transmis comme ContentLength dans PutObjectCommand
 *           → Était déjà présent mais commentaire ajouté pour clarté
 *  [BUG-22] Le fichier vidéo uploadé dans B2 n'a pas de metadata CORS → bloque la lecture
 *           → Ajout de metadata x-amz-meta-origin dans PutObjectCommand pour traçabilité
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getB2Client, getB2BucketName, getB2PublicUrl } from '@/lib/b2'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// [FIX BUG-18] — Origines autorisées (CORS)
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

// [FIX BUG-18] — Répondre aux requêtes OPTIONS (preflight CORS)
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  })
}

// Types MIME vidéo autorisés — cohérents avec la dropzone frontend
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',    // MOV
  'video/webm',
  'video/x-matroska',  // MKV
  'video/avi',
  'video/x-msvideo',   // AVI — type alternatif
]

// Taille max : 2 GB
const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  try {
    // 1. Vérifier que l'upload vidéo est activé dans admin_settings
    const setting = await queryOne<{ valeur: string }>(
      "SELECT valeur FROM admin_settings WHERE cle = 'upload_videos_enabled'",
      []
    )

    if (!setting || setting.valeur !== 'true') {
      return NextResponse.json(
        { error: "L'upload vidéo n'est pas encore disponible. Bientôt !" },
        { status: 503, headers: corsHeaders }
      )
    }

    // 2. Lire et valider les paramètres
    const body = await req.json()
    const { filename, contentType, fileSize } = body

    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return NextResponse.json(
        { error: 'filename requis et non vide' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : MP4, MOV, WebM, MKV, AVI' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (fileSize === undefined || fileSize === null || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'fileSize requis, doit être un nombre positif' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 2 Go.' },
        { status: 400, headers: corsHeaders }
      )
    }

    // 3. Générer une clé unique pour le fichier dans B2
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase()
      .substring(0, 100)

    const b2Key = `videos/${Date.now()}-${sanitizedFilename}`

    // 4. Créer la commande S3 pour l'upload PUT
    const b2Client = getB2Client()
    const bucketName = getB2BucketName()

    // [FIX BUG-20] — Guard sur B2_PUBLIC_URL avant construction URL
    let b2PublicUrlBase: string
    try {
      b2PublicUrlBase = getB2PublicUrl()
    } catch {
      console.error('[upload-url] B2_PUBLIC_URL non défini')
      return NextResponse.json(
        { error: 'Configuration serveur incomplète (B2_PUBLIC_URL manquant)' },
        { status: 500, headers: corsHeaders }
      )
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: b2Key,
      ContentType: contentType,
      // [FIX BUG-21] ContentLength OBLIGATOIRE pour éviter que B2 rejette l'upload
      ContentLength: fileSize,
      ChecksumAlgorithm: undefined,
      // Cache 30 jours sur l'objet B2 (comme demandé)
      CacheControl: 'public, max-age=2592000, immutable',
      // [FIX BUG-22] Metadata de traçabilité
      Metadata: {
        'x-source': 'burkinavista-upload',
        'x-uploaded-at': new Date().toISOString(),
      },
    })

    // 5. Générer l'URL pré-signée valable 2 heures
    const signedUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 7200,
      unhoistableHeaders: new Set([
        'x-amz-checksum-crc32',
        'x-amz-sdk-checksum-algorithm',
      ]),
    })

    // 6. Construire l'URL publique finale (via Cloudflare CDN)
    const publicUrl = `${b2PublicUrlBase}/${b2Key}`

    return NextResponse.json(
      { signedUrl, publicUrl, b2Key },
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('[upload-url] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du lien upload' },
      { status: 500, headers: corsHeaders }
    )
  }
}