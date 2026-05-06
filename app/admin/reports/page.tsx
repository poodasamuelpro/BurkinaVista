/**
 * app/admin/reports/page.tsx — Dashboard admin des signalements
 *
 * AJOUT (Audit 2026-05-01) — Item #14
 *
 * FIX (2026-05-06) — Alignement statuts UI ↔ API ↔ SQL :
 *  - 'review'   → 'reviewed'
 *  - 'resolved' → 'actioned'
 *
 * FIX (2026-05-06) — Modale détail enrichie :
 *  - Affichage image (cloudinary) ou vidéo/thumbnail (b2)
 *  - Infos contributeur complets (nom, email, tel)
 *  - Métadonnées upload (date, IP, taille, licence, ville, région, catégorie)
 *  - Statut actuel du média (approved / pending / rejected)
 *  - Lien externe vers la page publique
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, AlertTriangle, Eye, CheckCircle, XCircle, Clock,
  RefreshCw, X, ExternalLink, Flag, Mail, Globe, User, Calendar,
  FileText, HardDrive, MapPin, Tag, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportRow {
  id: string
  media_id: string
  reason: string
  message: string | null
  reporter_email: string | null
  reporter_ip: string | null
  statut: string
  admin_note: string | null
  created_at: string
  updated_at: string | null

  media_titre: string | null
  media_slug: string | null
  media_type: string | null
  media_statut: string | null
  media_created_at: string | null

  media_cloudinary_url: string | null
  media_b2_url: string | null
  media_thumbnail_url: string | null
  media_width: number | null
  media_height: number | null

  media_file_size: number | null
  media_original_filename: string | null
  media_ip_address: string | null
  media_licence: string | null
  media_ville: string | null
  media_region: string | null
  media_categorie: string | null

  contributeur_nom: string | null
  contributeur_prenom: string | null
  contributeur_email: string | null
  contributeur_tel: string | null
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  copyright:     "Atteinte au droit d'auteur",
  incorrect_info:'Informations erronées',
  spam:          'Spam / publicité',
  illegal:       'Contenu illégal',
  other:         'Autre',
}

const REASON_COLORS: Record<string, string> = {
  inappropriate: 'text-orange-400 bg-orange-400/10',
  copyright:     'text-red-400 bg-red-400/10',
  incorrect_info:'text-yellow-400 bg-yellow-400/10',
  spam:          'text-white/50 bg-white/5',
  illegal:       'text-red-500 bg-red-500/15',
  other:         'text-white/40 bg-white/5',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10' },
  reviewed:  { label: 'En cours',   color: 'text-blue-400 bg-blue-400/10' },
  actioned:  { label: 'Résolu',     color: 'text-green-400 bg-green-400/10' },
  dismissed: { label: 'Ignoré',     color: 'text-white/40 bg-white/5' },
}

const MEDIA_STATUT_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: 'Publié',    color: 'text-green-400' },
  pending:  { label: 'En attente', color: 'text-yellow-400' },
  rejected: { label: 'Refusé',    color: 'text-red-400' },
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function AdminReportsPage() {
  const [reports, setReports]     = useState<ReportRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<string>('all')
  const [selected, setSelected]   = useState<ReportRow | null>(null)
  const [noteInput, setNoteInput] = useState<string>('')
  const [updating, setUpdating]   = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/admin/reports'
        : `/api/admin/reports?statut=${encodeURIComponent(filter)}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data.reports || [])
    } catch {
      toast.error('Erreur chargement signalements')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadReports() }, [loadReports])

  const updateStatus = async (id: string, statut: string, admin_note?: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut, admin_note }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur mise à jour')
        return
      }
      toast.success('Statut mis à jour')
      setSelected(null)
      loadReports()
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setUpdating(null)
    }
  }

  const displayed = filter === 'all'
    ? reports
    : reports.filter((r) => r.statut === filter)

  const counts = {
    all:       reports.length,
    pending:   reports.filter((r) => r.statut === 'pending').length,
    reviewed:  reports.filter((r) => r.statut === 'reviewed').length,
    actioned:  reports.filter((r) => r.statut === 'actioned').length,
    dismissed: reports.filter((r) => r.statut === 'dismissed').length,
  }

  const openDetail = (r: ReportRow) => {
    setSelected(r)
    setNoteInput(r.admin_note || '')
  }

  // Image à afficher dans la modale : photo cloudinary ou thumbnail vidéo
  const getPreviewUrl = (r: ReportRow): string | null => {
    if (r.media_type === 'photo') return r.media_cloudinary_url
    return r.media_thumbnail_url || null
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm mb-6 text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={16} /> Retour au dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-white flex items-center gap-3">
              <AlertTriangle className="text-faso-red" size={28} />
              Signalements
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Gestion des médias signalés par les utilisateurs
            </p>
          </div>
          <button
            onClick={loadReports}
            className="btn-ghost flex items-center gap-2 text-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Rafraîchir
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all',       label: 'Tous' },
            { key: 'pending',   label: 'En attente' },
            { key: 'reviewed',  label: 'En cours' },
            { key: 'actioned',  label: 'Résolus' },
            { key: 'dismissed', label: 'Ignorés' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                filter === f.key
                  ? 'bg-faso-gold text-black font-medium'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f.label} ({counts[f.key as keyof typeof counts]})
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-12 text-white/40">Chargement…</div>
        ) : displayed.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle size={40} className="text-faso-green mx-auto mb-4" />
            <p className="text-white/60">Aucun signalement à afficher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((r) => {
              const status = STATUS_LABELS[r.statut] || STATUS_LABELS.pending
              const reasonColor = REASON_COLORS[r.reason] || 'text-white/40 bg-white/5'
              const isUpdating = updating === r.id
              const preview = getPreviewUrl(r)

              return (
                <div
                  key={r.id}
                  className="card p-5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {preview && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                        <img
                          src={preview}
                          alt={r.media_titre || 'média'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Badges statut + motif + date */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${status.color}`}>
                          <Clock size={10} className="inline-block mr-1" />
                          {status.label}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${reasonColor}`}>
                          <Flag size={10} className="inline-block mr-1" />
                          {REASON_LABELS[r.reason] || r.reason}
                        </span>
                        <span className="text-xs text-white/30">
                          {new Date(r.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      {/* Titre */}
                      <h3 className="font-medium text-white text-sm mb-1 truncate">
                        {r.media_titre || `Média ${r.media_id.slice(0, 8)}…`}
                        {r.media_type && (
                          <span className="ml-2 text-xs text-white/30">({r.media_type})</span>
                        )}
                      </h3>

                      {/* Signalant */}
                      <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-3">
                        {r.reporter_email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail size={10} /> {r.reporter_email}
                          </span>
                        )}
                        {r.reporter_ip && (
                          <span className="inline-flex items-center gap-1">
                            <Globe size={10} /> {r.reporter_ip}
                          </span>
                        )}
                        {!r.reporter_email && !r.reporter_ip && (
                          <span className="italic">Anonyme</span>
                        )}
                      </div>

                      {/* Message aperçu */}
                      {r.message && (
                        <p className="text-xs text-white/50 line-clamp-1 mb-3 italic">
                          "{r.message}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openDetail(r)}
                          className="px-3 py-1.5 text-xs bg-white/5 text-white/60 rounded-md hover:bg-white/10 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={11} /> Voir le détail
                        </button>
                        {r.statut === 'pending' && (
                          <button
                            onClick={() => updateStatus(r.id, 'reviewed')}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-xs bg-blue-400/10 text-blue-400 rounded-md hover:bg-blue-400/20 transition-colors disabled:opacity-50"
                          >
                            Prendre en charge
                          </button>
                        )}
                        {r.statut !== 'actioned' && (
                          <button
                            onClick={() => openDetail(r)}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-xs bg-green-400/10 text-green-400 rounded-md hover:bg-green-400/20 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={11} className="inline-block mr-1" />
                            Résoudre
                          </button>
                        )}
                        {r.statut !== 'dismissed' && r.statut !== 'actioned' && (
                          <button
                            onClick={() => updateStatus(r.id, 'dismissed')}
                            disabled={isUpdating}
                            className="px-3 py-1.5 text-xs bg-white/5 text-white/50 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={11} className="inline-block mr-1" />
                            Ignorer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modale détail complète ─────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-faso-dusk border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="sticky top-0 bg-faso-dusk border-b border-white/5 px-6 py-4 flex items-start justify-between z-10">
              <div>
                <h2 className="text-white font-semibold text-base leading-tight">
                  {selected.media_titre || `Média ${selected.media_id.slice(0, 8)}…`}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${REASON_COLORS[selected.reason] || 'text-white/40 bg-white/5'}`}>
                    <Flag size={10} className="inline-block mr-1" />
                    {REASON_LABELS[selected.reason] || selected.reason}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${(STATUS_LABELS[selected.statut] || STATUS_LABELS.pending).color}`}>
                    {(STATUS_LABELS[selected.statut] || STATUS_LABELS.pending).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white flex-shrink-0 ml-4"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── Visuel du média ── */}
              {(selected.media_cloudinary_url || selected.media_thumbnail_url) && (
                <div className="relative rounded-xl overflow-hidden bg-black/30">
                  {selected.media_type === 'photo' && selected.media_cloudinary_url ? (
                    <img
                      src={selected.media_cloudinary_url}
                      alt={selected.media_titre || 'média signalé'}
                      className="w-full max-h-72 object-contain"
                    />
                  ) : selected.media_thumbnail_url ? (
                    <div className="relative">
                      <img
                        src={selected.media_thumbnail_url}
                        alt={selected.media_titre || 'vidéo signalée'}
                        className="w-full max-h-72 object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Lien externe flottant */}
                  {selected.media_slug && (
                    <a
                      href={`${APP_URL}/photos/${selected.media_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs bg-black/70 text-white px-3 py-1.5 rounded-lg hover:bg-black/90 transition-colors"
                    >
                      <ExternalLink size={11} />
                      Voir sur le site
                    </a>
                  )}
                </div>
              )}

              {/* Lien si pas de visuel */}
              {!selected.media_cloudinary_url && !selected.media_thumbnail_url && selected.media_slug && (
                <a
                  href={`${APP_URL}/photos/${selected.media_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-faso-gold hover:underline"
                >
                  <ExternalLink size={12} />
                  Voir le média sur le site
                </a>
              )}

              {/* ── Signalement ── */}
              <section>
                <h3 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Flag size={12} /> Signalement
                </h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                  <Row label="Date signalement" value={new Date(selected.created_at).toLocaleString('fr-FR')} />
                  <Row label="Motif" value={REASON_LABELS[selected.reason] || selected.reason} highlight />
                  {selected.reporter_email && <Row label="Email signalant" value={selected.reporter_email} highlight />}
                  {selected.reporter_ip    && <Row label="IP signalant"    value={selected.reporter_ip} mono />}
                  {!selected.reporter_email && !selected.reporter_ip && <Row label="Signalant" value="Anonyme" />}
                </div>
                {selected.message && (
                  <div className="mt-3 bg-white/5 rounded-xl p-4 border-l-2 border-faso-gold/40">
                    <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Message du signalant</p>
                    <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
                      {selected.message}
                    </p>
                  </div>
                )}
              </section>

              {/* ── Infos upload du média ── */}
              <section>
                <h3 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar size={12} /> Infos upload du média
                </h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                  {selected.media_created_at && (
                    <Row label="Date upload" value={new Date(selected.media_created_at).toLocaleString('fr-FR')} />
                  )}
                  {selected.media_statut && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Statut du média</span>
                      <span className={MEDIA_STATUT_LABELS[selected.media_statut]?.color || 'text-white/60'}>
                        {MEDIA_STATUT_LABELS[selected.media_statut]?.label || selected.media_statut}
                      </span>
                    </div>
                  )}
                  {selected.media_original_filename && (
                    <Row label="Fichier original" value={selected.media_original_filename} mono />
                  )}
                  {selected.media_file_size != null && (
                    <Row label="Taille" value={formatFileSize(selected.media_file_size)} />
                  )}
                  {selected.media_ip_address && (
                    <Row label="IP upload" value={selected.media_ip_address} mono />
                  )}
                  {selected.media_licence && (
                    <Row label="Licence" value={selected.media_licence} />
                  )}
                  {(selected.media_ville || selected.media_region) && (
                    <Row
                      label="Localisation"
                      value={[selected.media_ville, selected.media_region].filter(Boolean).join(', ')}
                    />
                  )}
                  {selected.media_categorie && (
                    <Row label="Catégorie" value={selected.media_categorie} />
                  )}
                  {selected.media_width && selected.media_height && (
                    <Row label="Dimensions" value={`${selected.media_width} × ${selected.media_height} px`} />
                  )}
                </div>
              </section>

              {/* ── Contributeur ── */}
              {(selected.contributeur_nom || selected.contributeur_email) && (
                <section>
                  <h3 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User size={12} /> Contributeur
                  </h3>
                  <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                    {(selected.contributeur_nom || selected.contributeur_prenom) && (
                      <Row
                        label="Nom"
                        value={[selected.contributeur_prenom, selected.contributeur_nom].filter(Boolean).join(' ')}
                        highlight
                      />
                    )}
                    {selected.contributeur_email && (
                      <Row label="Email" value={selected.contributeur_email} highlight />
                    )}
                    {selected.contributeur_tel && (
                      <Row label="Téléphone" value={selected.contributeur_tel} />
                    )}
                  </div>
                </section>
              )}

              {/* ── Note admin + actions ── */}
              <section>
                <h3 className="text-xs text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield size={12} /> Traitement admin
                </h3>

                <div className="mb-3">
                  <label className="text-xs text-white/40 mb-2 block">
                    Note interne (optionnel — envoyée au signalant si résolu)
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={3}
                    placeholder="Ex : Média mis à jour, informations corrigées…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-faso-gold/40"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.statut === 'pending' && (
                    <button
                      onClick={() => updateStatus(selected.id, 'reviewed', noteInput || undefined)}
                      disabled={updating === selected.id}
                      className="flex-1 px-4 py-2.5 text-sm bg-blue-400/10 text-blue-400 rounded-xl hover:bg-blue-400/20 transition-colors disabled:opacity-50"
                    >
                      Prendre en charge
                    </button>
                  )}
                  {selected.statut !== 'actioned' && (
                    <button
                      onClick={() => updateStatus(selected.id, 'actioned', noteInput || undefined)}
                      disabled={updating === selected.id}
                      className="flex-1 px-4 py-2.5 text-sm bg-green-400/10 text-green-400 rounded-xl hover:bg-green-400/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={13} className="inline-block mr-1.5" />
                      Marquer résolu
                    </button>
                  )}
                  {selected.statut !== 'dismissed' && selected.statut !== 'actioned' && (
                    <button
                      onClick={() => updateStatus(selected.id, 'dismissed', noteInput || undefined)}
                      disabled={updating === selected.id}
                      className="px-4 py-2.5 text-sm bg-white/5 text-white/50 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} className="inline-block mr-1.5" />
                      Ignorer
                    </button>
                  )}
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant ligne de tableau interne ────────────────────────────────────────
function Row({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4 text-xs">
      <span className="text-white/40 flex-shrink-0">{label}</span>
      <span className={`text-right break-all ${highlight ? 'text-faso-gold' : mono ? 'text-white/50 font-mono' : 'text-white/70'}`}>
        {value}
      </span>
    </div>
  )
}
