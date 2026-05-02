/**
 * lib/admin-password.ts — Vérification sécurisée du mot de passe admin
 *
 * AJOUT (Audit 2026-05-01) :
 *  Avant : `password === process.env.ADMIN_PASSWORD` (comparaison en clair,
 *  vulnérable au timing attack).
 *
 *  Après : deux modes supportés, dans cet ordre de priorité :
 *
 *  1) ADMIN_PASSWORD_HASH (recommandé)
 *     Variable d'environnement contenant le hash scrypt du mot de passe.
 *     Format : "scrypt$N$r$p$<saltBase64>$<hashBase64>" (généré par
 *     scripts/generate-admin-hash.mjs).
 *
 *  2) ADMIN_PASSWORD (legacy / migration progressive)
 *     Variable contenant le mot de passe en clair. Comparaison effectuée
 *     en temps constant (timingSafeEqual) pour éviter le timing attack.
 *     Un warning est loggé pour inciter à migrer vers le hash.
 *
 *  Pourquoi scrypt et pas bcrypt ?
 *   - bcrypt n'est pas installé (dépendance native, complexe sur Vercel)
 *   - scrypt est inclus dans le module 'crypto' standard de Node.js
 *   - scrypt est résistant au matériel spécialisé (mieux que PBKDF2)
 *   - Compatible 100% avec le runtime Node.js de Vercel sans dépendance
 *
 *  Pour générer un hash :
 *   node scripts/generate-admin-hash.mjs "mon-mot-de-passe"
 *
 *  La sortie peut ensuite être collée dans la variable Vercel ADMIN_PASSWORD_HASH.
 */
import crypto from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(crypto.scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>

/** Paramètres scrypt (valeurs raisonnables, ~100ms sur Vercel) */
const SCRYPT_N = 16384  // 2^14 — coût CPU/mémoire
const SCRYPT_r = 8
const SCRYPT_p = 1
const KEY_LEN = 64

/**
 * Compare deux Buffers/strings en temps constant pour éviter le timing attack.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8')
  const bufB = Buffer.from(b, 'utf-8')
  // Si les longueurs sont différentes, timingSafeEqual jette une erreur.
  // On padde alors à la longueur max et on retournera false in fine.
  if (bufA.length !== bufB.length) {
    // On effectue tout de même un compare pour stabiliser le timing
    const max = Math.max(bufA.length, bufB.length)
    const padA = Buffer.alloc(max)
    const padB = Buffer.alloc(max)
    bufA.copy(padA)
    bufB.copy(padB)
    crypto.timingSafeEqual(padA, padB)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Vérifie un mot de passe contre un hash scrypt encodé.
 * Format attendu : "scrypt$N$r$p$<saltBase64>$<hashBase64>"
 */
async function verifyScryptHash(password: string, encoded: string): Promise<boolean> {
  try {
    const parts = encoded.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false

    const N = parseInt(parts[1], 10)
    const r = parseInt(parts[2], 10)
    const p = parseInt(parts[3], 10)
    const salt = Buffer.from(parts[4], 'base64')
    const expectedHash = Buffer.from(parts[5], 'base64')

    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false
    if (salt.length === 0 || expectedHash.length === 0) return false

    const derived = await scryptAsync(password, salt, expectedHash.length, {
      N, r, p,
      // maxmem doit être supérieur à 128*N*r pour ne pas planter sur N élevés
      maxmem: 128 * N * r * 2,
    })

    if (derived.length !== expectedHash.length) return false
    return crypto.timingSafeEqual(derived, expectedHash)
  } catch (err) {
    console.error('[admin-password] Erreur vérification hash:', err)
    return false
  }
}

/**
 * Encode un mot de passe en hash scrypt utilisable dans ADMIN_PASSWORD_HASH.
 * Utilisé par scripts/generate-admin-hash.mjs.
 */
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const derived = await scryptAsync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_r,
    p: SCRYPT_p,
    maxmem: 128 * SCRYPT_N * SCRYPT_r * 2,
  })
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_r,
    SCRYPT_p,
    salt.toString('base64'),
    derived.toString('base64'),
  ].join('$')
}

/**
 * Vérifie un mot de passe candidat contre la configuration serveur.
 *
 * Ordre :
 *  1. ADMIN_PASSWORD_HASH (scrypt) si défini → vérification cryptographique
 *  2. ADMIN_PASSWORD (clair) sinon → comparaison constant-time + warning
 *
 * Retourne false si aucune des deux variables n'est définie.
 */
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  if (typeof candidate !== 'string' || candidate.length === 0) return false

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (hash && hash.startsWith('scrypt$')) {
    return verifyScryptHash(candidate, hash)
  }

  const plain = process.env.ADMIN_PASSWORD
  if (plain && plain.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[admin-password] ⚠️  ADMIN_PASSWORD utilisé en clair. ' +
        'Recommandation : migrer vers ADMIN_PASSWORD_HASH ' +
        '(voir scripts/generate-admin-hash.mjs).'
      )
    }
    return timingSafeEqualStr(candidate, plain)
  }

  console.error(
    '[admin-password] Aucun mot de passe configuré ' +
    '(ADMIN_PASSWORD_HASH ou ADMIN_PASSWORD requis)'
  )
  return false
}

/**
 * Indique si la configuration utilise le mode hash sécurisé.
 */
export function isAdminPasswordHashed(): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH
  return Boolean(hash && hash.startsWith('scrypt$'))
}
