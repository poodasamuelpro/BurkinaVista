'use client'
/**
 * app/admin/photos/AdminPhotosClient.tsx — Interface de modération des médias
 * Approve/reject/delete avec affichage infos contributeur
 */
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Eye, Trash2, Play, Filter, User, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Media } from '@/types'

interface Props {
  medias: Media[]
  total: number
  page: number
  statut: string
}

export default function AdminPhotosClient({ medias, total, page, statut }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [localMedias, setLocalMedias] = useState<Media[]>(medias)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
            {total} média{total > 1 ? 's' : ''} — {statut === 'pending' ? 'en attente' : statut === 'approved' ? 'approuvés' : 'refusés'}
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
              {/* Preview */}
              <div className="relative aspect-video bg-faso-dusk">
                {media.type === 'photo' && media.cloudinary_url ? (
                  <img
                    src={media.cloudinary_url}
                    alt={media.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {media.thumbnail_url ? (
                      <img
                        src={media.thumbnail_url}
                        alt={media.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play size={32} className="text-faso-gold" />
                    )}
                    {media.type === 'video' && (
                      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                        <Play size={14} className="text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className={`badge text-xs ${media.type === 'video' ? 'badge-gold' : 'badge-gray'}`}>
                    {media.type}
                  </span>
                  <span className="badge badge-gray text-xs">{media.licence}</span>
                </div>
              </div>

              {/* Infos */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-white line-clamp-2">{media.titre}</h3>

                {/* Infos de base */}
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>📁 {media.categorie}</span>
                  {media.ville && <span>📍 {media.ville}</span>}
                </div>

                {/* Description courte */}
                {media.description && (
                  <p className="text-xs text-white/40 line-clamp-2 bg-white/3 rounded-lg p-2">
                    {media.description}
                  </p>
                )}

                {/* Tags */}
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
                  onClick={() => setExpandedId(expandedId === media.id ? null : media.id)}
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
                      Envoyé le {new Date(media.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex gap-2 pt-1">
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
                  {statut === 'approved' && (
                    <Link
                      href={`/photos/${media.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-all"
                    >
                      <Eye size={14} /> Voir
                    </Link>
                  )}
                  <button
                    onClick={() => deleteMedia(media.id)}
                    disabled={processing === media.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-faso-red/5 text-faso-red/50 hover:text-faso-red hover:bg-faso-red/10 transition-all disabled:opacity-50"
                    title="Supprimer"
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
