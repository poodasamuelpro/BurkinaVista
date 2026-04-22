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

// ✅ FIX 6.5 — Types MIME vidéo autorisés corrigés
// 'video/x-mkvideo' était incorrect (c'est le type AVI, pas MKV)
// Le type officiel MKV est 'video/x-matroska'
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',   // MOV
  'video/webm',
  'video/x-matroska',  // MKV ✅ CORRIGÉ (était 'video/x-mkvideo')
  'video/avi',
  'video/x-msvideo',   // AVI — type alternatif envoyé par certains navigateurs
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
        { error: 'Type de fichier non autorisé. Formats acceptés : MP4, MOV, WebM, MKV, AVI' },
        { status: 400 }
      )
    }

    // ✅ FIX 6.4 — fileSize rendu obligatoire (était optionnel avec `if (fileSize && ...)`)
    // Un client malveillant pouvait omettre fileSize pour contourner la limite de taille
    if (!fileSize || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'fileSize requis et doit être un nombre' },
        { status: 400 }
      )
    }

    if (fileSize > MAX_SIZE_BYTES) {
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
      ContentLength: fileSize,
      // ✅ FIX 6.1 — Désactive explicitement le checksum CRC32 sur cette commande
      // Double protection avec la config du client dans lib/b2.ts
      // Backblaze B2 ne supporte pas les headers x-amz-checksum-*
      ChecksumAlgorithm: undefined,
    })

    // 5. Générer l'URL pré-signée valable 2 heures
    // (suffisant même pour de très grosses vidéos sur une connexion lente)
    const signedUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 7200, // 2 heures
      // ✅ FIX 6.1 — Ne pas signer les headers de checksum dans l'URL
      // Évite que l'URL pré-signée contienne x-amz-checksum-crc32 ou x-amz-sdk-checksum-algorithm
      unhoistableHeaders: new Set([
        'x-amz-checksum-crc32',
        'x-amz-sdk-checksum-algorithm',
      ]),
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
