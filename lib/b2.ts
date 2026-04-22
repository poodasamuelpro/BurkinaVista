/**
 * lib/b2.ts — Client Backblaze B2 Cloud Storage
 * Compatible S3 via @aws-sdk/client-s3
 * Région EU Central (Amsterdam) — la plus proche de l'Afrique de l'Ouest
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  AUDIT BurkinaVista — 2026-04-22                               ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  CORRECTIONS APPLIQUÉES :                                        ║
 * ║  [B2-01] B2_KEY_ID manquant dans .env.local.example             ║
 * ║  [B2-02] Désactivation checksum CRC32 (WHEN_REQUIRED)           ║
 * ║          non supporté par B2, causait ERR_FAILED sur PUT        ║
 * ║  [B2-03] useGlobalEndpoint: false                               ║
 * ║          évite résolution vers endpoints AWS                    ║
 * ║  [B2-04] forcePathStyle: true — obligatoire pour Backblaze B2   ║
 * ║  [B2-05] requestTimeout: 300000 (5 min) — AUDIT original avait  ║
 * ║          7200000ms (2h) incompatible avec Vercel Functions        ║
 * ║  [B2-06] getB2PublicUrl() : validation et commentaire sur le     ║
 * ║          format CORRECT de B2_PUBLIC_URL (voir .env.local.example)║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ROOT CAUSE DES 404 VIDÉO — EXPLICATION COMPLÈTE               ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  DNS CNAME : burkinavistabf → burkinavista-videos.              ║
 * ║              s3.eu-central-003.backblazeb2.com (S3 API)         ║
 * ║                                                                  ║
 * ║  Cloudflare proxifie ce CNAME (Proxy=ON).                        ║
 * ║                                                                  ║
 * ║  L'endpoint S3 de B2 sert les fichiers en path-style :          ║
 * ║    /{bucket}/{key}                                               ║
 * ║  MAIS Cloudflare ne route que le chemin natif B2 :              ║
 * ║    /file/{bucket}/{key}                                          ║
 * ║                                                                  ║
 * ║  RÉSULTAT :                                                      ║
 * ║  ❌ https://cdn.poodasamuel.com/videos/xxx.mp4 → 404            ║
 * ║     (chemin S3 direct, non routé par Cloudflare)                 ║
 * ║  ✅ https://cdn.poodasamuel.com/file/burkinavista-videos/        ║
 * ║        videos/xxx.mp4 → 200 (chemin natif B2)                   ║
 * ║                                                                  ║
 * ║  FIX : Définir dans Vercel (et .env.local) :                    ║
 * ║    B2_PUBLIC_URL=https://burkinavistabf.poodasamuel.com          ║
 * ║                  /file/burkinavista-videos                       ║
 * ║  (en une seule ligne, sans espace)                               ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
import { S3Client } from '@aws-sdk/client-s3'

export function getB2Client(): S3Client {
  if (!process.env.B2_KEY_ID)     throw new Error('[b2] B2_KEY_ID est manquant (env var)')
  if (!process.env.B2_APP_KEY)    throw new Error('[b2] B2_APP_KEY est manquant (env var)')
  if (!process.env.B2_ENDPOINT)   throw new Error('[b2] B2_ENDPOINT est manquant (env var)')

  return new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: 'eu-central-003',
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APP_KEY,
    },
    // [B2-04] Obligatoire pour Backblaze B2 (pas de virtual-hosted-style)
    forcePathStyle: true,
    // [B2-02] Désactive le checksum CRC32 automatique (non supporté par B2)
    // Le SDK AWS v3 récent l'active par défaut → cause ERR_FAILED sur PUT
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    // [B2-03] Évite résolution vers endpoints AWS
    useGlobalEndpoint: false,
    // [B2-05] Timeout réduit à 5 min (génération URL signée seulement, pas l'upload vidéo)
    // L'upload réel client→B2 utilise XHR avec timeout configuré côté frontend
    requestHandler: {
      requestTimeout: 300000,   // 5 min — compatible Vercel Functions Pro (300s)
      connectionTimeout: 30000, // 30s pour établir la connexion
    } as never,
  })
}

export function getB2BucketName(): string {
  if (!process.env.B2_BUCKET_NAME) throw new Error('[b2] B2_BUCKET_NAME est manquant (env var)')
  return process.env.B2_BUCKET_NAME.trim()
}

/**
 * Retourne le préfixe public CDN pour construire les URLs de vidéos.
 *
 * VALEUR ATTENDUE (Vercel env var) :
 *   B2_PUBLIC_URL=https://burkinavistabf.poodasamuel.com/file/burkinavista-videos
 *
 * Usage dans le code :
 *   const publicUrl = `${getB2PublicUrl()}/${b2Key}`
 *   // => https://burkinavistabf.poodasamuel.com/file/burkinavista-videos/videos/xxx.mp4
 *   // => HTTP 200 ✅ via Cloudflare CDN
 *
 * NE PAS utiliser :
 *   B2_PUBLIC_URL=https://burkinavistabf.poodasamuel.com   ← manque /file/{bucket}
 *   // => https://burkinavistabf.poodasamuel.com/videos/xxx.mp4
 *   // => HTTP 404 ❌ chemin non reconnu par Cloudflare/B2
 */
export function getB2PublicUrl(): string {
  if (!process.env.B2_PUBLIC_URL) throw new Error('[b2] B2_PUBLIC_URL est manquant (env var)')
  const url = process.env.B2_PUBLIC_URL.replace(/\/$/, '').trim()

  // Avertissement si le format semble incorrect (manque /file/{bucket})
  if (process.env.NODE_ENV === 'development' && !url.includes('/file/')) {
    console.warn(
      '[b2] ATTENTION : B2_PUBLIC_URL ne contient pas "/file/{bucket}". ' +
      'Les URLs vidéo seront probablement en 404. ' +
      'Valeur attendue : https://cdn.exemple.com/file/nom-du-bucket'
    )
  }

  return url
}