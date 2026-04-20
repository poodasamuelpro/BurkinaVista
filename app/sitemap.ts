/**
 * app/sitemap.ts — Sitemap dynamique
 * Sans Supabase — utilise Neon
 */
import { MetadataRoute } from 'next'
import { queryMany } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.com'

  let medias: { slug: string; created_at: string; updated_at: string | null }[] = []
  let categories: { slug: string }[] = []

  try {
    medias = await queryMany<{ slug: string; created_at: string; updated_at: string | null }>(
      "SELECT slug, created_at, updated_at FROM medias WHERE statut = 'approved' ORDER BY created_at DESC"
    )
  } catch (err) {
    console.error('[Sitemap] Erreur chargement medias:', err)
  }

  try {
    categories = await queryMany<{ slug: string }>(
      'SELECT slug FROM categories ORDER BY nom ASC'
    )
  } catch (err) {
    console.error('[Sitemap] Erreur chargement categories:', err)
  }

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
    // Pages principales
    { url: baseUrl,                           changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/categories`,           changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/upload`,               changeFrequency: 'monthly', priority: 0.6 },
    // Pages informatives
    { url: `${baseUrl}/about`,                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/guide`,                changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/licences`,             changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/cgu`,                  changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/confidentialite`,      changeFrequency: 'monthly', priority: 0.3 },
    // Catégories dynamiques
    ...categoryUrls,
    // Médias dynamiques
    ...mediaUrls,
  ]
}
