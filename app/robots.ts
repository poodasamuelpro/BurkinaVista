import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://burkina-vista.vercel.app/sitemap.xml',
    host: 'https://burkina-vista.vercel.app',
  }
}
