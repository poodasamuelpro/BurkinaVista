'use client'
/**
 * app/upload/page.tsx — Page de contribution de médias
 * Sans authentification requise
 * Formulaire complet : contributeur + média — entièrement bilingue via next-intl
 *
 * Logique toggles :
 *  - upload_photos_enabled : dropzone photo active ou désactivée visuellement
 *  - upload_videos_enabled : dropzone vidéo active ou désactivée visuellement
 *
 * Flux vidéo (quand activé) :
 *  1. Client obtient URL pré-signée via /api/videos/upload-url
 *  2. Client uploade directement vers Backblaze B2 (pas via Vercel)
 *  3. Client envoie métadonnées à /api/videos/save
 *
 * CORRECTIONS APPLIQUÉES :
 *  - 6.1 : Timeout XHR 2h + affichage vitesse de transfert
 *  - 6.3 : Statuts photo/vidéo séparés (photoStatus / videoStatus) — corrige le
 *          bug où "upload vidéo bloqué" s'affichait dans la dropzone image
 *  - 6.6 : Dropzone vidéo accepte désormais MKV + AVI
 *  - 6.7 : État activeTab mort supprimé — soumission photo et vidéo ne partagent
 *          plus le même état status ; les boutons se désactivent mutuellement
 */
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'
import {
  Upload, Image, Video, X, CheckCircle, AlertCircle,
  Loader2, Info, ChevronDown, User, Mail, Phone, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { LicenceType, UploadSettings } from '@/types'

const CATEGORIES = [
  'Architecture & Urbanisme', 'Marchés & Commerce', 'Culture & Traditions',
  'Nature & Paysages', 'Gastronomie', 'Art & Artisanat', 'Sport',
  'Portraits', 'Événements & Festivals', 'Infrastructure & Développement',
]

const REGIONS = [
  'Boucle du Mouhoun', 'Cascades', 'Centre', 'Centre-Est', 'Centre-Nord',
  'Centre-Ouest', 'Centre-Sud', 'Est', 'Hauts-Bassins', 'Nord',
  'Plateau-Central', 'Sahel', 'Sud-Ouest',
]

const LICENCE_VALUES: LicenceType[] = ['CC BY', 'CC0', 'CC BY-NC', 'CC BY-SA']

interface FileWithPreview {
  file: File
  preview: string
  type: 'photo' | 'video'
}

// ✅ FIX 6.7 — Chaque section a son propre statut, plus de status global partagé
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const t = useTranslations('upload')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  // Paramètres d'upload lus depuis admin_settings
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    upload_photos_enabled: true,
    upload_videos_enabled: false,
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/admin/upload-settings')
      .then((r) => r.json())
      .then((data) => {
        setUploadSettings(data)
        setSettingsLoaded(true)
      })
      .catch(() => setSettingsLoaded(true))
  }, [])

  // ── État images ──
  const [photoFiles, setPhotoFiles] = useState<FileWithPreview[]>([])
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)

  // ── État vidéo ──
  const [videoFile, setVideoFile] = useState<FileWithPreview | null>(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState<string | null>(null)

  // ✅ FIX 6.7 — Statuts séparés pour photos et vidéo
  // Évite le bug où un status partagé affichait "upload vidéo bloqué" dans la dropzone photo
  const [photoStatus, setPhotoStatus] = useState<UploadStatus>('idle')
  const [photoProgress, setPhotoProgress] = useState(0)
  const [videoStatus, setVideoStatus] = useState<UploadStatus>('idle')

  // Données contributeur
  const [contributeurPrenom, setContributeurPrenom] = useState('')
  const [contributeurNom, setContributeurNom] = useState('')
  const [contributeurEmail, setContributeurEmail] = useState('')
  const [contributeurTel, setContributeurTel] = useState('')

  // Données média (communes photo + vidéo)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [ville, setVille] = useState('')
  const [region, setRegion] = useState('')
  const [categorie, setCategorie] = useState('')
  const [licence, setLicence] = useState<LicenceType>('CC BY')
  const [tags, setTags] = useState('')

  const LICENCES = LICENCE_VALUES.map((v) => ({
    value: v,
    label: v,
    desc: t(`licence_desc_${v.replace(' ', '_').replace('-', '_')}` as Parameters<typeof t>[0]),
  }))

  // ── Dropzone photos ──
  const onDropPhoto = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'photo' as const,
    }))
    setPhotoFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps, isDragActive: isPhotoDragActive } =
    useDropzone({
      onDrop: onDropPhoto,
      accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
      maxSize: 20 * 1024 * 1024, // 20 MB
      disabled: !uploadSettings.upload_photos_enabled,
    })

  // ── Dropzone vidéo ──
  const onDropVideo = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    // Remplacer la vidéo précédente si déjà choisie
    if (videoFile) URL.revokeObjectURL(videoFile.preview)
    setVideoFile({
      file,
      preview: URL.createObjectURL(file),
      type: 'video',
    })
    // Réinitialiser le statut vidéo si on change de fichier
    setVideoStatus('idle')
    setVideoProgress(0)
    setUploadSpeed(null)
  }, [videoFile])

  // ✅ FIX 6.6 — Dropzone vidéo : ajout MKV + AVI (cohérence avec le serveur)
  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } =
    useDropzone({
      onDrop: onDropVideo,
      accept: {
        'video/mp4': ['.mp4'],
        'video/quicktime': ['.mov'],
        'video/webm': ['.webm'],
        'video/x-matroska': ['.mkv'],  // ✅ AJOUTÉ — type MIME officiel MKV
        'video/avi': ['.avi'],          // ✅ AJOUTÉ — AVI
        'video/x-msvideo': ['.avi'],    // ✅ AJOUTÉ — AVI type alternatif navigateur
      },
      maxFiles: 1,
      maxSize: 2 * 1024 * 1024 * 1024, // 2 GB
      disabled: !uploadSettings.upload_videos_enabled,
    })

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoFiles[idx].preview)
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx))
    if (currentPhotoIdx >= idx && currentPhotoIdx > 0) setCurrentPhotoIdx(currentPhotoIdx - 1)
  }

  const removeVideo = () => {
    if (videoFile) URL.revokeObjectURL(videoFile.preview)
    setVideoFile(null)
    setVideoProgress(0)
    setVideoStatus('idle')
    setUploadSpeed(null)
  }

  // ── Validation commune ──
  const validateCommon = (): boolean => {
    if (!categorie) { toast.error(t('error_no_category')); return false }
    if (!contributeurPrenom.trim() || !contributeurNom.trim()) { toast.error(t('error_name_required')); return false }
    if (!contributeurEmail.trim()) { toast.error(t('error_email_required')); return false }
    return true
  }

  // ── Submit photos ──
  const handleSubmitPhotos = async () => {
    if (!photoFiles.length) { toast.error(t('error_no_file')); return }
    if (!validateCommon()) return

    setPhotoStatus('uploading')
    setPhotoProgress(0)
    let successCount = 0

    for (let i = 0; i < photoFiles.length; i++) {
      const { file } = photoFiles[i]
      setPhotoProgress(Math.round((i / photoFiles.length) * 60))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'photo')
      formData.append('contributeur_prenom', contributeurPrenom.trim())
      formData.append('contributeur_nom', contributeurNom.trim())
      formData.append('contributeur_email', contributeurEmail.trim())
      formData.append('contributeur_tel', contributeurTel.trim())
      formData.append('titre', titre)
      formData.append('description', description)
      formData.append('ville', ville)
      formData.append('region', region)
      formData.append('categorie', categorie)
      formData.append('licence', licence)
      formData.append('tags', tags)

      try {
        setPhotoStatus('processing')
        setPhotoProgress(60 + Math.round((i / photoFiles.length) * 35))

        const res = await fetch('/api/upload', { method: 'POST', body: formData })

        if (!res.ok) {
          const data = await res.json()
          toast.error(`${file.name}: ${data.error || t('error_unknown')}`)
          continue
        }
        successCount++
      } catch {
        toast.error(`${t('error_network')} ${file.name}`)
      }
    }

    setPhotoProgress(100)
    if (successCount > 0) {
      setPhotoStatus('success')
      toast.success(`${successCount} ${successCount > 1 ? t('files_selected_plural') : t('files_selected')} — ${t('success_msg')}`)
      setTimeout(() => router.push('/'), 3000)
    } else {
      setPhotoStatus('error')
    }
  }

  // ── Submit vidéo ──
  const handleSubmitVideo = async () => {
    if (!videoFile) { toast.error(t('error_no_file')); return }
    if (!validateCommon()) return

    setVideoStatus('uploading')
    setVideoProgress(0)
    setUploadSpeed(null)

    try {
      // Étape 1 — Obtenir l'URL pré-signée Backblaze B2
      const urlRes = await fetch('/api/videos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: videoFile.file.name,
          contentType: videoFile.file.type,
          fileSize: videoFile.file.size,
        }),
      })

      if (!urlRes.ok) {
        const data = await urlRes.json()
        toast.error(data.error || t('error_unknown'))
        setVideoStatus('error')
        return
      }

      const { signedUrl, publicUrl, b2Key } = await urlRes.json()

      // Étape 2 — Upload direct vers Backblaze B2 avec suivi de progression
      // Le serveur Vercel ne touche jamais le fichier vidéo
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const startTime = Date.now()

        // ✅ FIX 6.3 — Suivi vitesse de transfert
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90)
            setVideoProgress(pct)

            // Calcul de la vitesse en MB/s
            const elapsed = (Date.now() - startTime) / 1000 // secondes
            if (elapsed > 0) {
              const speedMBs = e.loaded / elapsed / (1024 * 1024)
              setUploadSpeed(speedMBs.toFixed(1))
            }
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload B2 échoué: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error(t('error_network')))

        // ✅ FIX 6.3 — Timeout 2 heures (connexions lentes Afrique de l'Ouest)
        xhr.timeout = 7200000 // 2 heures en ms
        xhr.ontimeout = () => reject(new Error("Timeout : l'upload a pris trop de temps. Vérifiez votre connexion."))

        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', videoFile.file.type)
        xhr.send(videoFile.file)
      })

      setVideoProgress(92)
      setVideoStatus('processing')
      setUploadSpeed(null)

      // Étape 3 — Sauvegarder les métadonnées dans Neon
      const saveRes = await fetch('/api/videos/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          b2Url: publicUrl,
          b2Key,
          contributeurPrenom: contributeurPrenom.trim(),
          contributeurNom: contributeurNom.trim(),
          contributeurEmail: contributeurEmail.trim(),
          contributeurTel: contributeurTel.trim(),
          titre,
          description,
          ville,
          region,
          categorie,
          licence,
          tags,
        }),
      })

      if (!saveRes.ok) {
        const data = await saveRes.json()
        toast.error(data.error || t('error_unknown'))
        setVideoStatus('error')
        return
      }

      setVideoProgress(100)
      setVideoStatus('success')
      toast.success(t('success_msg'))
      setTimeout(() => router.push('/'), 3000)

    } catch (err) {
      console.error('[upload-video]', err)
      const message = err instanceof Error ? err.message : t('error_network')
      toast.error(message)
      setVideoStatus('error')
      setUploadSpeed(null)
    }
  }

  const currentPhotoFile = photoFiles[currentPhotoIdx]

  /* Couleurs adaptées au thème */
  const labelColor = isLight ? 'text-[rgba(26,45,74,0.6)]' : 'text-white/60'
  const labelMuted = isLight ? 'text-[rgba(26,45,74,0.3)]' : 'text-white/30'
  const dropzoneBorder = isLight
    ? 'border-[rgba(26,45,74,0.15)] hover:border-[rgba(26,45,74,0.28)]'
    : 'border-white/10 hover:border-white/20'
  const dropzoneText = isLight ? 'text-[#1A2D4A]' : 'text-white'
  const dropzoneSubText = isLight ? 'text-[rgba(26,45,74,0.4)]' : 'text-white/30'
  const fileCountColor = isLight ? 'text-[rgba(26,45,74,0.35)]' : 'text-white/30'
  const licenceActive = 'border-faso-gold bg-faso-gold/10'
  const licenceInactive = isLight
    ? 'border-[rgba(26,45,74,0.12)] hover:border-[rgba(26,45,74,0.25)]'
    : 'border-white/10 hover:border-white/20'
  const licenceTitle = isLight ? 'text-[#1A2D4A]' : 'text-white'
  const licenceDesc = isLight ? 'text-[rgba(26,45,74,0.45)]' : 'text-white/40'
  const infoText = isLight ? 'text-[rgba(26,45,74,0.5)]' : 'text-white/50'
  const teamText = isLight ? 'text-[rgba(26,45,74,0.25)]' : 'text-white/20'
  const successEmailText = isLight ? 'text-[rgba(26,45,74,0.45)]' : 'text-white/40'
  const cardTitle = isLight ? 'text-[#1A2D4A]' : 'text-white'
  const sectionDivider = isLight ? 'border-[rgba(26,45,74,0.08)]' : 'border-white/5'

  // Affichage pendant le chargement des settings
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-faso-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 badge badge-gold mb-4">
            <Upload size={14} />
            {t('badge')}
          </div>
          <h1 className="font-display text-3xl md:text-5xl mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('title')}{' '}
            <span className="text-gradient-faso">{t('title_gradient')}</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── COLONNE GAUCHE ── */}
          <div className="space-y-6">

            {/* ── Section Contributeur ── */}
            <div className="card p-5 border border-faso-gold/20">
              <h2 className={`font-display text-base mb-4 flex items-center gap-2 ${cardTitle}`}>
                <User size={16} className="text-faso-gold" />
                {t('your_info')}
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1.5 ${labelColor}`}>
                      {t('firstname')} <span className="text-faso-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={contributeurPrenom}
                      onChange={(e) => setContributeurPrenom(e.target.value)}
                      placeholder="Mamadou"
                      className="input-field text-sm py-2.5"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1.5 ${labelColor}`}>
                      {t('lastname')} <span className="text-faso-red">*</span>
                    </label>
                    <input
                      type="text"
                      value={contributeurNom}
                      onChange={(e) => setContributeurNom(e.target.value)}
                      placeholder="Ouédraogo"
                      className="input-field text-sm py-2.5"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1.5 ${labelColor}`}>
                    Email <span className="text-faso-red">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${labelMuted}`} />
                    <input
                      type="email"
                      value={contributeurEmail}
                      onChange={(e) => setContributeurEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="input-field text-sm py-2.5 pl-9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs mb-1.5 ${labelColor}`}>
                    {t('phone')} <span className={labelMuted}>{t('phone_optional')}</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${labelMuted}`} />
                    <input
                      type="tel"
                      value={contributeurTel}
                      onChange={(e) => setContributeurTel(e.target.value)}
                      placeholder="+226 70 00 00 00"
                      className="input-field text-sm py-2.5 pl-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                SECTION PHOTOS
            ════════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  uploadSettings.upload_photos_enabled ? 'bg-faso-gold/10' : 'bg-white/5'
                }`}>
                  <Image size={18} className={uploadSettings.upload_photos_enabled ? 'text-faso-gold' : labelMuted} />
                </div>
                <div>
                  <h2 className={`font-display text-xl ${uploadSettings.upload_photos_enabled ? cardTitle : (isLight ? 'text-[rgba(26,45,74,0.4)]' : 'text-white/40')}`}>
                    {t('section_photos')}
                  </h2>
                  <p className={`text-xs ${labelMuted}`}>JPG, PNG, WebP, GIF — max 20MB</p>
                </div>
                {!uploadSettings.upload_photos_enabled && (
                  <span className="inline-flex items-center gap-1 badge badge-gray text-xs opacity-70 ml-auto">
                    <Lock size={10} />
                    {t('coming_soon')}
                  </span>
                )}
              </div>

              {uploadSettings.upload_photos_enabled ? (
                <>
                  {/* Dropzone photos active */}
                  <div
                    {...getPhotoRootProps()}
                    className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      isPhotoDragActive ? 'border-faso-gold bg-faso-gold/5' : dropzoneBorder
                    }`}
                  >
                    <input {...getPhotoInputProps()} />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-faso-red/20 to-faso-gold/20 flex items-center justify-center">
                        <Image size={28} className="text-faso-gold" />
                      </div>
                      <div>
                        <p className={`font-medium mb-1 ${dropzoneText}`}>
                          {isPhotoDragActive ? t('drop_here') : t('drag_drop')}
                        </p>
                        <p className={`text-sm ${dropzoneSubText}`}>{t('click_select')}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {['JPG', 'PNG', 'WebP', 'GIF', 'Max 20MB'].map((b) => (
                          <span key={b} className="badge badge-gray text-xs">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ✅ FIX 6.3 — Statut photo affiché uniquement dans la zone photo */}
                  {photoStatus === 'uploading' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-faso-gold">
                      <Loader2 size={13} className="animate-spin" />
                      <span>{t('uploading')} ({photoProgress}%)</span>
                    </div>
                  )}
                  {photoStatus === 'processing' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-faso-gold">
                      <Loader2 size={13} className="animate-spin" />
                      <span>{t('processing')}</span>
                    </div>
                  )}
                  {photoStatus === 'error' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-faso-red">
                      <AlertCircle size={13} />
                      <span>{t('error_retry')}</span>
                    </div>
                  )}

                  {/* Aperçu photos */}
                  {photoFiles.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <p className={`text-xs uppercase tracking-wider ${fileCountColor}`}>
                        {photoFiles.length} {photoFiles.length > 1 ? t('files_selected_plural') : t('files_selected')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {photoFiles.map((f, i) => (
                          <div
                            key={i}
                            onClick={() => setCurrentPhotoIdx(i)}
                            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                              i === currentPhotoIdx ? 'border-faso-gold' : 'border-transparent'
                            }`}
                          >
                            <img src={f.preview} alt="" className="w-20 h-20 object-cover" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {currentPhotoFile && (
                        <div className="rounded-2xl overflow-hidden bg-faso-dusk aspect-video flex items-center justify-center">
                          <img src={currentPhotoFile.preview} alt="preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Photos désactivées — bloc verrouillé */
                <div className="relative rounded-3xl overflow-hidden">
                  <div
                    className="absolute inset-0 z-10 rounded-3xl flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
                    style={{ background: isLight ? 'rgba(250,250,248,0.75)' : 'rgba(10,10,15,0.75)' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                      <Lock size={28} className={labelMuted} />
                    </div>
                    <div className="text-center px-6">
                      {/* ✅ FIX bug message — "upload photo bloqué" et non "upload vidéo bloqué" */}
                      <p className={`font-display text-lg mb-1 ${isLight ? 'text-[rgba(26,45,74,0.55)]' : 'text-white/50'}`}>
                        {t('photo_coming_soon_title')}
                      </p>
                      <p className={`text-sm max-w-xs leading-relaxed ${isLight ? 'text-[rgba(26,45,74,0.35)]' : 'text-white/30'}`}>
                        {t('photo_coming_soon_desc')}
                      </p>
                    </div>
                  </div>
                  <div className={`border-2 border-dashed rounded-3xl p-8 text-center opacity-30 pointer-events-none select-none ${dropzoneBorder}`}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-faso-red/20 to-faso-gold/20 flex items-center justify-center">
                        <Image size={28} className="text-faso-gold" />
                      </div>
                      <p className={`font-medium ${dropzoneText}`}>{t('drag_drop')}</p>
                    </div>
                  </div>
                </div>
              )}

              {uploadSettings.upload_photos_enabled && (
                <div className="card p-4 flex items-start gap-3 mt-4">
                  <Info size={15} className="text-faso-gold flex-shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed ${infoText}`}>{t('info_note')}</p>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════
                SECTION VIDÉO
            ════════════════════════════════════════════════ */}
            <div className={`border-t ${sectionDivider} pt-6`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  uploadSettings.upload_videos_enabled ? 'bg-faso-green/10' : 'bg-white/5'
                }`}>
                  <Video size={18} className={uploadSettings.upload_videos_enabled ? 'text-faso-green' : labelMuted} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className={`font-display text-xl ${
                      uploadSettings.upload_videos_enabled
                        ? cardTitle
                        : (isLight ? 'text-[rgba(26,45,74,0.4)]' : 'text-white/40')
                    }`}>
                      {t('section_videos')}
                    </h2>
                    {!uploadSettings.upload_videos_enabled && (
                      <span className="inline-flex items-center gap-1 badge badge-gray text-xs opacity-70">
                        <Lock size={10} />
                        {t('coming_soon')}
                      </span>
                    )}
                  </div>
                  {/* ✅ FIX 6.6 — Label mis à jour pour inclure MKV + AVI */}
                  <p className={`text-xs ${labelMuted}`}>MP4, MOV, WebM, MKV, AVI — max 2 Go</p>
                </div>
              </div>

              {uploadSettings.upload_videos_enabled ? (
                <>
                  {/* Dropzone vidéo active */}
                  {!videoFile ? (
                    <div
                      {...getVideoRootProps()}
                      className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
                        isVideoDragActive ? 'border-faso-green bg-faso-green/5' : dropzoneBorder
                      }`}
                    >
                      <input {...getVideoInputProps()} />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-faso-green/20 to-faso-gold/20 flex items-center justify-center">
                          <Video size={28} className="text-faso-green" />
                        </div>
                        <div>
                          <p className={`font-medium mb-1 ${dropzoneText}`}>
                            {isVideoDragActive ? t('drop_here') : t('drag_drop_video')}
                          </p>
                          <p className={`text-sm ${dropzoneSubText}`}>{t('click_select')}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          {['MP4', 'MOV', 'WebM', 'MKV', 'AVI', 'Max 2 Go'].map((b) => (
                            <span key={b} className="badge badge-gray text-xs">{b}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Vidéo sélectionnée — aperçu */
                    <div className="card p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-faso-green/10 flex items-center justify-center flex-shrink-0">
                          <Video size={18} className="text-faso-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${cardTitle}`}>{videoFile.file.name}</p>
                          <p className={`text-xs ${labelMuted}`}>
                            {(videoFile.file.size / (1024 * 1024)).toFixed(1)} Mo
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeVideo}
                          disabled={videoStatus === 'uploading' || videoStatus === 'processing'}
                          className="w-7 h-7 rounded-full bg-faso-red/10 flex items-center justify-center hover:bg-faso-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <X size={14} className="text-faso-red" />
                        </button>
                      </div>

                      {/* ✅ FIX 6.3 — Barre de progression + vitesse uniquement dans la zone vidéo */}
                      {videoProgress > 0 && videoProgress < 100 && (
                        <div className="space-y-1.5">
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-faso-green transition-all duration-300"
                              style={{ width: `${videoProgress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs ${labelMuted}`}>
                              {videoStatus === 'processing' ? t('processing') : `${t('uploading')} ${videoProgress}%`}
                            </span>
                            {/* ✅ FIX 6.3 — Affichage vitesse de transfert */}
                            {uploadSpeed && videoStatus === 'uploading' && (
                              <span className={`text-xs ${labelMuted}`}>{uploadSpeed} MB/s</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ✅ FIX 6.3 — Statut vidéo affiché uniquement dans la zone vidéo */}
                      {videoStatus === 'error' && (
                        <div className="flex items-center gap-2 text-xs text-faso-red">
                          <AlertCircle size={13} />
                          <span>{t('error_retry')}</span>
                        </div>
                      )}
                      {videoStatus === 'success' && (
                        <div className="flex items-center gap-2 text-xs text-faso-green">
                          <CheckCircle size={13} />
                          <span>{t('success')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card p-4 flex items-start gap-3 mt-4">
                    <Info size={15} className="text-faso-green flex-shrink-0 mt-0.5" />
                    <p className={`text-xs leading-relaxed ${infoText}`}>{t('video_info_note')}</p>
                  </div>
                </>
              ) : (
                /* Vidéos désactivées — bloc verrouillé */
                <div className="relative rounded-3xl overflow-hidden">
                  <div
                    className="absolute inset-0 z-10 rounded-3xl flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
                    style={{ background: isLight ? 'rgba(250,250,248,0.75)' : 'rgba(10,10,15,0.75)' }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                      <Lock size={28} className={labelMuted} />
                    </div>
                    <div className="text-center px-6">
                      {/* ✅ FIX bug message — clé i18n correcte pour la vidéo */}
                      <p className={`font-display text-lg mb-1 ${isLight ? 'text-[rgba(26,45,74,0.55)]' : 'text-white/50'}`}>
                        {t('video_coming_soon_title')}
                      </p>
                      <p className={`text-sm max-w-xs leading-relaxed ${isLight ? 'text-[rgba(26,45,74,0.35)]' : 'text-white/30'}`}>
                        {t('video_coming_soon_desc')}
                      </p>
                    </div>
                  </div>
                  <div className={`border-2 border-dashed rounded-3xl p-8 text-center opacity-30 pointer-events-none select-none ${dropzoneBorder}`}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Video size={28} className={labelMuted} />
                      </div>
                      <p className={`font-medium ${dropzoneText}`}>{t('drag_drop_video')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* ── Fin colonne gauche ── */}

          {/* ── COLONNE DROITE — Formulaire ── */}
          <div className="space-y-5">

            {/* Spacer alignement */}
            <div className="flex items-center gap-3 opacity-0 pointer-events-none select-none" aria-hidden>
              <div className="w-9 h-9" />
              <div>
                <p className="font-display text-xl">&nbsp;</p>
                <p className="text-xs">&nbsp;</p>
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className={`block text-sm mb-2 ${labelColor}`}>
                {t('title_field')} <span className={labelMuted}>{t('optional')}</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Marché central de Ouagadougou"
                className="input-field"
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm mb-2 ${labelColor}`}>
                {t('description_field')} <span className={labelMuted}>{t('optional')}</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez ce que montre ce média..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Ville + Région */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${labelColor}`}>{t('city')}</label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="Ouagadougou"
                  className="input-field"
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${labelColor}`}>{t('region')}</label>
                <div className="relative">
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="input-field appearance-none pr-8"
                  >
                    <option value="">{t('select')}</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 ${labelMuted} pointer-events-none`} />
                </div>
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className={`block text-sm mb-2 ${labelColor}`}>
                {t('category')} <span className="text-faso-red">*</span>
              </label>
              <div className="relative">
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="input-field appearance-none pr-8"
                  required
                >
                  <option value="">{t('choose_category')}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 ${labelMuted} pointer-events-none`} />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={`block text-sm mb-2 ${labelColor}`}>
                {t('tags')} <span className={labelMuted}>{t('tags_hint')}</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="marché, culture, traditions..."
                className="input-field"
              />
            </div>

            {/* Licence */}
            <div>
              <label className={`block text-sm mb-3 ${labelColor}`}>{t('licence')}</label>
              <div className="grid grid-cols-2 gap-2">
                {LICENCES.map((lic) => (
                  <button
                    key={lic.value}
                    type="button"
                    onClick={() => setLicence(lic.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      licence === lic.value ? licenceActive : licenceInactive
                    }`}
                  >
                    <span className={`block font-medium text-sm ${licenceTitle}`}>{lic.label}</span>
                    <span className={`block text-xs mt-0.5 leading-tight ${licenceDesc}`}>{lic.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                BOUTONS DE SOUMISSION
                ✅ FIX 6.7 — Boutons avec statuts séparés et désactivation croisée
                Le bouton photo est disabled si la vidéo est en cours (et vice versa)
                Évite les double-soumissions et les états partagés corrompus
            ════════════════════════════════════════════════ */}

            {/* Bouton photos */}
            {uploadSettings.upload_photos_enabled && photoFiles.length > 0 && (
              <button
                type="button"
                onClick={handleSubmitPhotos}
                disabled={
                  photoStatus !== 'idle' ||
                  videoStatus === 'uploading' ||
                  videoStatus === 'processing' ||
                  !photoFiles.length ||
                  !categorie ||
                  !contributeurPrenom.trim() ||
                  !contributeurNom.trim() ||
                  !contributeurEmail.trim()
                }
                className="w-full btn-primary justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {photoStatus === 'idle'       && <><Upload      size={20} /> {t('submit')} ({photoFiles.length} photo{photoFiles.length > 1 ? 's' : ''})</>}
                {photoStatus === 'uploading'  && <><Loader2     size={20} className="animate-spin" /> {t('uploading')} ({photoProgress}%)</>}
                {photoStatus === 'processing' && <><Loader2     size={20} className="animate-spin" /> {t('processing')}</>}
                {photoStatus === 'success'    && <><CheckCircle size={20} /> {t('success')}</>}
                {photoStatus === 'error'      && <><AlertCircle size={20} /> {t('error_retry')}</>}
              </button>
            )}

            {/* Bouton vidéo */}
            {uploadSettings.upload_videos_enabled && videoFile && (
              <button
                type="button"
                onClick={handleSubmitVideo}
                disabled={
                  videoStatus !== 'idle' ||
                  photoStatus === 'uploading' ||
                  photoStatus === 'processing' ||
                  !videoFile ||
                  !categorie ||
                  !contributeurPrenom.trim() ||
                  !contributeurNom.trim() ||
                  !contributeurEmail.trim()
                }
                className="w-full btn-primary justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--faso-green), var(--faso-gold))' }}
              >
                {videoStatus === 'idle'       && <><Upload      size={20} /> {t('submit')} (1 vidéo)</>}
                {videoStatus === 'uploading'  && <><Loader2     size={20} className="animate-spin" /> Upload vidéo... ({videoProgress}%)</>}
                {videoStatus === 'processing' && <><Loader2     size={20} className="animate-spin" /> {t('processing')}</>}
                {videoStatus === 'success'    && <><CheckCircle size={20} /> {t('success')}</>}
                {videoStatus === 'error'      && <><AlertCircle size={20} /> {t('error_retry')}</>}
              </button>
            )}

            {/* Bouton par défaut si rien de sélectionné */}
            {!photoFiles.length && !videoFile && (
              <button
                type="button"
                disabled
                className="w-full btn-primary justify-center py-4 text-base opacity-50 cursor-not-allowed"
              >
                <Upload size={20} /> {t('submit')}
              </button>
            )}

            {/* Barres de progression globales */}
            {(photoStatus === 'uploading' || photoStatus === 'processing') && (
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-faso-red via-faso-gold to-faso-green transition-all duration-500"
                  style={{ width: `${photoProgress}%` }}
                />
              </div>
            )}
            {(videoStatus === 'uploading' || videoStatus === 'processing') && (
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-faso-green to-faso-gold transition-all duration-500"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            )}

            {/* Message de succès — photo */}
            {photoStatus === 'success' && (
              <div className="card p-4 border border-faso-green/30 bg-faso-green/5 text-center">
                <p className="text-faso-green font-medium text-sm">{t('success_msg')}</p>
                <p className={`text-xs mt-1 ${successEmailText}`}>
                  {t('email_sent')} {contributeurEmail}
                </p>
              </div>
            )}

            {/* Message de succès — vidéo */}
            {videoStatus === 'success' && (
              <div className="card p-4 border border-faso-green/30 bg-faso-green/5 text-center">
                <p className="text-faso-green font-medium text-sm">{t('success_msg')}</p>
                <p className={`text-xs mt-1 ${successEmailText}`}>
                  {t('email_sent')} {contributeurEmail}
                </p>
              </div>
            )}

            <p className={`text-xs text-center ${teamText}`}>{t('team_review')}</p>
          </div>
          {/* ── Fin colonne droite ── */}

        </div>
      </div>
    </div>
  )
}
