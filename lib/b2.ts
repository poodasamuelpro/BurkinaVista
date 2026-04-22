/**
 * lib/b2.ts — Client Backblaze B2 Cloud Storage
 * Compatible S3 via @aws-sdk/client-s3
 * Région EU Central (Amsterdam) — la plus proche de l'Afrique de l'Ouest
 *
 * VERSION FINALE VALIDÉE — Audit comparatif 2026-04-22
 *
 * CORRECTIONS APPLIQUÉES :
 *  [B2-01] Ajout B2_KEY_ID manquant dans les vérifications env (était absent de .env.local.example)
 *  [B2-02] Désactivation checksum CRC32 (WHEN_REQUIRED) — non supporté par B2
 *  [B2-03] useGlobalEndpoint: false — évite que le SDK resolve vers AWS au lieu de B2
 *  [B2-04] forcePathStyle: true — obligatoire pour Backblaze S3-compatible
 *  [B2-05] requestTimeout: 300000 (5 min) — AUDIT original avait 7200000ms (2h) ce qui peut
 *          bloquer les Vercel Functions (max 60s en free, 300s en Pro). Ce client est utilisé
 *          UNIQUEMENT pour signer l'URL → 5 min est largement suffisant.
 *          L'upload client→B2 direct n'est PAS limité par ce timeout.
 *  [B2-06] Instructions CORS B2 complètes (avec etag, authorization dans allowedHeaders)
 *
 * DÉCISION CORS :
 *   Si le bucket B2 a déjà été configuré via CLI (b2 update-bucket / b2 put-bucket-cors),
 *   NE PAS reconfigurer manuellement. Vérifier avec :
 *   b2 get-bucket <nom-bucket> | grep -A 30 "corsRules"
 *   Si les règles sont absentes, ajouter celles ci-dessous.
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
    // L'upload réel client→B2 utilise XHR avec timeout 2h configuré côté frontend
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

export function getB2PublicUrl(): string {
  if (!process.env.B2_PUBLIC_URL) throw new Error('[b2] B2_PUBLIC_URL est manquant (env var)')
  return process.env.B2_PUBLIC_URL.replace(/\/$/, '').trim()
}

/**
 * [B2-06] Instructions CORS B2
 * À configurer dans la console Backblaze B2 SI les règles CORS ne sont pas déjà présentes.
 *
 * Via API B2 native (b2_update_bucket / b2 update-bucket) :
 * corsRules: [
 *   {
 *     "corsRuleName": "BurkinaVistaPlayer",
 *     "allowedOrigins": [
 *       "https://burkina-vista.vercel.app",
 *       "https://burkinavistabf.poodasamuel.com",
 *       "http://localhost:3000"
 *     ],
 *     "allowedOperations": ["b2_download_file_by_name", "s3_get"],
 *     "allowedHeaders": ["range", "content-type", "authorization"],
 *     "exposeHeaders": ["content-length", "content-range", "accept-ranges", "etag"],
 *     "maxAgeSeconds": 86400
 *   }
 * ]
 *
 * Vérifier si déjà configuré :
 *   b2 get-bucket <nom-bucket> | grep -A 30 "corsRules"
 *
 * Alternative Cloudflare CDN (si B2 est derrière Cloudflare) :
 *   Règle de transformation de réponse : ajouter "Access-Control-Allow-Origin: *"
 */
