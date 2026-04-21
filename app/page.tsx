/**
 * app/page.tsx — Page d'accueil
 * Grille de médias avec filtrage et pagination
 * Bilingue via next-intl — textes traduits
 */
import { Suspense } from 'react'
import { queryMany, queryOne } from '@/lib/db'
import { getTranslations } from 'next-intl/server'
import HeroSection from '@/components/photos/HeroSection'
import PhotoGrid from '@/components/photos/PhotoGrid'
import CategoriesBar from '@/components/photos/CategoriesBar'
import StatsBar from '@/components/photos/StatsBar'
import type { Media, Categorie } from '@/types'

interface HomePageProps {
  searchParams: { q?: string; categorie?: string; type?: string; page?: string }
}

// On garde force-dynamic uniquement si filtres actifs,
// sinon on laisse Next.js cacher la page 60s
export const revalidate = 60

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, categorie, type, page: pageStr } = searchParams
  const page = parseInt(pageStr || '1')
  const limit = 24 // réduit de 30 à 24 — moins de requêtes Cloudinary au premier rendu
  const offset = (page - 1) * limit
  const t = await getTranslations('home')

  // Construction de la requête dynamique
  const conditions: string[] = ["statut = 'approved'"]
  const params: unknown[] = []
  let paramIdx = 1

  if (q) {
    conditions.push(
      `(titre ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR ville ILIKE $${paramIdx})`
    )
    params.push(`%${q}%`)
    paramIdx++
  }
  if (categorie) {
    conditions.push(`categorie = $${paramIdx}`)
    params.push(categorie)
    paramIdx++
  }
  if (type) {
    conditions.push(`type = $${paramIdx}`)
    params.push(type)
    paramIdx++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Toutes les requêtes en parallèle — on sépare le COUNT pour ne pas bloquer les médias
  const [medias, countResult, categories, statsResult] = await Promise.all([
    queryMany<Media>(
      // On sélectionne uniquement les colonnes nécessaires pour la grille
      // (pas description_en, alt_text_en etc. qui alourdissent inutilement)
      `SELECT id, type, cloudinary_url, thumbnail_url, slug, titre,
              alt_text, tags, categorie, ville, width, height,
              contributeur_prenom, contributeur_nom, licence, views, downloads
       FROM medias ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
    queryOne<{ total: string }>(
      `SELECT COUNT(*)::text as total FROM medias ${whereClause}`,
      params
    ),
    queryMany<Categorie>('SELECT * FROM categories ORDER BY nom ASC'),
    queryOne<{ photos: string; videos: string; contributeurs: string }>(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'photo' AND statut = 'approved')::text as photos,
        COUNT(*) FILTER (WHERE type = 'video' AND statut = 'approved')::text as videos,
        (SELECT COUNT(*)::text FROM contributeurs) as contributeurs
      FROM medias
    `),
  ])

  const total = Number(countResult?.total || 0)

  return (
    <div>
      {!q && !categorie && page === 1 && (
        <>
          <HeroSection featuredMedias={medias.slice(0, 5)} />
          <StatsBar
            photos={Number(statsResult?.photos || 0)}
            videos={Number(statsResult?.videos || 0)}
            contributors={Number(statsResult?.contributeurs || 0)}
          />
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoriesBar
          categories={categories}
          activeCategory={categorie}
          activeType={type}
          searchQuery={q}
        />

        {q && (
          <div className="mb-8">
            <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
              {t('results_for')}{' '}
              <span className="text-gradient-gold">"{q}"</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {total} {total > 1 ? t('medias_found') : t('media_found')}
            </p>
          </div>
        )}

        <Suspense fallback={<PhotoGridSkeleton />}>
          <PhotoGrid
            medias={medias}
            total={total}
            page={page}
            limit={limit}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  )
}

function PhotoGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="skeleton rounded-2xl"
          style={{ height: `${200 + (i % 3) * 50}px` }}
        />
      ))}
    </div>
  )
}
