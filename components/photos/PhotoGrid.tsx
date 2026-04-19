'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import PhotoCard from './PhotoCard'
import type { Media } from '@/types'

interface PhotoGridProps {
  medias: Media[]
  total: number
  page: number
  limit: number
  searchParams: Record<string, string | undefined>
}

export default function PhotoGrid({ medias, total, page, limit, searchParams }: PhotoGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.ceil(total / limit)

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== 'page') params.set(k, v) })
    if (newPage > 1) params.set('page', String(newPage))
    const str = params.toString()
    return str ? `/?${str}` : '/'
  }

  // Distribute photos into columns (masonry)
  const columns = 4
  const columnArrays: Media[][] = Array.from({ length: columns }, () => [])
  medias.forEach((media, i) => {
    columnArrays[i % columns].push(media)
  })

  if (medias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
          <ImageOff size={32} className="text-white/20" />
        </div>
        <h3 className="font-display text-xl text-white mb-2">Aucun média trouvé</h3>
        <p className="text-white/40 text-sm mb-8">
          Soyez le premier à contribuer dans cette catégorie
        </p>
        <Link href="/upload" className="btn-gold">
          Contribuer maintenant
        </Link>
      </div>
    )
  }

  return (
    <div ref={gridRef}>
      {/* Masonry Grid */}
      <div className="flex gap-4">
        {/* Mobile: 2 cols, Tablet: 3 cols, Desktop: 4 cols */}
        {[
          columnArrays.slice(0, 2),
          columnArrays.slice(0, 3),
          columnArrays,
        ].map((_, breakpointIdx) => null)}

        {/* 2 columns on mobile */}
        <div className="flex gap-4 w-full md:hidden">
          {columnArrays.slice(0, 2).map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media, i) => (
                <div
                  key={media.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(colIdx * col.length + i) * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <PhotoCard media={media} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 3 columns on tablet */}
        <div className="hidden md:flex lg:hidden gap-4 w-full">
          {columnArrays.slice(0, 3).map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media, i) => (
                <div
                  key={media.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(colIdx * col.length + i) * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <PhotoCard media={media} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 4 columns on desktop */}
        <div className="hidden lg:flex gap-4 w-full">
          {columnArrays.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((media, i) => (
                <div
                  key={media.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(colIdx * col.length + i) * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                >
                  <PhotoCard media={media} />
                </div>
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
                ? 'opacity-30 pointer-events-none bg-white/5'
                : 'bg-white/5 hover:bg-faso-gold/10 hover:text-faso-gold'
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
                  pageNum === page
                    ? 'bg-faso-gold text-black font-bold'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
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
                ? 'opacity-30 pointer-events-none bg-white/5'
                : 'bg-white/5 hover:bg-faso-gold/10 hover:text-faso-gold'
            }`}
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      )}

      {/* Total count */}
      <p className="text-center text-white/20 text-xs pb-4">
        {total} média{total > 1 ? 's' : ''} • Page {page}/{totalPages}
      </p>
    </div>
  )
}
