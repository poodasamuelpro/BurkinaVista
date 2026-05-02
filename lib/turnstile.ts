/**
 * lib/turnstile.ts — Vérification des tokens Cloudflare Turnstile (captcha)
 *
 * AJOUT (Audit 2026-05-01) :
 *  Protection anti-spam invisible sur les formulaires publics (/upload, /contact)
 *  et le login admin. Cloudflare Turnstile est gratuit, n'allonge pas l'UX
 *  (challenge invisible dans la majorité des cas) et n'impose pas de captcha visuel.
 *
 *  Variables d'environnement :
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY   — clé site (publique, exposée au client)
 *   TURNSTILE_SECRET_KEY             — clé secrète (serveur uniquement)
 *
 *  Failsafe : si la TURNSTILE_SECRET_KEY n'est pas configurée, la vérification
 *  est skippée silencieusement (utile pour le développement local et le déploiement
 *  progressif). Le module reste totalement passif sans configuration.
 *
 *  Endpoint Cloudflare : https://challenges.cloudflare.com/turnstile/v0/siteverify
 */

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Indique si Turnstile est configuré côté serveur.
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

/**
 * Vérifie un token Turnstile auprès de Cloudflare.
 *
 *  - Si Turnstile n'est pas configuré → retourne true (failsafe / opt-in progressif)
 *  - Si Cloudflare met plus de 3s à répondre → retourne false (sécurité)
 *  - Si le token est manquant et Turnstile est actif → retourne false
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  if (!isTurnstileEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY non configuré — vérification skippée')
    }
    return true
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return false
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const params = new URLSearchParams()
    params.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    params.append('response', token)
    if (remoteIp) params.append('remoteip', remoteIp)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[turnstile] HTTP error', res.status)
      return false
    }

    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    if (!data.success) {
      console.warn('[turnstile] Token invalide:', data['error-codes'])
    }

    return data.success === true
  } catch (err) {
    console.error('[turnstile] Erreur vérification:', err)
    // En cas d'erreur réseau on refuse (sécurité par défaut)
    return false
  } finally {
    clearTimeout(timeout)
  }
}
