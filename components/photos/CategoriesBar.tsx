'use client'
import { useRouter } from 'next/navigation'
import { Image, Video, Grid3X3 } from 'lucide-react'
import type { Categorie } from '@/types'

interface CategoriesBarProps {
  categories: Categorie[]
  activeCategory?: string
  activeType?: string
  searchQuery?: string
}

export default function CategoriesBar({
  categories,
  activeCategory,
  activeType,
  searchQuery,
}: CategoriesBarProps) {
  const router = useRouter()

  const buildUrl = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) urlParams.set(k, v) })
    const str = urlParams.toString()
    return str ? `/?${str}` : '/'
  }

  const typeFilters = [
    { label: 'Tout', value: undefined, icon: Grid3X3 },
    { label: 'Photos', value: 'photo', icon: Image },
    { label: 'Vidéos', value: 'video', icon: Video },
  ]

  return (
    <div className="py-8 space-y-4">
      {/* Type filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {typeFilters.map(({ label, value, icon: Icon }) => (
          <button
            key={label}
            onClick={() => router.push(buildUrl({ q: searchQuery, categorie: activeCategory, type: value }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeType === value
                ? 'bg-faso-gold text-black'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Catégories */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => router.push(buildUrl({ q: searchQuery, type: activeType }))}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !activeCategory
              ? 'bg-faso-red text-white'
              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          Toutes
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              router.push(buildUrl({ q: searchQuery, categorie: cat.slug, type: activeType }))
            }
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.slug
                ? 'bg-faso-red text-white'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat.nom}
          </button>
        ))}
      </div>
    </div>
  )
}
