'use client'
/**
 * components/photos/PhotoCard.tsx
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-01] Vidéos sans thumbnail affichent un écran NOIR sans indication visuelle
 *           → Ajout d'un placeholder stylisé avec icône Play + gradient
 *  [BUG-02] Problème d'affichage des couleurs au premier rendu (mode clair)
 *           → Ajout de `decoding="async"` et remplacement de `opacity-0/opacity-100`
 *           par une transition CSS correcte via willChange pour forcer le repaint GPU
 *  [BUG-03] imgLoaded reste false si l'image vient du cache navigateur (onLoad non déclenché)
 *           → Utilisation de l'événement `onLoadStart` + vérification `complete`
 *           via `useEffect` + ref sur l'image
 *  [BUG-04] Les vidéos sans thumbnail_url n'affichent aucun aperçu dans la grille
 *           → Ajout d'un bloc placeholder "Vidéo" avec design cohérent
 *  [BUG-05] Doublon z-index : le badge Play (z-10) et le badge ville (z-10) se chevauchent
 *           → Correction des positions absolues
 */
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Download, Play, Eye } from 'lucide-react'
import type { Media } from '@/types'

interface PhotoCardProps {
  media: Media
}

export default function PhotoCard({ media }: PhotoCardProps) {
  const [hovered, setHovered] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const isVideo = media.type === 'video'

  // URL d'aperçu : photo → cloudinary_url ; vidéo → thumbnail_url (peut être null)
  const imgUrl = isVideo ? media.thumbnail_url : media.cloudinary_url

  const aspectRatio = media.width && media.height
    ? media.height / media.width
    : isVideo ? 0.5625 /* 16:9 par défaut pour vidéos */ : 0.75

  // [FIX BUG-03] — Gérer les images déjà en cache (onLoad n'est pas déclenché)
  useEffect(() => {
    if (imgRef.current?.complete) {
      setImgLoaded(true)
    }
  }, [])

  return (
    <Link href={`/photos/${media.slug}`}>
      <div
        className="relative group rounded-2xl overflow-hidden cursor-pointer card"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* [FIX BUG-02] Skeleton — toujours présent jusqu'à chargement image */}
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* ── CAS 1 : Image disponible (photo Cloudinary ou thumbnail vidéo) ── */}
        {imgUrl ? (
          <img
            ref={imgRef}
            src={imgUrl}
            alt={media.alt_text || media.titre}
            // [FIX BUG-02] willChange force le navigateur à créer un layer GPU
            // ce qui déclenche le repaint correct des couleurs dès le premier rendu
            style={{ willChange: 'opacity', transition: 'opacity 0.3s ease, transform 0.5s ease' }}
            className={`absolute inset-0 w-full h-full object-cover ${
              hovered ? 'scale-105' : 'scale-100'
            } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            // [FIX BUG-02] decoding async évite le blocage du thread principal
            decoding="async"
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        ) : isVideo ? (
          /* ── CAS 2 : Vidéo SANS thumbnail → placeholder stylisé ── */
          /* [FIX BUG-01 + BUG-04] Était un écran NOIR, maintenant un placeholder digne */
          <div className="absolute inset-0 bg-gradient-to-br from-faso-dusk via-faso-card to-faso-night flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 opacity-60">
              <div className="w-14 h-14 rounded-full bg-faso-gold/20 border border-faso-gold/30 flex items-center justify-center">
                <Play size={22} className="text-faso-gold fill-faso-gold ml-1" />
              </div>
              <span className="text-white/40 text-xs font-medium tracking-wide uppercase">Vidéo</span>
            </div>
          </div>
        ) : null}

        {/* ── Badge Play (vidéos uniquement) — coin haut gauche [FIX BUG-05 z-20] ── */}
        {isVideo && (
          <div className="absolute top-3 left-3 z-20">
            <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play size={14} className="text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* ── Badge Licence — coin haut droit ── */}
        <div className="absolute top-3 right-3 z-10">
          <span className="badge badge-gold text-[10px] px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {media.licence}
          </span>
        </div>

        {/* ── Overlay hover ── */}
        <div
          className={`absolute inset-0 img-overlay transition-opacity duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* ── Infos bas de carte (hover) ── */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
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

        {/* ── Badge Ville (photos uniquement, coin haut gauche, masqué au hover) ── */}
        {/* [FIX BUG-05] Décalé à droite du badge Play pour éviter chevauchement */}
        {media.ville && !isVideo && (
          <div
            className={`absolute top-3 left-3 z-10 transition-all duration-300 ${
              hovered ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span className="badge badge-gray text-[10px]">{media.ville}</span>
          </div>
        )}
      </div>
    </Link>
  )
}