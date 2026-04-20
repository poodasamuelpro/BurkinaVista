import { MetadataRoute } from 'next'
import { queryMany } from '@/lib/db'
import type { Media, Categorie } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques bilingues
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/upload`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/licences`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/cgu`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/confidentialite`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    // Médias approuvés
    const medias = await queryMany<Media>(
      `SELECT slug, updated_at, created_at FROM medias WHERE statut = 'approved' ORDER BY created_at DESC LIMIT 2000`
    )

    const mediaPages: MetadataRoute.Sitemap = medias.map((m) => ({
      url: `${APP_URL}/photos/${m.slug}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : new Date(m.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    // Catégories
    const categories = await queryMany<Categorie>(
      `SELECT slug FROM categories ORDER BY nom ASC`
    )

    const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${APP_URL}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...mediaPages, ...categoryPages]
  } catch {
    return staticPages
  }
}
