/**
 * lib/b2.ts — Client Backblaze B2 Cloud Storage
 * Compatible S3 via @aws-sdk/client-s3
 * Région EU Central (Amsterdam) — la plus proche de l'Afrique de l'Ouest
 *
 * CORRECTIONS APPLIQUÉES (Audit 2026-04-22) :
 *  - Ajout de la variable B2_KEY_ID manquante dans .env.local.example
 *  - Désactivation checksum CRC32 (non supporté par B2)
 *  - Désactivation useGlobalEndpoint pour éviter la résolution AWS
 *  - forcePathStyle obligatoire pour Backblaze S3-compatible
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
    // Obligatoire pour Backblaze B2 (pas de virtual-hosted-style)
    forcePathStyle: true,
    // ✅ CORRECTION CRITIQUE — Désactive le checksum CRC32 automatique
    // Le SDK AWS v3 récent l'active par défaut.
    // Backblaze B2 ne le supporte pas → cause ERR_FAILED sur le PUT
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    // ✅ Évite que le SDK resolve vers des endpoints AWS au lieu de B2
    useGlobalEndpoint: false,
    // ✅ AJOUT — Timeout réseau adapté connexions Afrique de l'Ouest
    requestHandler: {
      requestTimeout: 7200000, // 2 heures max
      connectionTimeout: 30000, // 30s connexion
    } as never,
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