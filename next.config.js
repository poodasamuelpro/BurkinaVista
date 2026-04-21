/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — photos
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Backblaze B2 — accès direct bucket (fallback)
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      // Sous-domaine CDN Cloudflare devant Backblaze — URL publique vidéos
      { protocol: 'https', hostname: 'burkinavistabf.poodasamuel.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'burkina-vista.vercel.app',
        'burkinavistabf.poodasamuel.com',
      ],
    },
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
}

const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

module.exports = withNextIntl(nextConfig)
