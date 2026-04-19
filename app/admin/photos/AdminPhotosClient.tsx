'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Eye, Trash2, Play, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'

interface Props {
  medias: any[]
  total: number
  page: number
  statut: string
}

export default function AdminPhotosClient({ medias, total, page, statut }: Props) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [localMedias, setLocalMedias] = useState(medias)
  const router = useRouter()
  const supabase = createClient()

  const updateStatut = async (id: string, newStatut: 'approved' | 'rejected') => {
    setProcessing(id)
    const { error } = await supabase
      .from('medias')
      .update({ statut: newStatut })
      .eq('id', id)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
    } else {
      toast.success(newStatut === 'approved' ? '✅ Média approuvé !' : '❌ Média refusé')
      setLocalMedias((prev) => prev.filter((m) => m.id !== id))
    }
    setProcessing(null)
  }

  const deleteMedia = async (id: string) => {
    if (!confirm('Supprimer définitivement ce média ?')) return
    setProcessing(id)
    const { error } = await supabase.from('medias').delete().eq('id', id)
    if (!error) {
      setLocalMedias((prev) => prev.filter((m) => m.id !== id))
      toast.success('Média supprimé')
    }
    setProcessing(null)
  }

  const statutFilters = [
    { value: 'pending', label: 'En attente', color: 'text-faso-gold' },
    { value: 'approved', label: 'Approuvés', color: 'text-faso-green' },
    { value: 'rejected', label: 'Refusés', color: 'text-faso-red' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Gestion des médias</h1>
          <p className="text-white/40 text-sm mt-1">{total} média{total > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/30" />
          {statutFilters.map((f) => (
            <Link
              key={f.value}
              href={`/admin/photos?statut=${f.value}`}
              className={`badge text-xs cursor-pointer transition-all ${
                statut === f.value ? 'badge-gold' : 'badge-gray'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {localMedias.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={40} className="text-faso-green mx-auto mb-4 opacity-50" />
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
                      <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play size={32} className="text-faso-gold" />
                    )}
                  </div>
                )}
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
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>👤 {media.auteur?.nom}</span>
                  <span>📁 {media.categorie}</span>
                </div>
                {media.ville && (
                  <p className="text-xs text-white/20">📍 {media.ville}</p>
                )}
                {media.description && (
                  <p className="text-xs text-white/40 line-clamp-2 bg-white/3 rounded-lg p-2">
                    {media.description}
                  </p>
                )}

                {/* Tags */}
                {media.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {media.tags.slice(0, 4).map((tag: string) => (
                      <span key={tag} className="badge badge-gray text-[10px] px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
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
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
