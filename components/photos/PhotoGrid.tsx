'use client'
/**
 * components/photos/PhotoGrid.tsx
 * Grille masonry de médias — bilingue + mode clair/sombre
 */
import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import PhotoCard from './PhotoCard'
import type { Media } from '@/types'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

interface PhotoGridProps {
  medias: Media[]
  total: number
  page: number
  limit: number
  searchParams: Record<string, string | undefined>
}

export default function PhotoGrid({ medias, total, page, limit, searchParams }: PhotoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('photogrid')
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const totalPages = Math.ceil(total / limit)

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== 'page') params.set(k, v) })
    if (newPage > 1) params.set('page', String(newPage))
    const str = params.toString()
    return str ? `/?${str}` : '/'
  }

  const columns = 4
  const columnArrays: Media[][] = Array.from({ length: columns }, () => [])
  medias.forEach((media, i) => { columnArrays[i % columns].push(media) })

  const paginationInactive = isLight
    ? 'bg-[rgba(28,42,58,0.06)] text-[rgba(28,42,58,0.6)] hover:bg-[rgba(28,42,58,0.1)] hover:text-[#1C2A3A]'
    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'

  const paginationActive = 'bg-faso-gold text-black font-bold'

  if (medias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
          isLight ? 'bg-[rgba(28,42,58,0.06)]' : 'bg-white/5'
        }`}>
          <ImageOff size={32} className={isLight ? 'text-[rgba(28,42,58,0.25)]' : 'text-white/20'} />
        </div>
        <h3 className={`font-display text-xl mb-2 ${isLight ? 'text-[#1C2A3A]' : 'text-white'}`}>
          {t('no_media_title')}
        </h3>
        <p className={`text-sm mb-8 ${isLight ? 'text-[rgba(28,42,58,0.5)]' : 'text-white/40'}`}>
          {t('no_media_desc')}
        </p>
        <Link href="/upload" className="btn-gold">
          {t('contribute_now')}
        </Link>
      </div>
    )
  }

  return (
    <div ref={gridRef}>
      {/* Masonry Grid — animation retirée, opacity fixe à 1 */}
      <div className="flex gap-4">

        {/* 2 colonnes mobile */}
        <div className="flex gap-4 w-full md:hidden">
          {columnArrays.slice(0, 2).map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media) => (
                <PhotoCard key={media.id} media={media} />
              ))}
            </div>
          ))}
        </div>

        {/* 3 colonnes tablet */}
        <div className="hidden md:flex lg:hidden gap-4 w-full">
          {columnArrays.slice(0, 3).map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media) => (
                <PhotoCard key={media.id} media={media} />
              ))}
            </div>
          ))}
        </div>

        {/* 4 colonnes desktop */}
        <div className="hidden lg:flex gap-4 w-full">
          {columnArrays.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media) => (
                <PhotoCard key={media.id} media={media} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-16 pb-8">
          <Link
            href={buildUrl(page - 1)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              page <= 1
                ? `opacity-30 pointer-events-none ${isLight ? 'bg-[rgba(28,42,58,0.06)]' : 'bg-white/5'}`
                : `${paginationInactive} hover:text-faso-gold hover:bg-faso-gold/10`
            }`}
          >
            <ChevronLeft size={18} />
          </Link>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum = i + 1
            if (totalPages > 7) {
              if (page <= 4) pageNum = i + 1
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i
              else pageNum = page - 3 + i
            }
            return (
              <Link
                key={pageNum}
                href={buildUrl(pageNum)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                  pageNum === page ? paginationActive : paginationInactive
                }`}
              >
                {pageNum}
              </Link>
            )
          })}

          <Link
            href={buildUrl(page + 1)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              page >= totalPages
                ? `opacity-30 pointer-events-none ${isLight ? 'bg-[rgba(28,42,58,0.06)]' : 'bg-white/5'}`
                : `${paginationInactive} hover:text-faso-gold hover:bg-faso-gold/10`
            }`}
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      )}

      <p className={`text-center text-xs pb-4 ${isLight ? 'text-[rgba(28,42,58,0.3)]' : 'text-white/20'}`}>
        {total} {total > 1 ? t('medias_count') : t('media_count')} • {t('page')} {page}/{totalPages}
      </p>
    </div>
  )
}
