/**
 * app/admin/reports/page.tsx — Dashboard admin des signalements
 *
 * AJOUT (Audit 2026-05-01) — Item #14 :
 *  Page protégée par le middleware (/admin/* hors /admin/login). Liste tous les
 *  signalements remontés via le bouton "Signaler" sur les pages détail.
 *  L'admin peut changer le statut (review / resolved / dismissed) et ajouter
 *  une note interne. Les signalements sont triés par date décroissante.
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, AlertTriangle, Eye, CheckCircle, XCircle, Clock, RefreshCw,
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
  updated_at: string
  media_titre: string | null
  media_slug: string | null
  media_type: string | null
}

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  copyright: 'Atteinte au droit d\u2019auteur',
  incorrect_info: 'Informations erronées',
  spam: 'Spam / publicité',
  illegal: 'Contenu illégal',
  other: 'Autre',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10' },
  review: { label: 'En cours', color: 'text-blue-400 bg-blue-400/10' },
  resolved: { label: 'Résolu', color: 'text-green-400 bg-green-400/10' },
  dismissed: { label: 'Ignoré', color: 'text-white/40 bg-white/5' },
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/admin/reports'
        : `/api/admin/reports?statut=${encodeURIComponent(filter)}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Erreur chargement signalements')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error(err)
      toast.error('Erreur chargement signalements')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadReports() }, [loadReports])

  const updateStatus = async (id: string, statut: string, admin_note?: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut, admin_note }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Erreur mise à jour')
        return
      }
      toast.success('Statut mis à jour')
      loadReports()
    } catch (err) {
      console.error(err)
      toast.error('Erreur réseau')
    }
  }

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.statut === 'pending').length,
    review: reports.filter((r) => r.statut === 'review').length,
    resolved: reports.filter((r) => r.statut === 'resolved').length,
    dismissed: reports.filter((r) => r.statut === 'dismissed').length,
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm mb-6 text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={16} /> Retour au dashboard
        </Link>

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
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'En attente' },
            { key: 'review', label: 'En cours' },
            { key: 'resolved', label: 'Résolus' },
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

        {loading ? (
          <div className="text-center py-12 text-white/40">Chargement…</div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle size={40} className="text-faso-green mx-auto mb-4" />
            <p className="text-white/60">Aucun signalement à afficher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const status = STATUS_LABELS[r.statut] || STATUS_LABELS.pending
              return (
                <div
                  key={r.id}
                  className="card p-5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        <Clock size={11} className="inline-block mr-1" />
                        {status.label}
                      </span>
                      <span className="text-xs text-faso-gold bg-faso-gold/10 px-2.5 py-1 rounded-md">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(r.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {r.media_slug && (
                      <Link
                        href={`/photos/${r.media_slug}`}
                        target="_blank"
                        className="text-xs text-faso-gold hover:underline inline-flex items-center gap-1"
                      >
                        <Eye size={12} /> Voir le média
                      </Link>
                    )}
                  </div>

                  <h3 className="font-medium text-white mb-2">
                    {r.media_titre || `Média ${r.media_id.slice(0, 8)}…`}
                    {r.media_type && (
                      <span className="ml-2 text-xs text-white/40">({r.media_type})</span>
                    )}
                  </h3>

                  {r.message && (
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <p className="text-sm text-white/70 whitespace-pre-wrap break-words">
                        {r.message}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-white/40 mb-3 space-x-3">
                    {r.reporter_email && <span>Email : {r.reporter_email}</span>}
                    {r.reporter_ip && <span>IP : {r.reporter_ip}</span>}
                  </div>

                  {r.admin_note && (
                    <div className="bg-faso-gold/5 border border-faso-gold/20 rounded-lg p-3 mb-3">
                      <p className="text-xs text-faso-gold mb-1 uppercase tracking-wider">Note admin</p>
                      <p className="text-sm text-white/70">{r.admin_note}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {r.statut !== 'review' && (
                      <button
                        onClick={() => updateStatus(r.id, 'review')}
                        className="px-3 py-1.5 text-xs bg-blue-400/10 text-blue-400 rounded-md hover:bg-blue-400/20 transition-colors"
                      >
                        Prendre en charge
                      </button>
                    )}
                    {r.statut !== 'resolved' && (
                      <button
                        onClick={() => {
                          const note = window.prompt('Note interne (optionnel) :', r.admin_note || '')
                          if (note === null) return
                          updateStatus(r.id, 'resolved', note)
                        }}
                        className="px-3 py-1.5 text-xs bg-green-400/10 text-green-400 rounded-md hover:bg-green-400/20 transition-colors"
                      >
                        <CheckCircle size={11} className="inline-block mr-1" />
                        Résolu
                      </button>
                    )}
                    {r.statut !== 'dismissed' && (
                      <button
                        onClick={() => updateStatus(r.id, 'dismissed')}
                        className="px-3 py-1.5 text-xs bg-white/5 text-white/50 rounded-md hover:bg-white/10 transition-colors"
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
    </div>
  )
}
