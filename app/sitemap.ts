import { createServerSupabaseClient } from '@/lib/supabase'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fasostock.com'

  // Fetch all approved medias
  const { data: medias } = await supabase
    .from('medias')
    .select('slug, created_at, updated_at')
    .eq('statut', 'approved')
    .order('created_at', { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  const mediaUrls: MetadataRoute.Sitemap = (medias || []).map((m) => ({
    url: `${baseUrl}/photos/${m.slug}`,
    lastModified: new Date(m.updated_at || m.created_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/upload`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    ...categoryUrls,
    ...mediaUrls,
  ]
}
