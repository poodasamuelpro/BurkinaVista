/**
 * app/api/videos/upload-url/route.ts
 * Génère une URL pré-signée Backblaze B2
 * Le client uploade directement vers B2 — le serveur Vercel ne touche jamais le fichier vidéo
 * Vérifie que l'upload vidéo est activé dans admin_settings avant de procéder
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getB2Client, getB2BucketName, getB2PublicUrl } from '@/lib/b2'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types MIME vidéo autorisés
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',  // MOV
  'video/webm',
  'video/x-mkvideo', // MKV
  'video/avi',
]

// Taille max : 2 GB
const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    // 1. Vérifier que l'upload vidéo est activé dans admin_settings
    const setting = await queryOne<{ valeur: string }>(
      "SELECT valeur FROM admin_settings WHERE cle = 'upload_videos_enabled'",
      []
    )

    if (!setting || setting.valeur !== 'true') {
      return NextResponse.json(
        { error: "L'upload vidéo n'est pas encore disponible. Bientôt !" },
        { status: 503 }
      )
    }

    // 2. Lire et valider les paramètres de la requête
    const { filename, contentType, fileSize } = await req.json()

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'filename requis' }, { status: 400 })
    }

    if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : MP4, MOV, WebM' },
        { status: 400 }
      )
    }

    if (fileSize && fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux. Maximum 2 Go.' },
        { status: 400 }
      )
    }

    // 3. Générer une clé unique pour le fichier dans B2
    // Format : videos/TIMESTAMP-FILENAME_SANITIZE
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase()
      .substring(0, 100)

    const b2Key = `videos/${Date.now()}-${sanitizedFilename}`

    // 4. Créer la commande S3 pour l'upload
    const b2Client = getB2Client()
    const bucketName = getB2BucketName()

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: b2Key,
      ContentType: contentType,
      // ✅ FIX — Désactive explicitement le checksum CRC32 sur cette commande
      // Double protection avec la config du client dans lib/b2.ts
      ChecksumAlgorithm: undefined,
    })

    // 5. Générer l'URL pré-signée valable 2 heures
    // (suffisant même pour de très grosses vidéos sur une connexion lente)
    const signedUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 7200, // 2 heures
    })

    // 6. Construire l'URL publique finale (via Cloudflare CDN devant B2)
    const publicUrl = `${getB2PublicUrl()}/${b2Key}`

    return NextResponse.json({
      signedUrl,
      publicUrl,
      b2Key,
    })

  } catch (error) {
    console.error('[upload-url] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la génération du lien upload' },
      { status: 500 }
    )
  }
}
