/**
 * next.config.js
 *
 * VERSION FINALE VALIDÉE — Audit 2026-05-01
 *
 * CORRECTIONS APPLIQUÉES :
 *  [CFG-01] Cache images : minimumCacheTTL 86400 (24h) → 2592000 (30 jours)
 *  [CFG-02] CORS sur les routes API (/api/*)
 *  [CFG-03] X-Frame-Options: SAMEORIGIN au lieu de DENY
 *  [CFG-04] Cache API download : no-store pour éviter la mise en cache des URLs signées
 *  [CFG-05] Cache assets publics statiques (/static/*) : 30 jours
 *  [CFG-06] serverComponentsExternalPackages conservé (Next 14 compatible)
 *
 *  AUDIT 2026-05-01 — NOUVELLES CORRECTIONS :
 *  [CFG-07] Ajout en-tête HSTS (Strict-Transport-Security)
 *           Force HTTPS pendant 2 ans + includeSubDomains + preload
 *  [CFG-08] Ajout Content-Security-Policy
 *           Politique cohérente avec les services tiers utilisés :
 *            - Cloudinary (images)
 *            - Backblaze B2 + sous-domaine CDN Cloudflare (vidéos)
 *            - Google Generative AI (Gemini) — appels server-side uniquement
 *            - Resend — appels server-side uniquement
 *            - Cloudflare Turnstile (challenges + iframe)
 *            - Google sitemap ping (form-action)
 *           Note : 'unsafe-inline' est nécessaire pour les styles Tailwind
 *           inlinés et les attributs style="" générés par framer-motion.
 *           'unsafe-eval' est nécessaire pour Next.js en développement
 *           uniquement (désactivé en production).
 */

const isProd = process.env.NODE_ENV === 'production'

/**
 * Construction de la CSP — chaque directive sur sa propre clé pour lisibilité.
 * Cloudflare Turnstile : challenges.cloudflare.com (script + iframe + connect).
 */
function buildCsp() {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Next.js inline scripts (Server Components, JSON-LD)
      ...(isProd ? [] : ["'unsafe-eval'"]), // Next dev mode uniquement
      'https://challenges.cloudflare.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Tailwind inline + framer-motion style="..."
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://*.backblazeb2.com',
      'https://burkinavistabf.poodasamuel.com',
    ],
    'media-src': [
      "'self'",
      'blob:',
      'https://*.backblazeb2.com',
      'https://burkinavistabf.poodasamuel.com',
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://*.backblazeb2.com',                  // upload pre-signed B2
      'https://burkinavistabf.poodasamuel.com',     // CDN B2
      'https://res.cloudinary.com',                 // Cloudinary delivery
      'https://api.cloudinary.com',                 // Cloudinary upload (côté serveur, mais pour le check)
      'https://challenges.cloudflare.com',          // Turnstile siteverify côté client
      'https://*.sentry.io',                        // Sentry reporting
      'https://*.ingest.de.sentry.io',              // Sentry EU ingest
    ],
    'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  }

  if (isProd) {
    // En production, force HTTPS sur toutes les requêtes mixtes
    directives['upgrade-insecure-requests'] = []
  }

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(' ')}` : key
    )
    .join('; ')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      { protocol: 'https', hostname: 'burkinavistabf.poodasamuel.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'burkina-vista.vercel.app',
        'burkinavistabf.poodasamuel.com',
      ],
      bodySizeLimit: '25mb',
    },
    serverComponentsExternalPackages: ['@neondatabase/serverless', 'sharp'],
  },

  async headers() {
    const allowedOriginsStr = [
      'https://burkina-vista.vercel.app',
      'https://burkinavistabf.poodasamuel.com',
    ].join(', ')

    const csp = buildCsp()

    return [
      // ── Sécurité globale ──────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          // [CFG-07] HSTS — force HTTPS pendant 2 ans + sous-domaines + preload
          // Activé uniquement en production pour ne pas casser localhost/HTTP local
          ...(isProd
            ? [{
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
              }]
            : []),
          // [CFG-08] Content-Security-Policy cohérente avec les services tiers
          { key: 'Content-Security-Policy', value: csp },
        ],
      },

      // ── CORS sur les routes API ──────────────────────────────────
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? allowedOriginsStr : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-Turnstile-Token',
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age',          value: '86400' },
        ],
      },

      // ── Cache no-store pour /api/download ─────────────────────────
      {
        source: '/api/download',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache' },
        ],
      },

      // ── Cache long durée pour assets Next.js statiques ───────────
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // ── Cache 30 jours pour assets publics ───────────────────────
      {
        source: '/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
}

const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

// [SENTRY] withSentryConfig enveloppe withNextIntl pour monitoring
const { withSentryConfig } = require("@sentry/nextjs")

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  // Organisation et projet Sentry
  org: "poodasamuelpro",
  project: "burkinavista-ng",

  // Pas d'upload de source maps (auth-token géré via env Vercel)
  silent: true,

  // Tunnel Sentry via le serveur Next.js (contourne les ad-blockers)
  tunnelRoute: "/monitoring",

  // Masque les source maps côté client
  hideSourceMaps: true,
})
