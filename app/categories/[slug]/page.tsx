import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import PhotoCard from '@/components/photos/PhotoCard'
import type { Media } from '@/types'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: cat } = await supabase.from('categories').select('*').eq('slug', params.slug).single()
  if (!cat) return { title: 'Catégorie introuvable' }
  return {
    title: `${cat.nom} — Photos & Vidéos Burkina Faso`,
    description: cat.description || `Découvrez les meilleurs médias dans la catégorie ${cat.nom} du Burkina Faso`,
  }
}

export default async function CategorieSlugPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: cat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!cat) notFound()

  const { data: medias } = await supabase
    .from('medias')
    .select('*, auteur:profiles(id, nom, avatar_url)')
    .eq('statut', 'approved')
    .eq('categorie', cat.nom)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="badge badge-gold mb-4 inline-block">Catégorie</span>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3">{cat.nom}</h1>
          <div className="faso-divider w-24 mb-4" />
          {cat.description && (
            <p className="text-white/40 max-w-xl">{cat.description}</p>
          )}
          <p className="text-white/20 text-sm mt-2">{(medias || []).length} médias</p>
        </div>

        {(medias || []).length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-white/30 mb-4">Aucun média dans cette catégorie pour l'instant</p>
            <a href="/upload" className="btn-gold inline-flex">Contribuer</a>
          </div>
        ) : (
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-4">
                {(medias as Media[])
                  .filter((_, i) => i % 4 === colIdx)
                  .map((media) => (
                    <PhotoCard key={media.id} media={media} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
