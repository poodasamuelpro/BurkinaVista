/**
 * app/admin/reports/page.tsx — Dashboard admin des signalements
 *
 * AJOUT (Audit 2026-05-01) — Item #14
 *
 * FIX (2026-05-06) — Alignement statuts UI ↔ API ↔ SQL :
 *  - 'review'   → 'reviewed'  (statut SQL réel)
 *  - 'resolved' → 'actioned'  (statut SQL réel)
 *  - Filtres et counts mis à jour en conséquence
 *  - "Voir le média" ouvre maintenant une modale interne
 *    avec motif, message, email, IP au lieu d'ouvrir la page publique
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, AlertTriangle, Eye, CheckCircle, XCircle, Clock,
  RefreshCw, X, ExternalLink, Flag, Mail, Globe,
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
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  copyright:     'Atteinte au droit d\'auteur',
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
  illegal:       'text-red-500 bg-red-500/10',
  other:         'text-white/40 bg-white/5',
}

/**
 * STATUTS ALIGNÉS SUR L'API ET LA DB :
 * pending | reviewed | actioned | dismissed
 * (supprimés : 'review' et 'resolved' qui causaient l'erreur "Statut invalide")
 */
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10' },
  reviewed:  { label: 'En cours',   color: 'text-blue-400 bg-blue-400/10' },
  actioned:  { label: 'Résolu',     color: 'text-green-400 bg-green-400/10' },
  dismissed: { label: 'Ignoré',     color: 'text-white/40 bg-white/5' },
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://burkina-vista.vercel.app'

export default function AdminReportsPage() {
  const [reports, setReports]       = useState<ReportRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<string>('all')
  const [selected, setSelected]     = useState<ReportRow | null>(null)
  const [noteInput, setNoteInput]   = useState<string>('')
  const [updating, setUpdating]     = useState<string | null>(null)

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

  // Filtered list selon l'onglet actif
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

              return (
                <div
                  key={r.id}
                  className="card p-5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Top row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        <Clock size={11} className="inline-block mr-1" />
                        {status.label}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${reasonColor}`}>
                        <Flag size={10} className="inline-block mr-1" />
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <span className="text-xs text-white/30">
                        {new Date(r.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Voir le média — ouvre la modale interne */}
                    <button
                      onClick={() => openDetail(r)}
                      className="text-xs text-faso-gold hover:underline inline-flex items-center gap-1"
                    >
                      <Eye size={12} /> Voir le détail
                    </button>
                  </div>

                  {/* Titre média */}
                  <h3 className="font-medium text-white mb-2">
                    {r.media_titre || `Média ${r.media_id.slice(0, 8)}…`}
                    {r.media_type && (
                      <span className="ml-2 text-xs text-white/40">({r.media_type})</span>
                    )}
                  </h3>

                  {/* Message signalant (aperçu) */}
                  {r.message && (
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <p className="text-sm text-white/70 whitespace-pre-wrap break-words line-clamp-2">
                        {r.message}
                      </p>
                    </div>
                  )}

                  {/* Infos signalant */}
                  <div className="flex flex-wrap gap-3 text-xs text-white/40 mb-4">
                    {r.reporter_email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={11} /> {r.reporter_email}
                      </span>
                    )}
                    {r.reporter_ip && (
                      <span className="inline-flex items-center gap-1">
                        <Globe size={11} /> {r.reporter_ip}
                      </span>
                    )}
                  </div>

                  {/* Note admin si existante */}
                  {r.admin_note && (
                    <div className="bg-faso-gold/5 border border-faso-gold/20 rounded-lg p-3 mb-4">
                      <p className="text-xs text-faso-gold mb-1 uppercase tracking-wider">Note admin</p>
                      <p className="text-sm text-white/70">{r.admin_note}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {r.statut !== 'reviewed' && r.statut !== 'actioned' && r.statut !== 'dismissed' && (
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
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modale détail + résolution ───────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-faso-dusk border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {selected.media_titre || `Média ${selected.media_id.slice(0, 8)}…`}
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                  REASON_COLORS[selected.reason] || 'text-white/40 bg-white/5'
                }`}>
                  {REASON_LABELS[selected.reason] || selected.reason}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lien vers la page publique */}
            {selected.media_slug && (
              <a
                href={`${APP_URL}/photos/${selected.media_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-faso-gold hover:underline mb-5"
              >
                <ExternalLink size={12} />
                Voir le média sur le site
              </a>
            )}

            {/* Infos signalant */}
            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Date</span>
                <span className="text-white/70">{new Date(selected.created_at).toLocaleString('fr-FR')}</span>
              </div>
              {selected.reporter_email && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Email signalant</span>
                  <span className="text-faso-gold">{selected.reporter_email}</span>
                </div>
              )}
              {selected.reporter_ip && (
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">IP</span>
                  <span className="text-white/50 font-mono">{selected.reporter_ip}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Statut actuel</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  (STATUS_LABELS[selected.statut] || STATUS_LABELS.pending).color
                }`}>
                  {(STATUS_LABELS[selected.statut] || STATUS_LABELS.pending).label}
                </span>
              </div>
            </div>

            {/* Message du signalant */}
            {selected.message && (
              <div className="mb-4">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Message du signalant</p>
                <div className="bg-white/5 rounded-xl p-4 border-l-2 border-faso-gold/40">
                  <p className="text-sm text-white/80 whitespace-pre-wrap break-words leading-relaxed">
                    {selected.message}
                  </p>
                </div>
              </div>
            )}

            {/* Note admin */}
            <div className="mb-5">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
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

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-2">
              {selected.statut !== 'reviewed' && selected.statut !== 'actioned' && selected.statut !== 'dismissed' && (
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
          </div>
        </div>
      )}
    </div>
  )
}
