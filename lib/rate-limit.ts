/**
 * lib/rate-limit.ts — Rate limiting par IP via Upstash Redis (REST API)
 *
 * AJOUT (Audit 2026-05-01) :
 *  Mise en place d'un mécanisme de rate-limiting léger sur les endpoints publics
 *  et le login admin pour protéger contre brute-force et spam.
 *
 *  Caractéristiques :
 *   - Utilise Upstash Redis (offre gratuite, 10 000 commandes/jour)
 *   - Sliding window simple via INCR + EXPIRE (atomique côté serveur Redis)
 *   - Aucun impact sur la latence d'upload : le rate-check est exécuté avant
 *     toute opération coûteuse (Cloudinary, B2, Gemini, …)
 *   - Failsafe : si Upstash est injoignable ou non configuré, le rate-limiting
 *     est désactivé silencieusement (log warning) pour ne pas bloquer le service
 *   - Identité = première IP du header x-forwarded-for (Vercel) ou fallback
 *
 *  Variables d'environnement :
 *   UPSTASH_REDIS_REST_URL     — ex. https://eu1-xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN   — token REST (read+write)
 *
 *  Si non configurées, le rate-limiting est inactif (NoOp). Le code reste
 *  100% fonctionnel sans Upstash, ce qui permet un déploiement progressif.
 */
import type { NextRequest } from 'next/server'

export interface RateLimitConfig {
  /** Nombre max de requêtes autorisées dans la fenêtre */
  limit: number
  /** Fenêtre glissante en secondes */
  windowSec: number
  /** Préfixe de clé Redis pour identifier l'endpoint */
  prefix: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number   // timestamp unix (s) de fin de fenêtre
  limit: number
}

/** Presets prêts à l'emploi pour les endpoints connus */
export const RATE_LIMITS = {
  ADMIN_LOGIN:        { limit: 5,   windowSec: 300,  prefix: 'rl:admin-login'   } as RateLimitConfig,
  UPLOAD_PHOTO:       { limit: 10,  windowSec: 600,  prefix: 'rl:upload-photo'  } as RateLimitConfig,
  VIDEO_UPLOAD_URL:   { limit: 5,   windowSec: 600,  prefix: 'rl:video-url'     } as RateLimitConfig,
  VIDEO_SAVE:         { limit: 10,  windowSec: 600,  prefix: 'rl:video-save'    } as RateLimitConfig,
  CONTACT:            { limit: 5,   windowSec: 600,  prefix: 'rl:contact'       } as RateLimitConfig,
  NEWSLETTER:         { limit: 5,   windowSec: 600,  prefix: 'rl:newsletter'    } as RateLimitConfig,
  REPORT:             { limit: 10,  windowSec: 3600, prefix: 'rl:report'        } as RateLimitConfig,
} as const

/**
 * Récupère l'adresse IP du client en se basant sur les headers Vercel/Cloudflare.
 * Tombe en fallback sur 'unknown' si rien n'est disponible.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = (req as Request).headers
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    // Premier item de la liste = IP réelle (le reste = proxies)
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp.trim()
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()
  return 'unknown'
}

/**
 * Vérifie qu'Upstash est correctement configuré.
 * Retourne false sans erreur si les variables d'env sont manquantes.
 */
function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

/**
 * Exécute une commande Redis via l'API REST d'Upstash.
 * Timeout court (1.5s) pour ne jamais bloquer la requête : si Upstash met
 * trop de temps à répondre, on autorise (failsafe).
 */
async function upstashCommand(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`Upstash HTTP ${res.status}`)
    }
    const data = (await res.json()) as { result?: unknown; error?: string }
    if (data.error) throw new Error(`Upstash: ${data.error}`)
    return data.result
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Pipeline atomique INCR + EXPIRE — exécuté en une seule requête HTTP.
 * Retourne [count, ttl] si succès, null en cas d'erreur ou de conf manquante.
 */
async function incrAndExpire(
  key: string,
  windowSec: number
): Promise<[number, number] | null> {
  if (!isUpstashConfigured()) return null

  const url = process.env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
        ['TTL', key],
      ]),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ result?: number; error?: string }>
    const count = data?.[0]?.result
    const ttl = data?.[2]?.result
    if (typeof count !== 'number' || typeof ttl !== 'number') return null
    return [count, ttl > 0 ? ttl : windowSec]
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Applique un rate-limit pour la combinaison (config.prefix + identifier).
 *
 * Failsafe : si Upstash n'est pas configuré ou ne répond pas, on autorise
 * la requête (on ne bloque jamais l'utilisateur en cas de panne externe).
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!isUpstashConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[rate-limit] UPSTASH non configuré — rate-limiting désactivé')
    }
    return {
      success: true,
      remaining: config.limit,
      reset: Math.floor(Date.now() / 1000) + config.windowSec,
      limit: config.limit,
    }
  }

  const key = `${config.prefix}:${identifier}`
  const result = await incrAndExpire(key, config.windowSec)

  // Failsafe en cas d'erreur Upstash : on autorise
  if (result === null) {
    console.warn('[rate-limit] Upstash indisponible — requête autorisée par failsafe')
    return {
      success: true,
      remaining: config.limit,
      reset: Math.floor(Date.now() / 1000) + config.windowSec,
      limit: config.limit,
    }
  }

  const [count, ttl] = result
  const remaining = Math.max(0, config.limit - count)
  const reset = Math.floor(Date.now() / 1000) + ttl

  return {
    success: count <= config.limit,
    remaining,
    reset,
    limit: config.limit,
  }
}

/**
 * Helper pratique : applique le rate-limit basé sur l'IP du client.
 */
export async function rateLimitByIp(
  req: NextRequest | Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  return checkRateLimit(ip, config)
}

/**
 * Construit les headers HTTP standards (RFC draft) à inclure dans la réponse.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  }
}
