'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Play, Eye, Heart } from 'lucide-react'
import type { Media } from '@/types'

interface PhotoCardProps {
  media: Media
}

export default function PhotoCard({ media }: PhotoCardProps) {
  const [hovered, setHovered] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const imgUrl = media.type === 'photo'
    ? media.cloudinary_url
    : media.thumbnail_url

  const aspectRatio = media.width && media.height
    ? media.height / media.width
    : 0.75

  return (
    <Link href={`/photos/${media.slug}`}>
      <div
        className="relative group rounded-2xl overflow-hidden cursor-pointer card"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Skeleton */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Image */}
        {imgUrl && (
          <img
            src={imgUrl}
            alt={media.alt_text || media.titre}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              hovered ? 'scale-105' : 'scale-100'
            } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
        )}

        {/* Video badge */}
        {media.type === 'video' && (
          <div className="absolute top-3 left-3 z-10">
            <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play size={14} className="text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Licence badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="badge badge-gold text-[10px] px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {media.licence}
          </span>
        </div>

        {/* Overlay on hover */}
        <div className={`absolute inset-0 img-overlay transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Bottom info on hover */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <p className="text-white font-medium text-sm leading-tight line-clamp-2 mb-2">
            {media.titre}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-faso-gold/20 flex items-center justify-center text-faso-gold text-xs font-bold">
                {(media.contributeur_prenom || 'B')?.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/60 text-xs">
                {media.contributeur_prenom} {media.contributeur_nom}
              </span>
            </div>
            <div className="flex items-center gap-3 text-white/50 text-xs">
              <span className="flex items-center gap-1">
                <Eye size={11} /> {media.views}
              </span>
              <span className="flex items-center gap-1">
                <Download size={11} /> {media.downloads}
              </span>
            </div>
          </div>
        </div>

        {/* Ville tag */}
        {media.ville && (
          <div className={`absolute top-3 left-3 transition-all duration-300 ${hovered ? 'opacity-0' : 'opacity-100'}`}>
            {media.type !== 'video' && (
              <span className="badge badge-gray text-[10px]">{media.ville}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
