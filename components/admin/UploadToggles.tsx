'use client'
/**
 * components/admin/UploadToggles.tsx
 * Toggles interactifs pour activer/désactiver l'upload photos et vidéos
 * Appelle /api/admin/upload-settings via PATCH
 * Composant client isolé pour ne pas forcer le dashboard admin en client-side
 */
import { useState } from 'react'
import { Image, Video, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  initialPhotosEnabled: boolean
  initialVideosEnabled: boolean
}

export default function UploadToggles({ initialPhotosEnabled, initialVideosEnabled }: Props) {
  const [photosEnabled, setPhotosEnabled] = useState(initialPhotosEnabled)
  const [videosEnabled, setVideosEnabled] = useState(initialVideosEnabled)
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [loadingVideos, setLoadingVideos] = useState(false)

  const toggle = async (
    cle: 'upload_photos_enabled' | 'upload_videos_enabled',
    currentValue: boolean,
    setter: (v: boolean) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/upload-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cle, valeur: !currentValue }),
      })

      if (!res.ok) {
        toast.error('Erreur lors de la modification')
        return
      }

      setter(!currentValue)
      toast.success(
        !currentValue
          ? `Upload ${cle.includes('photo') ? 'photos' : 'vidéos'} activé ✅`
          : `Upload ${cle.includes('photo') ? 'photos' : 'vidéos'} désactivé 🔒`
      )
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg text-white mb-1">Contrôle des uploads</h2>
      <p className="text-xs text-white/30 mb-5">
        Activez ou désactivez les contributions depuis la page publique en temps réel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Toggle Photos */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
          photosEnabled ? 'border-faso-gold/30 bg-faso-gold/5' : 'border-white/10 bg-white/2'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              photosEnabled ? 'bg-faso-gold/20' : 'bg-white/5'
            }`}>
              <Image size={18} className={photosEnabled ? 'text-faso-gold' : 'text-white/30'} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Upload Photos</p>
              <p className={`text-xs ${photosEnabled ? 'text-faso-gold' : 'text-white/30'}`}>
                {photosEnabled ? 'Activé — contributeurs peuvent uploader' : 'Désactivé'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              toggle('upload_photos_enabled', photosEnabled, setPhotosEnabled, setLoadingPhotos)
            }
            disabled={loadingPhotos}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
              photosEnabled ? 'bg-faso-gold' : 'bg-white/20'
            } disabled:opacity-50`}
            aria-label={photosEnabled ? 'Désactiver upload photos' : 'Activer upload photos'}
          >
            {loadingPhotos ? (
              <Loader2 size={12} className="absolute inset-0 m-auto text-white animate-spin" />
            ) : (
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                  photosEnabled ? 'left-7' : 'left-1'
                }`}
              />
            )}
          </button>
        </div>

        {/* Toggle Vidéos */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
          videosEnabled ? 'border-faso-green/30 bg-faso-green/5' : 'border-white/10 bg-white/2'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              videosEnabled ? 'bg-faso-green/20' : 'bg-white/5'
            }`}>
              <Video size={18} className={videosEnabled ? 'text-faso-green' : 'text-white/30'} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Upload Vidéos</p>
              <p className={`text-xs ${videosEnabled ? 'text-faso-green' : 'text-white/30'}`}>
                {videosEnabled ? 'Activé — contributeurs peuvent uploader' : 'Désactivé — Bientôt disponible'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              toggle('upload_videos_enabled', videosEnabled, setVideosEnabled, setLoadingVideos)
            }
            disabled={loadingVideos}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
              videosEnabled ? 'bg-faso-green' : 'bg-white/20'
            } disabled:opacity-50`}
            aria-label={videosEnabled ? 'Désactiver upload vidéos' : 'Activer upload vidéos'}
          >
            {loadingVideos ? (
              <Loader2 size={12} className="absolute inset-0 m-auto text-white animate-spin" />
            ) : (
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                  videosEnabled ? 'left-7' : 'left-1'
                }`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
