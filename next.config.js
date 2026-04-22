/**
 * next.config.js
 *
 * VERSION FINALE VALIDÉE — Audit comparatif 2026-04-22
 *
 * CORRECTIONS APPLIQUÉES :
 *  [CFG-01] Cache images : minimumCacheTTL 86400 (24h) → 2592000 (30 jours)
 *           Demande explicite utilisateur : cache 30 jours pour images
 *  [CFG-02] CORS sur les routes API (/api/*) — ABSENT dans AUDIT original et GitHub
 *           La page /upload appelle /api/videos/upload-url en cross-origin depuis
 *           certains navigateurs/proxies → bloqé sans ces headers
 *           Note : CORS en route-handler (OPTIONS dans chaque route) reste la méthode
 *           principale ; next.config.js ajoute les headers en complément
 *  [CFG-03] X-Frame-Options: SAMEORIGIN au lieu de DENY
 *           DENY bloque les iframes sur le même domaine (ex: admin panel)
 *           SAMEORIGIN est plus permissif tout en restant sécurisé
 *  [CFG-04] Cache API download : no-store pour éviter la mise en cache des URLs signées
 *  [CFG-05] Cache assets publics statiques (/static/*) : 30 jours
 *  [CFG-06] serverComponentsExternalPackages conservé (Next 14 compatible)
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — photos
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Backblaze B2 — accès direct bucket (fallback si CDN indisponible)
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      // Sous-domaine CDN Cloudflare devant Backblaze — URL publique vidéos
      { protocol: 'https', hostname: 'burkinavistabf.poodasamuel.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // [CFG-01] Cache 30 jours (2 592 000 secondes) pour les images optimisées
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
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },

  async headers() {
    // [CFG-02] Origines CORS autorisées
    const allowedOriginsStr = [
      'https://burkina-vista.vercel.app',
      'https://burkinavistabf.poodasamuel.com',
    ].join(', ')

    return [
      // ── Sécurité globale ──────────────────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          // [CFG-03] SAMEORIGIN plutôt que DENY (DENY bloque iframes admin)
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',         value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },

      // ── [CFG-02] CORS sur les routes API ─────────────────────────
      // Complément aux handlers OPTIONS dans les routes individuelles
      // Permet les requêtes cross-origin depuis la page /upload
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // En production : origines explicites (séparées par virgule)
            // En développement : wildcard pour simplifier
            value: process.env.NODE_ENV === 'production' ? allowedOriginsStr : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24h cache preflight
          },
        ],
      },

      // ── [CFG-04] Cache no-store pour /api/download ────────────────
      // Les URLs de téléchargement signées changent à chaque requête → pas de cache
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

      // ── [CFG-05] Cache 30 jours pour assets publics ───────────────
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

module.exports = withNextIntl(nextConfig)