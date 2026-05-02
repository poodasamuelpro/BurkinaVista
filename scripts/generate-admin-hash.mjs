#!/usr/bin/env node
/**
 * scripts/generate-admin-hash.mjs
 *
 * Utilitaire pour générer un hash scrypt à coller dans la variable
 * d'environnement Vercel ADMIN_PASSWORD_HASH.
 *
 * Usage :
 *   node scripts/generate-admin-hash.mjs "mon-mot-de-passe-fort"
 *
 * Sortie :
 *   ADMIN_PASSWORD_HASH=scrypt$16384$8$1$<saltBase64>$<hashBase64>
 *
 * Une fois copié dans Vercel (Settings → Environment Variables), la route
 * /api/admin-login utilisera automatiquement ce hash et ignorera l'ancienne
 * variable ADMIN_PASSWORD (qui peut alors être supprimée).
 */
import crypto from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(crypto.scrypt)

const SCRYPT_N = 16384
const SCRYPT_r = 8
const SCRYPT_p = 1
const KEY_LEN = 64

async function main() {
  const password = process.argv[2]

  if (!password || password.length < 8) {
    console.error('Usage : node scripts/generate-admin-hash.mjs "<mot-de-passe>"')
    console.error('Le mot de passe doit faire au moins 8 caractères.')
    process.exit(1)
  }

  const salt = crypto.randomBytes(16)
  const derived = await scryptAsync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
    maxmem: 128 * SCRYPT_N * SCRYPT_r * 2,
  })

  const encoded = [
    'scrypt',
    SCRYPT_N,
    SCRYPT_r,
    SCRYPT_p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$')

  console.log('')
  console.log('✅ Hash généré avec succès.')
  console.log('')
  console.log('Copiez la ligne ci-dessous dans Vercel → Settings → Environment Variables :')
  console.log('')
  console.log(`ADMIN_PASSWORD_HASH=${encoded}`)
  console.log('')
  console.log('Une fois la variable créée, vous pouvez supprimer ADMIN_PASSWORD.')
  console.log('Le code utilisera automatiquement le hash si présent.')
  console.log('')
}

main().catch((err) => {
  console.error('Erreur :', err)
  process.exit(1)
})
