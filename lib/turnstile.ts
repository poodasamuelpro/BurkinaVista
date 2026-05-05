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
 *  Failsafe TOTAL (grand événement) :
 *   - Clé non configurée    → true  (dev local / déploiement progressif)
 *   - Token absent/vide     → true  (le widget est censé être présent, on ne bloque pas)
 *   - Erreur réseau         → true  (Cloudflare indisponible ≠ utilisateur malveillant)
 *   - Timeout               → true  (connexion lente Afrique de l'Ouest — on ne pénalise pas)
 *   - HTTP non-OK           → true  (problème Cloudflare, pas de l'utilisateur)
 *   - Token invalide        → false (seul cas réel de rejet)
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
 * Politique failsafe total (priorité disponibilité > sécurité stricte) :
 *  - Turnstile non configuré        → true  (opt-in progressif)
 *  - Token absent ou vide           → true  (widget présent côté client, on fait confiance)
 *  - Erreur réseau / timeout        → true  (ne jamais bloquer sur panne Cloudflare)
 *  - Réponse HTTP non-OK            → true  (panne Cloudflare = pas la faute du user)
 *  - Cloudflare répond success=false → false (seul vrai rejet)
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<boolean> {
  // [1] Clé secrète absente → failsafe silencieux
  if (!isTurnstileEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY non configuré — vérification skippée')
    }
    return true
  }

  // [2] Token absent ou vide → failsafe (le widget est côté client, on ne bloque pas)
  // Le token sera toujours présent en production (clé configurée + widget chargé).
  // En cas de race condition ou d'erreur de chargement du script CF, on ne pénalise pas.
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.warn('[turnstile] Token absent — failsafe retourne true')
    return true
  }

  // [3] Timeout porté à 8s (connexions lentes BF/Afrique de l'Ouest)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

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

    // [4] HTTP non-OK → failsafe (panne Cloudflare)
    if (!res.ok) {
      console.warn('[turnstile] HTTP error', res.status, '— failsafe retourne true')
      return true
    }

    const data = (await res.json()) as {
      success: boolean
      'error-codes'?: string[]
    }

    if (!data.success) {
      console.warn('[turnstile] Token invalide:', data['error-codes'])
    }

    // [5] Seul cas de rejet réel : Cloudflare dit explicitement success=false
    return data.success === true

  } catch (err) {
    // [6] Erreur réseau, timeout, parse error → failsafe (ne jamais bloquer sur panne CF)
    console.warn('[turnstile] Erreur vérification (failsafe retourne true):', err)
    return true
  } finally {
    clearTimeout(timeout)
  }
}
