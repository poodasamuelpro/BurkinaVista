'use client'
/**
 * app/admin/abonnes/page.tsx — Liste des abonnés newsletter
 */
import { useState, useEffect } from 'react'
import { Mail, Download, UserX, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Abonne {
  id: string
  email: string
  nom: string | null
  actif: boolean
  created_at: string
}

export default function AdminAbonnesPage() {
  const [abonnes, setAbonnes] = useState<Abonne[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/abonnes')
      .then((r) => r.json())
      .then((data) => {
        setAbonnes(data.abonnes || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const desabonner = async (id: string, email: string) => {
    if (!confirm(`Désabonner ${email} ?`)) return
    try {
      const res = await fetch('/api/admin/abonnes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, actif: false }),
      })
      if (!res.ok) throw new Error('Erreur')
      setAbonnes((prev) => prev.map((a) => a.id === id ? { ...a, actif: false } : a))
      toast.success(`${email} désabonné(e)`)
    } catch {
      toast.error('Erreur lors du désabonnement')
    }
  }

  const actifs = abonnes.filter((a) => a.actif)
  const inactifs = abonnes.filter((a) => !a.actif)

  const csvContent = abonnes.map((a) =>
    `${a.nom || ''},${a.email},${a.actif ? 'actif' : 'inactif'},${a.created_at}`
  ).join('\n')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-white">Abonnés newsletter</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-faso-green text-sm">{actifs.length} actifs</p>
            <p className="text-white/30 text-sm">{inactifs.length} inactifs</p>
          </div>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,Nom,Email,Statut,Date\n${encodeURIComponent(csvContent)}`}
          download="burkinavista-abonnes.csv"
          className="btn-ghost text-sm py-2 px-4"
        >
          <Download size={16} /> Exporter CSV
        </a>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-faso-green/10 flex items-center justify-center">
              <Users size={18} className="text-faso-green" />
            </div>
            <div>
              <p className="font-bold text-xl text-faso-green">{actifs.length}</p>
              <p className="text-xs text-white/40">Abonnés actifs</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
              <UserX size={18} className="text-white/40" />
            </div>
            <div>
              <p className="font-bold text-xl text-white/40">{inactifs.length}</p>
              <p className="text-xs text-white/40">Désabonnés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Email</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider hidden sm:table-cell">Nom</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Statut</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider hidden md:table-cell">Inscrit le</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {abonnes.map((a) => (
              <tr key={a.id} className="hover:bg-white/2 transition-colors">
                <td className="p-4">
                  <p className="text-sm text-white truncate max-w-[200px]">{a.email}</p>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <p className="text-sm text-white/50">{a.nom || '—'}</p>
                </td>
                <td className="p-4">
                  <span className={`badge text-xs ${a.actif ? 'badge-green' : 'badge-gray'}`}>
                    {a.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <p className="text-sm text-white/40">
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </td>
                <td className="p-4">
                  {a.actif && (
                    <button
                      onClick={() => desabonner(a.id, a.email)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-faso-red hover:bg-faso-red/10 transition-all"
                      title="Désabonner"
                    >
                      <UserX size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {abonnes.length === 0 && (
          <div className="p-16 text-center">
            <Mail size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30">Aucun abonné pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  )
}
