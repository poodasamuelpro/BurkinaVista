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
 *
 * FIX 2026-05-05 — ROBUSTESSE MAXIMALE (grand lancement) :
 *  [TS-01] Token absent       → return true  (le widget est toujours chargé,
 *          un token absent est un cas de timing, pas une attaque)
 *  [TS-02] Erreur réseau      → return true  (panne Cloudflare ne doit jamais
 *          bloquer un upload légitime — rate-limit + magic bytes suffisent)
 *  [TS-03] Timeout (>5s)      → return true  (idem — connexions lentes BF)
 *  [TS-04] HTTP non-2xx       → return true  (failsafe idem)
 *  Principe : Turnstile est une couche de confort anti-bot, PAS une barrière
 *  bloquante. Les vraies protections sont : rate-limit IP, magic bytes, EXIF.
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
 * Politique failsafe — cette fonction NE RETOURNE JAMAIS false sauf si
 * Cloudflare confirme explicitement que le token est invalide/malicieux.
 * Tout autre cas (token absent, erreur réseau, timeout, HTTP 5xx) → true.
 *
 *  - Turnstile non configuré          → true  (opt-in progressif)
 *  - Token absent / vide              → true  [TS-01] (timing ou widget lent)
 *  - Timeout (>5s)                    → true  [TS-03] (connexion lente)
 *  - Erreur réseau                    → true  [TS-02] (panne Cloudflare)
 *  - HTTP non-2xx                     → true  [TS-04] (erreur côté CF)
 *  - success: false (token invalide)  → false (seul vrai rejet)
 *  - success: true                    → true
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  // Turnstile non configuré → skip silencieux
  if (!isTurnstileEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY non configuré — vérification skippée')
    }
    return true
  }

  // [TS-01] Token absent ou vide → on laisse passer (timing widget, connexion lente)
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.warn('[turnstile] Token absent — autorisé par failsafe [TS-01]')
    return true
  }

  const controller = new AbortController()
  // [TS-03] Timeout augmenté à 5s (connexions lentes Afrique de l'Ouest)
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const params = new URLSearchParams()
    params.append('secret', process.env.TURNSTILE_SECRET_KEY!)
    params.append('response', token.trim())
    if (remoteIp) params.append('remoteip', remoteIp)

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
      cache: 'no-store',
    })

    // [TS-04] HTTP non-2xx → failsafe (ne pas bloquer l'utilisateur)
    if (!res.ok) {
      console.warn('[turnstile] HTTP', res.status, '— autorisé par failsafe [TS-04]')
      return true
    }

    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    if (!data.success) {
      // Seul vrai rejet : Cloudflare confirme que le token est invalide
      console.warn('[turnstile] Token invalide (rejet Cloudflare):', data['error-codes'])
      return false
    }

    return true

  } catch (err) {
    // [TS-02] Erreur réseau ou timeout AbortError → failsafe
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    if (isTimeout) {
      console.warn('[turnstile] Timeout — autorisé par failsafe [TS-03]')
    } else {
      console.warn('[turnstile] Erreur réseau — autorisé par failsafe [TS-02]:', err)
    }
    return true
  } finally {
    clearTimeout(timeout)
  }
}
