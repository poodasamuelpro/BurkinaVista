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
    // ✅ AJOUT — Formats modernes optimisés (WebP + AVIF)
    formats: ['image/avif', 'image/webp'],
    // ✅ AJOUT — Taille minimale pour optimisation (évite sur-traitement petites images)
    minimumCacheTTL: 86400, // 24h cache images optimisées
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'burkina-vista.vercel.app',
        'burkinavistabf.poodasamuel.com',
      ],
      // ✅ AJOUT — Limite taille body serverActions (cohérent avec maxDuration=60)
      bodySizeLimit: '25mb',
    },
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
  // ✅ AJOUT — Headers de sécurité HTTP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache long durée pour les assets statiques Next.js
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

module.exports = withNextIntl(nextConfig)