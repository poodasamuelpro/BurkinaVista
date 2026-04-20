/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'customer-*.cloudflarestream.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'burkina-vista.vercel.app'] },
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
}

module.exports = nextConfig