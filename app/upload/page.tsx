'use client'
/**
 * app/upload/page.tsx — Page de contribution de médias
 * Sans authentification requise
 * Formulaire complet : contributeur + média — entièrement bilingue via next-intl
 */
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'
import {
  Upload, Image, Video, X, CheckCircle, AlertCircle,
  Loader2, Info, ChevronDown, User, Mail, Phone
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { LicenceType } from '@/types'

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

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const t = useTranslations('upload')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)

  // Données contributeur
  const [contributeurPrenom, setContributeurPrenom] = useState('')
  const [contributeurNom, setContributeurNom] = useState('')
  const [contributeurEmail, setContributeurEmail] = useState('')
  const [contributeurTel, setContributeurTel] = useState('')

  // Données média
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [ville, setVille] = useState('')
  const [region, setRegion] = useState('')
  const [categorie, setCategorie] = useState('')
  const [licence, setLicence] = useState<LicenceType>('CC BY')
  const [tags, setTags] = useState('')

  // Libellés des licences depuis les traductions
  const LICENCES = LICENCE_VALUES.map((v) => ({
    value: v,
    label: v,
    desc: t(`licence_desc_${v.replace(' ', '_').replace('-', '_')}` as Parameters<typeof t>[0]),
  }))

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'photo' as const,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(files[idx].preview)
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    if (currentIdx >= idx && currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  const handleSubmit = async () => {
    if (!files.length) {
      toast.error(t('error_no_file'))
      return
    }
    if (!categorie) {
      toast.error(t('error_no_category'))
      return
    }
    if (!contributeurPrenom.trim() || !contributeurNom.trim()) {
      toast.error(t('error_name_required'))
      return
    }
    if (!contributeurEmail.trim()) {
      toast.error(t('error_email_required'))
      return
    }

    setStatus('uploading')
    setProgress(0)

    let successCount = 0
    for (let i = 0; i < files.length; i++) {
      const { file, type } = files[i]
      setProgress(Math.round((i / files.length) * 60))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
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
        setStatus('processing')
        setProgress(60 + Math.round((i / files.length) * 35))

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

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

    setProgress(100)

    if (successCount > 0) {
      setStatus('success')
      toast.success(
        `${successCount} ${successCount > 1 ? t('files_selected_plural') : t('files_selected')} — ${t('success_msg')}`
      )
      setTimeout(() => router.push('/'), 3000)
    } else {
      setStatus('error')
    }
  }

  const currentFile = files[currentIdx]

  /* Couleurs adaptées au thème */
  const labelColor = isLight ? 'text-[rgba(26,45,74,0.6)]' : 'text-white/60'
  const labelMuted = isLight ? 'text-[rgba(26,45,74,0.3)]' : 'text-white/30'
  const dropzoneBorder = isLight ? 'border-[rgba(26,45,74,0.15)] hover:border-[rgba(26,45,74,0.28)]' : 'border-white/10 hover:border-white/20'
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

          {/* Colonne gauche — Upload + Preview */}
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

            {/* ── Zone Dropzone ── */}
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-faso-gold bg-faso-gold/5'
                  : dropzoneBorder
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-faso-red/20 to-faso-gold/20 flex items-center justify-center">
                  <Upload size={28} className="text-faso-gold" />
                </div>
                <div>
                  <p className={`font-medium mb-1 ${dropzoneText}`}>
                    {isDragActive ? t('drop_here') : t('drag_drop')}
                  </p>
                  <p className={`text-sm ${dropzoneSubText}`}>{t('click_select')}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="badge badge-gray text-xs">JPG, PNG, WebP</span>
                  <span className="badge badge-gray text-xs">MP4, MOV, WebM</span>
                  <span className="badge badge-gray text-xs">Max 100MB</span>
                </div>
              </div>
            </div>

            {/* Fichiers sélectionnés */}
            {files.length > 0 && (
              <div className="space-y-3">
                <p className={`text-xs uppercase tracking-wider ${fileCountColor}`}>
                  {files.length} {files.length > 1 ? t('files_selected_plural') : t('files_selected')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                        i === currentIdx ? 'border-faso-gold' : 'border-transparent'
                      }`}
                    >
                      {f.type === 'photo' ? (
                        <img src={f.preview} alt="" className="w-20 h-20 object-cover" />
                      ) : (
                        <div className="w-20 h-20 bg-faso-dusk flex items-center justify-center">
                          <Video size={24} className="text-faso-gold" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Preview grande taille */}
                {currentFile && (
                  <div className="rounded-2xl overflow-hidden bg-faso-dusk aspect-video flex items-center justify-center">
                    {currentFile.type === 'photo' ? (
                      <img
                        src={currentFile.preview}
                        alt="preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <video
                        src={currentFile.preview}
                        controls
                        className="max-w-full max-h-full"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Note info */}
            <div className="card p-4 flex items-start gap-3">
              <Info size={15} className="text-faso-gold flex-shrink-0 mt-0.5" />
              <p className={`text-xs leading-relaxed ${infoText}`}>
                {t('info_note')}
              </p>
            </div>
          </div>

          {/* Colonne droite — Formulaire */}
          <div className="space-y-5">

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
                  <ChevronDown
                    size={15}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${labelMuted} pointer-events-none`}
                  />
                </div>
              </div>
            </div>

            {/* Catégorie (obligatoire) */}
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
                <ChevronDown
                  size={15}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${labelMuted} pointer-events-none`}
                />
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

            {/* Bouton submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                status !== 'idle' ||
                !files.length ||
                !categorie ||
                !contributeurPrenom.trim() ||
                !contributeurNom.trim() ||
                !contributeurEmail.trim()
              }
              className="w-full btn-primary justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'idle'       && <><Upload      size={20} /> {t('submit')}</>}
              {status === 'uploading'  && <><Loader2     size={20} className="animate-spin" /> {t('uploading')} ({progress}%)</>}
              {status === 'processing' && <><Loader2     size={20} className="animate-spin" /> {t('processing')}</>}
              {status === 'success'    && <><CheckCircle size={20} /> {t('success')}</>}
              {status === 'error'      && <><AlertCircle size={20} /> {t('error_retry')}</>}
            </button>

            {/* Barre de progression */}
            {status !== 'idle' && status !== 'error' && (
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-faso-red via-faso-gold to-faso-green transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Message de succès */}
            {status === 'success' && (
              <div className="card p-4 border border-faso-green/30 bg-faso-green/5 text-center">
                <p className="text-faso-green font-medium text-sm">
                  {t('success_msg')}
                </p>
                <p className={`text-xs mt-1 ${successEmailText}`}>
                  {t('email_sent')} {contributeurEmail}
                </p>
              </div>
            )}

            <p className={`text-xs text-center ${teamText}`}>
              {t('team_review')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
