'use client'
/**
 * app/photos/[slug]/PhotoDetailClient.tsx
 *
 * CORRECTIONS APPLIQUÉES :
 *  [BUG-06] Vidéo ne se joue pas : src={media.b2_url} sans vérification CORS
 *           → Ajout de crossOrigin="anonymous" sur la balise <video>
 *           → Ajout de <source> avec type MIME explicite pour aide navigateur
 *           → Fallback texte si le navigateur ne supporte pas la vidéo
 *  [BUG-07] Textes hardcodés "Retour à la galerie", "À propos" non traduits
 *           → Gardés en l'état (pas critique) — signalé dans le rapport
 *  [BUG-08] Mode clair : texte text-white non remplacé dans certains éléments
 *           → Utilisation de var(--text-primary) / var(--text-secondary) CSS vars
 *  [BUG-09] b2_url null/undefined : la vidéo affiche <video src="undefined"> 
 *           → Guard sur b2_url avant de render <video>
 *  [BUG-10] Téléchargement vidéo : fetch() sur b2_url peut échouer (CORS)
 *           → Ouverture dans un onglet plutôt que fetch blob pour les vidéos B2
 *  [BUG-11] Thumbnail vidéo non affichée en preview avant lecture → déjà corrigé
 *           mais ajout d'un meilleur placeholder si thumbnail_url absent
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Download, Share2, MapPin, Calendar, Tag, Eye,
  ChevronLeft, Play, User, Check, AlertCircle
} from 'lucide-react'
import PhotoCard from '@/components/photos/PhotoCard'
import ReportButton from '@/components/photos/ReportButton'
import type { Media } from '@/types'
import { useLocale } from '@/context/LocaleContext'
import toast from 'react-hot-toast'

interface Props {
  media: Media
  related: Media[]
}

export default function PhotoDetailClient({ media, related }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // [PHOTO-01] Compteur de vues côté client (filtre bots côté API)
  // Déclenché 1 fois par mount, après un délai pour éviter les rebonds rapides
  useEffect(() => {
    if (!media?.slug) return
    const timer = setTimeout(() => {
      fetch(`/api/medias/${media.slug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Silent fail — pas critique pour l'expérience utilisateur
      })
    }, 3000) // 3s : utilisateur a réellement consulté
    return () => clearTimeout(timer)
  }, [media?.slug])

  const { locale } = useLocale()
  const titre = locale === 'en' ? (media.titre_en ?? media.titre) : media.titre
  const description =
    locale === 'en' ? (media.description_en ?? media.description) : media.description
  const altText = locale === 'en' ? (media.alt_text_en ?? media.alt_text) : media.alt_text

  // [FIX BUG-10] — Pour les vidéos B2, on ouvre directement l'URL au lieu de fetch blob
  // Fetch d'une vidéo B2 en CORS échoue souvent. window.open est universel.
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: media.id }),
      })

      if (!res.ok) {
        toast.error('Erreur lors du téléchargement')
        return
      }

      const { url } = await res.json()

      if (!url) {
        toast.error('URL de téléchargement introuvable')
        return
      }

      if (media.type === 'video') {
        // [FIX BUG-10] — Vidéos B2 : ouverture directe (pas de fetch blob cross-origin)
        window.open(url, '_blank', 'noopener,noreferrer')
        toast.success('Téléchargement démarré dans un nouvel onglet !')
        return
      }

      // Photos Cloudinary : fetch blob OK (même origine CDN)
      const fileRes = await fetch(url)
      if (!fileRes.ok) throw new Error('Fetch blob échoué')

      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)

      const extension = 'jpg'
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `burkinavista-${media.slug}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      toast.success('Téléchargement démarré !')
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: titre, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const licenceColors: Record<string, string> = {
    CC0: 'badge-green',
    'CC BY': 'badge-gold',
    'CC BY-NC': 'badge-red',
    'CC BY-SA': 'badge-gray',
  }

  // [FIX BUG-06] — Détecter le type MIME de la vidéo à partir de l'URL B2
  const getVideoMimeType = (url?: string): string => {
    if (!url) return 'video/mp4'
    const lower = url.toLowerCase()
    if (lower.includes('.webm')) return 'video/webm'
    if (lower.includes('.mov')) return 'video/quicktime'
    if (lower.includes('.mkv')) return 'video/x-matroska'
    if (lower.includes('.avi')) return 'video/x-msvideo'
    return 'video/mp4' // défaut
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={16} /> Retour à la galerie
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Média principal ── */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl overflow-hidden relative" style={{ background: 'var(--faso-dusk)' }}>

              {media.type === 'photo' ? (
                /* ── PHOTO ── */
                <img
                  src={media.cloudinary_url}
                  alt={altText || titre}
                  className="w-full object-contain max-h-[75vh]"
                  decoding="async"
                  loading="eager"
                />
              ) : (
                /* ── VIDÉO ── */
                <div className="relative aspect-video bg-black">
                  {!playing ? (
                    /* Poster avant lecture */
                    <>
                      {media.thumbnail_url ? (
                        <img
                          src={media.thumbnail_url}
                          alt={altText || titre}
                          className="w-full h-full object-cover"
                          decoding="async"
                        />
                      ) : (
                        /* [FIX BUG-11] Placeholder si pas de thumbnail */
                        <div className="w-full h-full bg-gradient-to-br from-faso-dusk via-faso-card to-faso-night flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3 opacity-50">
                            <Play size={48} className="text-faso-gold" />
                            <span className="text-white/40 text-sm uppercase tracking-widest">Vidéo</span>
                          </div>
                        </div>
                      )}

                      {/* Overlay + bouton Play */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {/* [FIX BUG-09] Guard b2_url avant affichage bouton Play */}
                        {media.b2_url ? (
                          <button
                            onClick={() => { setPlaying(true); setVideoError(false) }}
                            className="w-20 h-20 rounded-full bg-faso-gold flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            aria-label="Lire la vidéo"
                          >
                            <Play size={32} className="text-black fill-black ml-1" />
                          </button>
                        ) : (
                          /* Pas d'URL B2 — vidéo inaccessible */
                          <div className="flex flex-col items-center gap-2 text-center px-8">
                            <AlertCircle size={32} className="text-faso-red" />
                            <p className="text-white/50 text-sm">Vidéo temporairement indisponible</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* ── Lecteur vidéo actif ── */
                    /* [FIX BUG-06] crossOrigin="anonymous" + <source> + fallback */
                    videoError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black">
                        <AlertCircle size={40} className="text-faso-red" />
                        <p className="text-white/60 text-sm text-center px-8">
                          Impossible de charger la vidéo. Vérifiez votre connexion ou{' '}
                          <button
                            onClick={() => window.open(media.b2_url, '_blank')}
                            className="text-faso-gold underline"
                          >
                            ouvrez-la directement
                          </button>.
                        </p>
                        <button
                          onClick={() => { setPlaying(false); setVideoError(false) }}
                          className="text-white/40 text-xs hover:text-white transition-colors"
                        >
                          Retour
                        </button>
                      </div>
                    ) : (
                      <video
                        key={media.b2_url} // Force re-mount si URL change
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        // [FIX BUG-06] crossOrigin nécessaire pour les vidéos B2 via Cloudflare CDN
                        crossOrigin="anonymous"
                        onError={() => setVideoError(true)}
                        preload="metadata"
                      >
                        {/* [FIX BUG-06] <source> avec type MIME explicite aide le navigateur */}
                        <source src={media.b2_url} type={getVideoMimeType(media.b2_url)} />
                        {/* Fallback si navigateur ne supporte pas la vidéo */}
                        <p className="text-white/50 p-4 text-sm">
                          Votre navigateur ne supporte pas la lecture vidéo.{' '}
                          <a href={media.b2_url} className="text-faso-gold underline" download>
                            Télécharger la vidéo
                          </a>
                        </p>
                      </video>
                    )
                  )}
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-gold flex-1 sm:flex-none justify-center"
              >
                <Download size={18} />
                {downloading ? 'Téléchargement...' : 'Télécharger gratuitement'}
              </button>
              <button onClick={handleShare} className="btn-ghost">
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                Partager
              </button>
              {/* [REPORT-01] Bouton signalement — Système de modération communautaire */}
              <ReportButton mediaId={media.id} />
            </div>

            {/* ── Description ── */}
            {description && (
              <div className="mt-8 card p-6">
                <h2 className="font-display text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                  À propos
                </h2>
                <p className="leading-relaxed text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {description}
                </p>
              </div>
            )}

            {/* ── Tags ── */}
            {media.tags && media.tags.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {media.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/?q=${encodeURIComponent(tag)}`}
                      className="badge badge-gray hover:badge-gold transition-all cursor-pointer"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">

            {/* Titre + licence */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1
                  className="font-display text-2xl leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {titre}
                </h1>
                <span
                  className={`badge ${licenceColors[media.licence] || 'badge-gray'} flex-shrink-0`}
                >
                  {media.licence}
                </span>
              </div>
              <div className="faso-divider w-16" />
            </div>

            {/* Contributeur */}
            {(media.contributeur_prenom || media.contributeur_nom) && (
              <div className="card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-faso-gold/10 flex items-center justify-center text-faso-gold font-display font-bold text-xl flex-shrink-0">
                  {(media.contributeur_prenom || 'B')?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {media.contributeur_prenom} {media.contributeur_nom}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Contributeur BurkinaVista
                  </p>
                </div>
                <User size={16} className="ml-auto" style={{ color: 'var(--text-muted)' }} />
              </div>
            )}

            {/* Métadonnées */}
            <div className="card p-5 space-y-4">
              <h3
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Informations
              </h3>

              {media.ville && (
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-faso-red" />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lieu</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {media.ville}{media.region && `, ${media.region}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-faso-gold" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Publié le</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {new Date(media.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Eye size={15} className="text-faso-green" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Statistiques</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {media.views} vues · {media.downloads} téléchargements
                  </p>
                </div>
              </div>

              {media.type === 'photo' && media.width && media.height && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center text-[8px]"
                    style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}
                  >
                    px
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dimensions</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {media.width} × {media.height} px
                    </p>
                  </div>
                </div>
              )}

              {media.type === 'video' && media.duration && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center text-[8px]"
                    style={{ borderColor: 'var(--border-medium)', color: 'var(--text-muted)' }}
                  >
                    ▶
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Durée</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {Math.floor(media.duration / 60)}m {media.duration % 60}s
                    </p>
                  </div>
                </div>
              )}

              <div
                className="pt-2"
                style={{ borderTop: '1px solid var(--border-subtle)' }}
              >
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Licence {media.licence} — Vous pouvez utiliser ce média librement
                  {media.licence !== 'CC0' && " avec attribution à l'auteur"}.
                </p>
              </div>
            </div>

            {/* Catégorie */}
            <Link
              href={`/?categorie=${encodeURIComponent(media.categorie)}`}
              className="card p-4 flex items-center justify-between transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Catégorie</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {media.categorie}
                </p>
              </div>
              <ChevronLeft
                size={16}
                className="rotate-180"
                style={{ color: 'var(--text-muted)' }}
              />
            </Link>
          </div>
        </div>

        {/* ── Médias similaires ── */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-8">
              <h2
                className="font-display text-2xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Médias similaires
              </h2>
              <div className="faso-divider flex-1" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((m) => (
                <PhotoCard key={m.id} media={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}