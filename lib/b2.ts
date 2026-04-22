/**
 * lib/b2.ts — Client Backblaze B2 Cloud Storage
 * Compatible S3 via @aws-sdk/client-s3
 * Région EU Central (Amsterdam) — la plus proche de l'Afrique de l'Ouest
 */
import { S3Client } from '@aws-sdk/client-s3'

export function getB2Client(): S3Client {
  if (!process.env.B2_KEY_ID) throw new Error('[b2] B2_KEY_ID is not defined.')
  if (!process.env.B2_APP_KEY) throw new Error('[b2] B2_APP_KEY is not defined.')
  if (!process.env.B2_ENDPOINT) throw new Error('[b2] B2_ENDPOINT is not defined.')

  return new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: 'eu-central-003',
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APP_KEY,
    },
    // Forcer le path-style pour Backblaze (obligatoire)
    forcePathStyle: true,
    // ✅ FIX CRITIQUE — Désactive le checksum CRC32 automatique
    // Le SDK AWS v3 récent l'active par défaut.
    // Backblaze B2 ne le supporte pas → cause ERR_FAILED sur le PUT
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    // ✅ FIX COMPLÉMENTAIRE — Désactive l'endpoint global AWS
    // Évite que le SDK resolve vers des endpoints AWS au lieu de B2
    useGlobalEndpoint: false,
  })
}

export function getB2BucketName(): string {
  if (!process.env.B2_BUCKET_NAME) throw new Error('[b2] B2_BUCKET_NAME is not defined.')
  return process.env.B2_BUCKET_NAME
}

export function getB2PublicUrl(): string {
  if (!process.env.B2_PUBLIC_URL) throw new Error('[b2] B2_PUBLIC_URL is not defined.')
  return process.env.B2_PUBLIC_URL.replace(/\/$/, '')
}