/**
 * app/categories/page.tsx — Page des catégories
 * Bilingue via next-intl (traductions dans messages/fr.json + en.json)
 */
import Link from 'next/link'
import { queryMany } from '@/lib/db'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

interface CatWithCount {
  id: string
  nom: string
  slug: string
  description: string | null
  count: number
}

export default async function CategoriesPage() {
  const t = await getTranslations('categories')

  const categories = await queryMany<CatWithCount>(`
    SELECT 
      c.id, c.nom, c.slug, c.description,
      COUNT(m.id) FILTER (WHERE m.statut = 'approved') as count
    FROM categories c
    LEFT JOIN medias m ON m.categorie = c.nom
    GROUP BY c.id, c.nom, c.slug, c.description
    ORDER BY c.nom ASC
  `)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* En-tête */}
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl md:text-5xl mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('title')}
          </h1>
          <div className="faso-divider w-24 mx-auto" />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Si pas de catégories */}
        {categories.length === 0 && (
          <p className="text-center" style={{ color: 'var(--text-muted)' }}>{t('no_categories')}</p>
        )}

        {/* Grille des catégories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?categorie=${cat.nom}`}
              className="card p-6 group hover:border-faso-gold/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2
                  className="font-display text-xl group-hover:text-faso-gold transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {cat.nom}
                </h2>
                <span className="badge badge-gold text-xs flex-shrink-0 ml-2">
                  {Number(cat.count || 0)} {t('medias')}
                </span>
              </div>
              {cat.description && (
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {cat.description}
                </p>
              )}
              <div
                className="mt-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-faso-gold"
              >
                {t('explore_link')} →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
