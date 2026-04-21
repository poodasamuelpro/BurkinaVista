'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Download, Share2, MapPin, Calendar, Tag, Eye, ChevronLeft, Play, User, Check } from 'lucide-react'
import PhotoCard from '@/components/photos/PhotoCard'
import type { Media } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  media: Media
  related: Media[]
}

export default function PhotoDetailClient({ media, related }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)

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

      // Fetch le fichier en blob pour forcer le téléchargement
      // (évite que le navigateur ouvre juste l'image dans un onglet)
      const fileRes = await fetch(url)
      if (!fileRes.ok) throw new Error('Fetch blob échoué')

      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)

      const extension = media.type === 'video' ? 'mp4' : 'jpg'
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
      await navigator.share({ title: media.titre, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const licenceColors: Record<string, string> = {
    'CC0': 'badge-green',
    'CC BY': 'badge-gold',
    'CC BY-NC': 'badge-red',
    'CC BY-SA': 'badge-gray',
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Retour */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft size={16} /> Retour à la galerie
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Media principal */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl overflow-hidden bg-faso-dusk relative">
              {media.type === 'photo' ? (
                <img
                  src={media.cloudinary_url}
                  alt={media.alt_text || media.titre}
                  className="w-full object-contain max-h-[75vh]"
                />
              ) : (
                <div className="relative aspect-video bg-black">
                  {!playing ? (
                    <>
                      <img
                        src={media.thumbnail_url}
                        alt={media.alt_text || media.titre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <button
                          onClick={() => setPlaying(true)}
                          className="w-20 h-20 rounded-full bg-faso-gold flex items-center justify-center shadow-faso-gold hover:scale-110 transition-transform"
                        >
                          <Play size={32} className="text-black fill-black ml-1" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <video
                      src={media.stream_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
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
            </div>

            {/* Description */}
            {media.description && (
              <div className="mt-8 card p-6">
                <h2 className="font-display text-lg text-white mb-3">À propos</h2>
                <p className="text-white/60 leading-relaxed text-sm">{media.description}</p>
              </div>
            )}

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} className="text-white/30" />
                  <span className="text-xs text-white/30 uppercase tracking-wider">Tags</span>
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

          {/* Sidebar infos */}
          <div className="space-y-6">

            {/* Titre + licence */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="font-display text-2xl text-white leading-tight">{media.titre}</h1>
                <span className={`badge ${licenceColors[media.licence] || 'badge-gray'} flex-shrink-0`}>
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
                  <p className="font-medium text-white">
                    {media.contributeur_prenom} {media.contributeur_nom}
                  </p>
                  <p className="text-xs text-white/40">Contributeur BurkinaVista</p>
                </div>
                <User size={16} className="ml-auto text-white/20" />
              </div>
            )}

            {/* Métadonnées */}
            <div className="card p-5 space-y-4">
              <h3 className="text-xs text-white/30 uppercase tracking-wider">Informations</h3>

              {media.ville && (
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-faso-red" />
                  <div>
                    <p className="text-xs text-white/30">Lieu</p>
                    <p className="text-sm text-white">{media.ville}{media.region && `, ${media.region}`}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={15} className="text-faso-gold" />
                <div>
                  <p className="text-xs text-white/30">Publié le</p>
                  <p className="text-sm text-white">
                    {new Date(media.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Eye size={15} className="text-faso-green" />
                <div>
                  <p className="text-xs text-white/30">Statistiques</p>
                  <p className="text-sm text-white">{media.views} vues · {media.downloads} téléchargements</p>
                </div>
              </div>

              {media.type === 'photo' && media.width && media.height && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center text-[8px] text-white/40">px</div>
                  <div>
                    <p className="text-xs text-white/30">Dimensions</p>
                    <p className="text-sm text-white">{media.width} × {media.height} px</p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-white/20 leading-relaxed">
                  Licence {media.licence} — Vous pouvez utiliser cette image librement
                  {media.licence !== 'CC0' && ' avec attribution à l\'auteur'}.
                </p>
              </div>
            </div>

            {/* Catégorie */}
            <Link
              href={`/?categorie=${media.categorie}`}
              className="card p-4 flex items-center justify-between hover:border-faso-green/30 transition-colors"
            >
              <div>
                <p className="text-xs text-white/30 mb-1">Catégorie</p>
                <p className="text-sm text-white font-medium">{media.categorie}</p>
              </div>
              <ChevronLeft size={16} className="text-white/20 rotate-180" />
            </Link>
          </div>
        </div>

        {/* Médias similaires */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-display text-2xl text-white">Médias similaires</h2>
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
