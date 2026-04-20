'use client'
/**
 * app/admin/newsletter/page.tsx — Gestion newsletter
 * Envoi automatique (toggle), historique, envoi manuel
 */
import { useState, useEffect } from 'react'
import { Send, Clock, ToggleLeft, ToggleRight, Calendar, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface NewsletterLog {
  id: string
  sujet: string
  nb_destinataires: number
  nb_medias: number
  statut: string
  envoye_le: string
}

interface Settings {
  newsletter_auto: boolean
  newsletter_jour: string
}

export default function AdminNewsletterPage() {
  const [settings, setSettings] = useState<Settings>({
    newsletter_auto: true,
    newsletter_jour: 'lundi',
  })
  const [logs, setLogs] = useState<NewsletterLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [nbAbonnes, setNbAbonnes] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/newsletter').then((r) => r.json()),
      fetch('/api/admin/abonnes').then((r) => r.json()),
    ]).then(([newsletterData, abonnesData]) => {
      if (newsletterData.settings) setSettings(newsletterData.settings)
      if (newsletterData.logs) setLogs(newsletterData.logs)
      if (abonnesData.abonnes) {
        setNbAbonnes(abonnesData.abonnes.filter((a: { actif: boolean }) => a.actif).length)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggleAuto = async () => {
    const newValue = !settings.newsletter_auto
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter_auto: newValue }),
      })
      if (!res.ok) throw new Error()
      setSettings((prev) => ({ ...prev, newsletter_auto: newValue }))
      toast.success(newValue ? '✅ Envoi automatique activé' : '⏸️ Envoi automatique désactivé')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const sendNow = async () => {
    if (!confirm(`Envoyer la newsletter à ${nbAbonnes} abonné(s) actifs maintenant ?`)) return
    setSending(true)
    try {
      const body = dateDebut && dateFin ? { dateDebut, dateFin } : {}
      const res = await fetch('/api/cron/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'envoi')
        return
      }
      toast.success(data.message)
      // Recharger les logs
      const logsRes = await fetch('/api/admin/newsletter')
      const logsData = await logsRes.json()
      if (logsData.logs) setLogs(logsData.logs)
    } catch {
      toast.error('Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  // Calculer le prochain lundi
  const getNextMonday = () => {
    const today = new Date()
    const day = today.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    return nextMonday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-white">Newsletter</h1>
        <p className="text-white/40 text-sm mt-1">
          {nbAbonnes} abonné{nbAbonnes > 1 ? 's' : ''} actif{nbAbonnes > 1 ? 's' : ''}
        </p>
      </div>

      {/* Envoi automatique */}
      <div className="card p-6">
        <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-faso-gold" />
          Envoi automatique
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">
              {settings.newsletter_auto
                ? `Activé — Prochain envoi : lundi ${getNextMonday()} à 8h00`
                : 'Désactivé — Aucun envoi automatique planifié'}
            </p>
            <p className="text-white/30 text-xs mt-1">
              Condition : au moins 1 nouveau média depuis le dernier lundi
            </p>
          </div>
          <button
            onClick={toggleAuto}
            className="flex items-center gap-2 text-sm font-medium transition-all"
          >
            {settings.newsletter_auto ? (
              <ToggleRight size={40} className="text-faso-green" />
            ) : (
              <ToggleLeft size={40} className="text-white/20" />
            )}
          </button>
        </div>
      </div>

      {/* Envoi manuel */}
      <div className="card p-6">
        <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
          <Send size={18} className="text-faso-gold" />
          Envoyer maintenant
        </h2>
        <p className="text-white/50 text-sm mb-4">
          Envoie les médias approuvés de la semaine (ou d'une période personnalisée) à tous les abonnés actifs.
        </p>

        {/* Période personnalisée optionnelle */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Date début (optionnel)
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Date fin (optionnel)
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>

        <button
          onClick={sendNow}
          disabled={sending || nbAbonnes === 0}
          className="btn-primary py-3 px-6 disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send size={18} />
              Envoyer à {nbAbonnes} abonné{nbAbonnes > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>

      {/* Historique */}
      <div className="card p-6">
        <h2 className="font-display text-lg text-white mb-4">Historique des envois</h2>
        {logs.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Aucune newsletter envoyée</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white">{log.sujet}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(log.envoye_le).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-white/40">{log.nb_destinataires} destinataires</span>
                  <span className="text-xs text-white/40">{log.nb_medias} médias</span>
                  <span className={`badge text-xs ${log.statut === 'sent' ? 'badge-green' : 'badge-red'}`}>
                    {log.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
