/**
 * lib/auth.ts — Authentification JWT avec jose
 * Gère les tokens admin et les tokens de modération
 */
import { SignJWT, jwtVerify } from 'jose'

// Clé secrète encodée
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET non défini dans les variables d\'environnement')
  return new TextEncoder().encode(secret)
}

// ============================================================
// TOKENS ADMIN
// ============================================================

/**
 * Crée un token JWT pour l'admin
 * Expire après 24h
 */
export async function createAdminToken(): Promise<string> {
  return new SignJWT({
    role: 'admin',
    email: process.env.ADMIN_EMAIL,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
}

/**
 * Vérifie un token JWT admin
 * Retourne true si valide, false sinon
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload.role === 'admin'
  } catch {
    return false
  }
}

// ============================================================
// TOKENS DE MODÉRATION (approve/reject via email)
// ============================================================

/**
 * Crée un token JWT pour la modération directe depuis l'email
 * Expire après 72h
 */
export async function createModerationToken(
  mediaId: string,
  action: 'approve' | 'reject'
): Promise<string> {
  return new SignJWT({
    mediaId,
    action,
    purpose: 'moderation',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('72h')
    .sign(getJwtSecret())
}

/**
 * Vérifie et décode un token de modération
 * Retourne { mediaId, action } si valide, null sinon
 */
export async function verifyModerationToken(
  token: string
): Promise<{ mediaId: string; action: 'approve' | 'reject' } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.purpose !== 'moderation') return null
    if (!payload.mediaId || !payload.action) return null
    if (payload.action !== 'approve' && payload.action !== 'reject') return null
    return {
      mediaId: payload.mediaId as string,
      action: payload.action as 'approve' | 'reject',
    }
  } catch {
    return null
  }
}

// ============================================================
// TOKENS NEWSLETTER (désabonnement)
// ============================================================

/**
 * Crée un token JWT pour le lien de désabonnement newsletter
 * Expire après 30 jours
 */
export async function createUnsubscribeToken(email: string): Promise<string> {
  return new SignJWT({
    email,
    purpose: 'unsubscribe',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret())
}

/**
 * Vérifie un token de désabonnement
 * Retourne l'email si valide, null sinon
 */
export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.purpose !== 'unsubscribe') return null
    return payload.email as string
  } catch {
    return null
  }
}
