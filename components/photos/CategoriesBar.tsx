'use client'
/**
 * components/photos/CategoriesBar.tsx
 * Barre de filtrage type (Photos/Vidéos/Tout) + catégories
 * Bilingue FR/EN + mode clair/sombre
 */
import { useRouter } from 'next/navigation'
import { Image, Video, Grid3X3 } from 'lucide-react'
import type { Categorie } from '@/types'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

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
  const t = useTranslations('categories_bar')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const buildUrl = (params: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) urlParams.set(k, v) })
    const str = urlParams.toString()
    return str ? `/?${str}` : '/'
  }

  const typeFilters = [
    { labelKey: 'all',    value: undefined,  icon: Grid3X3 },
    { labelKey: 'photos', value: 'photo',    icon: Image },
    { labelKey: 'videos', value: 'video',    icon: Video },
  ]

  /* Classes communes selon le thème */
  const inactiveBtn = isLight
    ? 'bg-[rgba(28,42,58,0.06)] text-[rgba(28,42,58,0.65)] hover:text-[#1C2A3A] hover:bg-[rgba(28,42,58,0.12)]'
    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'

  return (
    <div className="py-8 space-y-4">
      {/* Filtres par type */}
      <div className="flex items-center gap-3 flex-wrap">
        {typeFilters.map(({ labelKey, value, icon: Icon }) => (
          <button
            key={labelKey}
            onClick={() =>
              router.push(buildUrl({ q: searchQuery, categorie: activeCategory, type: value }))
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeType === value
                ? 'bg-faso-gold text-black'
                : inactiveBtn
            }`}
          >
            <Icon size={15} />
            {t(labelKey)}
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
              : inactiveBtn
          }`}
        >
          {t('all_categories')}
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
                : inactiveBtn
            }`}
          >
            {cat.nom}
          </button>
        ))}
      </div>
    </div>
  )
}
