import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase'
import HeroSection from '@/components/photos/HeroSection'
import PhotoGrid from '@/components/photos/PhotoGrid'
import CategoriesBar from '@/components/photos/CategoriesBar'
import StatsBar from '@/components/photos/StatsBar'
import type { Media, Categorie } from '@/types'

interface HomePageProps {
  searchParams: { q?: string; categorie?: string; type?: string; page?: string }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createServerSupabaseClient()
  const { q, categorie, type, page: pageStr } = searchParams
  const page = parseInt(pageStr || '1')
  const limit = 30
  const offset = (page - 1) * limit

  // Fetch médias
  let query = supabase
    .from('medias')
    .select('*, auteur:profiles(id, nom, avatar_url)', { count: 'exact' })
    .eq('statut', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) {
    query = query.or(`titre.ilike.%${q}%,description.ilike.%${q}%,ville.ilike.%${q}%`)
  }
  if (categorie) query = query.eq('categorie', categorie)
  if (type) query = query.eq('type', type)

  const { data: medias, count } = await query

  // Fetch catégories avec count
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('nom')

  // Stats globales
  const { count: totalPhotos } = await supabase
    .from('medias')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'approved')
    .eq('type', 'photo')

  const { count: totalVideos } = await supabase
    .from('medias')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'approved')
    .eq('type', 'video')

  const { count: totalContributors } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      {/* Hero uniquement si pas de recherche */}
      {!q && !categorie && page === 1 && (
        <>
          <HeroSection featuredMedias={(medias || []).slice(0, 5) as Media[]} />
          <StatsBar
            photos={totalPhotos || 0}
            videos={totalVideos || 0}
            contributors={totalContributors || 0}
          />
        </>
      )}

      {/* Barre catégories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoriesBar
          categories={(categories || []) as Categorie[]}
          activeCategory={categorie}
          activeType={type}
          searchQuery={q}
        />

        {/* Résultats recherche */}
        {q && (
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-2xl text-white">
              Résultats pour{' '}
              <span className="text-gradient-gold">"{q}"</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {count || 0} média{(count || 0) > 1 ? 's' : ''} trouvé{(count || 0) > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Grille */}
        <Suspense fallback={<PhotoGridSkeleton />}>
          <PhotoGrid
            medias={(medias || []) as Media[]}
            total={count || 0}
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
          style={{ height: `${200 + Math.random() * 150}px` }}
        />
      ))}
    </div>
  )
}
