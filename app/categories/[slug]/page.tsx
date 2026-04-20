/**
 * app/categories/[slug]/page.tsx — Page d'une catégorie
 * Sans Supabase — utilise Neon
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { queryOne, queryMany } from '@/lib/db'
import PhotoCard from '@/components/photos/PhotoCard'
import Link from 'next/link'
import type { Media, Categorie } from '@/types'

interface Props {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await queryOne<Categorie>(
    'SELECT * FROM categories WHERE slug = $1',
    [params.slug]
  )
  if (!cat) return { title: 'Catégorie introuvable — BurkinaVista' }
  return {
    title: `${cat.nom} — BurkinaVista`,
    description:
      cat.description ||
      `Découvrez les meilleurs médias dans la catégorie ${cat.nom} du Burkina Faso`,
  }
}

export default async function CategorieSlugPage({ params }: Props) {
  const cat = await queryOne<Categorie>(
    'SELECT * FROM categories WHERE slug = $1',
    [params.slug]
  )

  if (!cat) notFound()

  const medias = await queryMany<Media>(
    "SELECT * FROM medias WHERE statut = 'approved' AND categorie = $1 ORDER BY created_at DESC",
    [cat.nom]
  )

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link href="/categories" className="text-xs text-white/30 hover:text-faso-gold transition-colors">
            ← Toutes les catégories
          </Link>
          <div className="mt-4">
            <span className="badge badge-gold mb-3 inline-block">Catégorie</span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-3">{cat.nom}</h1>
            <div className="faso-divider w-24 mb-4" />
            {cat.description && (
              <p className="text-white/40 max-w-xl text-sm leading-relaxed">{cat.description}</p>
            )}
            <p className="text-white/20 text-sm mt-3">
              {medias.length} média{medias.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Grille */}
        {medias.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-white/30 mb-4">Aucun média dans cette catégorie pour l'instant</p>
            <Link href="/upload" className="btn-gold inline-flex">
              Contribuer maintenant
            </Link>
          </div>
        ) : (
          <>
            {/* 2 colonnes mobile, 3 tablet, 4 desktop */}
            <div className="flex gap-4 md:hidden">
              {[0, 1].map((colIdx) => (
                <div key={colIdx} className="flex-1 flex flex-col gap-4">
                  {medias.filter((_, i) => i % 2 === colIdx).map((media) => (
                    <PhotoCard key={media.id} media={media} />
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden md:flex lg:hidden gap-4">
              {[0, 1, 2].map((colIdx) => (
                <div key={colIdx} className="flex-1 flex flex-col gap-4">
                  {medias.filter((_, i) => i % 3 === colIdx).map((media) => (
                    <PhotoCard key={media.id} media={media} />
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden lg:flex gap-4">
              {[0, 1, 2, 3].map((colIdx) => (
                <div key={colIdx} className="flex-1 flex flex-col gap-4">
                  {medias.filter((_, i) => i % 4 === colIdx).map((media) => (
                    <PhotoCard key={media.id} media={media} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
