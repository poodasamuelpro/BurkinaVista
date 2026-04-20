/**
 * app/categories/page.tsx — Page des catégories
 * Sans Supabase — utilise Neon
 */
import Link from 'next/link'
import { queryMany } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface CatWithCount {
  id: string
  nom: string
  slug: string
  description: string | null
  count: number
}

export default async function CategoriesPage() {
  // Récupérer catégories avec le nombre de médias approuvés
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
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
            Explorer par <span className="text-gradient-gold">catégorie</span>
          </h1>
          <div className="faso-divider w-24 mx-auto" />
          <p className="text-white/40 mt-4 text-sm">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} disponible{categories.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/?categorie=${cat.nom}`}
              className="card p-6 group hover:border-faso-gold/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-display text-xl text-white group-hover:text-faso-gold transition-colors">
                  {cat.nom}
                </h2>
                <span className="badge badge-gold text-xs flex-shrink-0 ml-2">
                  {Number(cat.count || 0)}
                </span>
              </div>
              {cat.description && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              )}
              <div className="mt-4 text-xs text-transparent group-hover:text-faso-gold/70 transition-colors">
                Explorer →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
