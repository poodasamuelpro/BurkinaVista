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

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, categorie, type, page: pageStr } = searchParams
  const page = parseInt(pageStr || '1')
  const limit = 30
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

  // Récupérer les médias et le total en parallèle
  const [medias, countResult, categories, statsResult] = await Promise.all([
    queryMany<Media>(
      `SELECT * FROM medias ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    ),
    queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM medias ${whereClause}`,
      params
    ),
    queryMany<Categorie>('SELECT * FROM categories ORDER BY nom ASC'),
    queryOne<{ photos: number; videos: number; contributeurs: number }>(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'photo' AND statut = 'approved') as photos,
        COUNT(*) FILTER (WHERE type = 'video' AND statut = 'approved') as videos,
        (SELECT COUNT(*) FROM contributeurs) as contributeurs
      FROM medias
    `),
  ])

  const total = Number(countResult?.total || 0)

  return (
    <div>
      {/* Hero uniquement sur la page d'accueil sans filtres */}
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

      {/* Barre de catégories + grille */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoriesBar
          categories={categories}
          activeCategory={categorie}
          activeType={type}
          searchQuery={q}
        />

        {/* Résultats de recherche — texte traduit */}
        {q && (
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-2xl" style={{ color: 'var(--text-primary)' }}>
              {t('results_for')}{' '}
              <span className="text-gradient-gold">"{q}"</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {total} {total > 1 ? t('medias_found') : t('media_found')}
            </p>
          </div>
        )}

        {/* Grille photos */}
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
