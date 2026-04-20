/**
 * app/sitemap.ts — Sitemap dynamique
 * Sans Supabase — utilise Neon
 */
import { MetadataRoute } from 'next'
import { queryMany } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

  // Récupérer tous les médias approuvés
  const medias = await queryMany<{ slug: string; created_at: string; updated_at: string | null }>(
    "SELECT slug, created_at, updated_at FROM medias WHERE statut = 'approved' ORDER BY created_at DESC"
  )

  // Récupérer les catégories
  const categories = await queryMany<{ slug: string }>(
    'SELECT slug FROM categories ORDER BY nom ASC'
  )

  const mediaUrls: MetadataRoute.Sitemap = medias.map((m) => ({
    url: `${baseUrl}/photos/${m.slug}`,
    lastModified: new Date(m.updated_at || m.created_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/upload`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/categories`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...categoryUrls,
    ...mediaUrls,
  ]
}
