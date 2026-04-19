import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: categories } = await supabase.from('categories').select('*').order('nom')

  // Count par catégorie
  const counts: Record<string, number> = {}
  for (const cat of categories || []) {
    const { count } = await supabase
      .from('medias')
      .select('*', { count: 'exact', head: true })
      .eq('categorie', cat.nom)
      .eq('statut', 'approved')
    counts[cat.slug] = count || 0
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="font-display text-5xl text-white mb-4">
            Explorer par <span className="text-gradient-gold">catégorie</span>
          </h1>
          <div className="faso-divider w-24 mx-auto" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(categories || []).map((cat) => (
            <Link
              key={cat.slug}
              href={`/?categorie=${cat.slug}`}
              className="card p-6 group hover:border-faso-gold/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-display text-xl text-white group-hover:text-faso-gold transition-colors">
                  {cat.nom}
                </h2>
                <span className="badge badge-gold text-xs">{counts[cat.slug] || 0}</span>
              </div>
              {cat.description && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2">{cat.description}</p>
              )}
              <div className="mt-4 text-xs text-faso-gold/0 group-hover:text-faso-gold/70 transition-colors">
                Explorer →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
