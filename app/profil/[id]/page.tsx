import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { MapPin, Calendar, Image } from 'lucide-react'
import PhotoCard from '@/components/photos/PhotoCard'
import type { Media } from '@/types'

interface Props { params: { id: string } }

export default async function ProfilPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const { data: medias } = await supabase
    .from('medias')
    .select('*')
    .eq('auteur_id', params.id)
    .eq('statut', 'approved')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header profil */}
        <div className="flex flex-col md:flex-row items-start gap-8 mb-16">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nom}
                className="w-28 h-28 rounded-3xl object-cover border-2 border-faso-gold/20"
              />
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-faso-red/20 to-faso-gold/20 flex items-center justify-center border-2 border-faso-gold/20">
                <span className="font-display text-5xl text-faso-gold">
                  {profile.nom?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1">
            <h1 className="font-display text-4xl text-white mb-2">{profile.nom}</h1>
            <div className="faso-divider w-24 mb-4" />
            {profile.bio && (
              <p className="text-white/50 leading-relaxed max-w-xl mb-4">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-white/30">
              <span className="flex items-center gap-1.5">
                <Image size={14} className="text-faso-gold" />
                {profile.photos_count} contribution{profile.photos_count !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-faso-green" />
                Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Grille médias */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display text-2xl text-white">Contributions</h2>
            <div className="faso-divider flex-1" />
            <span className="text-white/30 text-sm">{(medias || []).length} médias</span>
          </div>

          {(medias || []).length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-white/30">Aucune contribution publiée pour l'instant</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(medias as Media[]).map((media) => (
                <PhotoCard key={media.id} media={media} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
