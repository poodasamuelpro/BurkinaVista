'use client'
/**
 * app/admin/photos/AdminPhotosClient.tsx — Interface de modération des médias
 * Approve/reject/delete avec affichage infos contributeur
 *
 * CORRECTIONS (2026-04-22) :
 *  - Lecteur vidéo natif <video> utilisant b2_url pour prévisualisation avant approbation
 *  - Miniature conditionnée sur media.type (photo → cloudinary_url, vidéo → thumbnail_url)
 *  - Bouton "Voir" disponible aussi pour les médias refusés (statut approved ET rejected)
 *  - État videoPlaying par carte pour éviter les conflits entre lecteurs
 *  - Affichage durée vidéo formatée
 */
import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle, XCircle, Eye, Trash2, Play, Filter,
  User, Mail, Phone, Pause, Clock, Volume2
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Media } from '@/types'

interface Props {
  medias: Media[]
  total: number
  page: number
  statut: string
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AdminPhotosClient({ medias, total, page, statut }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [localMedias, setLocalMedias] = useState<Media[]>(medias)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // Suivi du lecteur vidéo ouvert (un seul à la fois)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)

  const updateStatut = async (id: string, newStatut: 'approved' | 'rejected') => {
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/medias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut: newStatut }),
      })

      if (!res.ok) throw new Error('Erreur serveur')

      toast.success(newStatut === 'approved' ? '✅ Média approuvé !' : '❌ Média refusé')
      setLocalMedias((prev) => prev.filter((m) => m.id !== id))
      if (playingVideoId === id) setPlayingVideoId(null)
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
    setProcessing(null)
  }

  const deleteMedia = async (id: string) => {
    if (!confirm('Supprimer définitivement ce média ? Cette action est irréversible.')) return
    setProcessing(id)
    try {
      const res = await fetch('/api/admin/medias', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) throw new Error('Erreur serveur')

      toast.success('Média supprimé')
      setLocalMedias((prev) => prev.filter((m) => m.id !== id))
      if (playingVideoId === id) setPlayingVideoId(null)
    } catch {
      toast.error('Erreur lors de la suppression')
    }
    setProcessing(null)
  }

  const statutFilters = [
    { value: 'pending', label: 'En attente', color: 'badge-gold' },
    { value: 'approved', label: 'Approuvés', color: 'badge-green' },
    { value: 'rejected', label: 'Refusés', color: 'badge-red' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-white">Gestion des médias</h1>
          <p className="text-white/40 text-sm mt-1">
            {total} média{total > 1 ? 's' : ''} —{' '}
            {statut === 'pending'
              ? 'en attente'
              : statut === 'approved'
              ? 'approuvés'
              : 'refusés'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-white/30" />
          {statutFilters.map((f) => (
            <Link
              key={f.value}
              href={`/admin/photos?statut=${f.value}`}
              className={`badge text-xs cursor-pointer transition-all ${
                statut === f.value ? f.color : 'badge-gray'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Grille médias */}
      {localMedias.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle size={40} className="text-faso-green mx-auto mb-4 opacity-40" />
          <p className="text-white/40">Aucun média dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {localMedias.map((media) => (
            <div key={media.id} className="card overflow-hidden">

              {/* ── Preview ──────────────────────────────────────── */}
              <div className="relative aspect-video bg-faso-dusk">

                {/* PHOTO */}
                {media.type === 'photo' && media.cloudinary_url && (
                  <img
                    src={media.cloudinary_url}
                    alt={media.titre}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* VIDÉO — lecteur natif avec b2_url */}
                {media.type === 'video' && (
                  <>
                    {playingVideoId === media.id && media.b2_url ? (
                      /* Lecteur vidéo actif */
                      <video
                        src={media.b2_url}
                        controls
                        autoPlay
                        className="w-full h-full object-contain bg-black"
                        onEnded={() => setPlayingVideoId(null)}
                      >
                        Votre navigateur ne supporte pas la lecture vidéo.
                      </video>
                    ) : (
                      /* Vignette + bouton play */
                      <>
                        {media.thumbnail_url ? (
                          <img
                            src={media.thumbnail_url}
                            alt={media.titre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-faso-dusk">
                            <Volume2 size={32} className="text-white/20" />
                          </div>
                        )}

                        {/* Overlay play */}
                        <button
                          onClick={() => {
                            if (!media.b2_url) {
                              toast.error('URL vidéo indisponible')
                              return
                            }
                            setPlayingVideoId(media.id)
                          }}
                          className="absolute inset-0 flex items-center justify-center group"
                          title="Lire la vidéo"
                        >
                          <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center group-hover:bg-faso-gold/80 transition-all duration-200">
                            <Play size={22} className="text-white fill-white ml-1" />
                          </div>
                        </button>

                        {/* Durée */}
                        {media.duration && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-white/80">
                            <Clock size={10} />
                            {formatDuration(media.duration)}
                          </div>
                        )}
                      </>
                    )}

                    {/* Bouton fermer lecteur */}
                    {playingVideoId === media.id && (
                      <button
                        onClick={() => setPlayingVideoId(null)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white/70 hover:text-white z-10"
                        title="Fermer le lecteur"
                      >
                        <Pause size={12} />
                      </button>
                    )}
                  </>
                )}

                {/* Badges type + licence */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span
                    className={`badge text-xs ${
                      media.type === 'video' ? 'badge-gold' : 'badge-gray'
                    }`}
                  >
                    {media.type}
                  </span>
                  <span className="badge badge-gray text-xs">{media.licence}</span>
                </div>

                {/* Avertissement si vidéo sans b2_url */}
                {media.type === 'video' && !media.b2_url && playingVideoId !== media.id && (
                  <div className="absolute bottom-2 left-2 right-2 bg-faso-red/20 border border-faso-red/30 rounded px-2 py-1 text-[10px] text-faso-red text-center">
                    ⚠ Fichier vidéo manquant (b2_url vide)
                  </div>
                )}
              </div>

              {/* ── Infos ──────────────────────────────────────────── */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-white line-clamp-2">{media.titre}</h3>

                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>📁 {media.categorie}</span>
                  {media.ville && <span>📍 {media.ville}</span>}
                </div>

                {media.description && (
                  <p className="text-xs text-white/40 line-clamp-2 bg-white/3 rounded-lg p-2">
                    {media.description}
                  </p>
                )}

                {/* Raison de refus (si rejected) */}
                {media.statut === 'rejected' && media.rejection_reason && (
                  <div className="bg-faso-red/10 border border-faso-red/20 rounded-lg p-2">
                    <p className="text-[10px] text-faso-red/70 uppercase tracking-wider mb-0.5">
                      Motif de refus
                    </p>
                    <p className="text-xs text-faso-red/90">{media.rejection_reason}</p>
                  </div>
                )}

                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {media.tags.slice(0, 4).map((tag: string) => (
                      <span key={tag} className="badge badge-gray text-[10px] px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Infos contributeur (toggle) */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === media.id ? null : media.id)
                  }
                  className="w-full flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors py-1"
                >
                  <User size={13} />
                  {media.contributeur_prenom} {media.contributeur_nom}
                  <span className="ml-auto">{expandedId === media.id ? '▲' : '▼'}</span>
                </button>

                {expandedId === media.id && (
                  <div className="bg-white/3 rounded-xl p-3 space-y-1.5 animate-slide-down">
                    <p className="text-xs text-white/60 font-medium">
                      👤 {media.contributeur_prenom} {media.contributeur_nom}
                    </p>
                    {media.contributeur_email && (
                      <p className="text-xs text-white/40 flex items-center gap-1.5">
                        <Mail size={11} />
                        <a
                          href={`mailto:${media.contributeur_email}`}
                          className="hover:text-faso-gold transition-colors"
                        >
                          {media.contributeur_email}
                        </a>
                      </p>
                    )}
                    {media.contributeur_tel && (
                      <p className="text-xs text-white/40 flex items-center gap-1.5">
                        <Phone size={11} />
                        {media.contributeur_tel}
                      </p>
                    )}
                    <p className="text-xs text-white/20 mt-1">
                      Envoyé le{' '}
                      {new Date(media.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                {/* ── Boutons d'action ──────────────────────────────── */}
                <div className="flex gap-2 pt-1">

                  {/* Pending → Approuver + Refuser */}
                  {statut === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatut(media.id, 'approved')}
                        disabled={processing === media.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-faso-green/10 text-faso-green text-xs font-medium hover:bg-faso-green/20 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={14} /> Approuver
                      </button>
                      <button
                        onClick={() => updateStatut(media.id, 'rejected')}
                        disabled={processing === media.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-faso-red/10 text-faso-red text-xs font-medium hover:bg-faso-red/20 transition-all disabled:opacity-50"
                      >
                        <XCircle size={14} /> Refuser
                      </button>
                    </>
                  )}

                  {/* Approved → Voir sur le site */}
                  {statut === 'approved' && media.slug && (
                    <Link
                      href={`/photos/${media.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-all"
                    >
                      <Eye size={14} /> Voir sur le site
                    </Link>
                  )}

                  {/* Rejected → possibilité de ré-approuver */}
                  {statut === 'rejected' && (
                    <button
                      onClick={() => updateStatut(media.id, 'approved')}
                      disabled={processing === media.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-faso-green/10 text-faso-green text-xs font-medium hover:bg-faso-green/20 transition-all disabled:opacity-50"
                    >
                      <CheckCircle size={14} /> Ré-approuver
                    </button>
                  )}

                  {/* Toujours visible — Supprimer */}
                  <button
                    onClick={() => deleteMedia(media.id)}
                    disabled={processing === media.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-faso-red/5 text-faso-red/50 hover:text-faso-red hover:bg-faso-red/10 transition-all disabled:opacity-50"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {page > 1 && (
            <Link
              href={`/admin/photos?statut=${statut}&page=${page - 1}`}
              className="btn-ghost text-sm py-2 px-4"
            >
              ← Précédent
            </Link>
          )}
          <span className="text-sm text-white/40">
            Page {page} / {Math.ceil(total / 20)}
          </span>
          {page < Math.ceil(total / 20) && (
            <Link
              href={`/admin/photos?statut=${statut}&page=${page + 1}`}
              className="btn-ghost text-sm py-2 px-4"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
