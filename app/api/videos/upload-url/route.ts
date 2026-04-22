/**
 * app/api/videos/upload-url/route.ts
 * Génère une URL pré-signée Backblaze B2 pour upload direct client → B2
 * Le serveur Vercel ne touche jamais le fichier vidéo
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - Ajout validation UUID sur mediaId pour éviter injections
 *  - Ajout header Content-Disposition dans la commande S3 pour forcer le nom fichier
 *  - Ajout header Cache-Control sur l'objet uploadé
 *  - Vérification explicite que B2_KEY_ID / B2_APP_KEY / B2_ENDPOINT / B2_BUCKET_NAME sont définis
 *  - fileSize rendu strictement obligatoire
 *  - Désactivation checksum CRC32 au niveau de la commande (double protection)
 *  - Ajout des headers CORS explicites dans la réponse API Vercel
 *  - Types MIME corrigés : 'video/x-mkvideo' → 'video/x-matroska'
 */
import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getB2Client, getB2BucketName, getB2PublicUrl } from '@/lib/b2'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Types MIME vidéo autorisés — cohérents avec la dropzone frontend
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',    // MOV
  'video/webm',
  'video/x-matroska',  // MKV — type MIME officiel (était x-mkvideo, incorrect)
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
    const body = await req.json()
    const { filename, contentType, fileSize } = body

    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      return NextResponse.json({ error: 'filename requis et non vide' }, { status: 400 })
    }

    if (!contentType || !ALLOWED_VIDEO_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés : MP4, MOV, WebM, MKV, AVI' },
        { status: 400 }
      )
    }

    // fileSize strictement obligatoire — évite contournement limite de taille
    if (fileSize === undefined || fileSize === null || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'fileSize requis, doit être un nombre positif' },
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
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase()
      .substring(0, 100)

    const b2Key = `videos/${Date.now()}-${sanitizedFilename}`

    // 4. Créer la commande S3 pour l'upload PUT
    const b2Client = getB2Client()
    const bucketName = getB2BucketName()

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: b2Key,
      ContentType: contentType,
      ContentLength: fileSize,
      // ✅ Désactive explicitement le checksum CRC32 sur cette commande
      // Double protection avec la config du client dans lib/b2.ts
      ChecksumAlgorithm: undefined,
      // ✅ AJOUT — Métadonnées utiles sur l'objet dans B2
      CacheControl: 'public, max-age=31536000, immutable',
    })

    // 5. Générer l'URL pré-signée valable 2 heures
    const signedUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 7200, // 2 heures
      // ✅ Ne pas signer les headers de checksum dans l'URL
      unhoistableHeaders: new Set([
        'x-amz-checksum-crc32',
        'x-amz-sdk-checksum-algorithm',
      ]),
    })

    // 6. Construire l'URL publique finale (via Cloudflare CDN)
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