/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — photos
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Backblaze B2 — vidéos (bucket public EU Central)
      { protocol: 'https', hostname: '*.backblazeb2.com' },
      // Sous-domaine CDN Cloudflare devant Backblaze
      { protocol: 'https', hostname: 'burkinavista.poodasamuel.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'burkina-vista.vercel.app',
        'burkinavista.poodasamuel.com',
      ],
    },
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
}

const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./i18n.ts')

module.exports = withNextIntl(nextConfig)
