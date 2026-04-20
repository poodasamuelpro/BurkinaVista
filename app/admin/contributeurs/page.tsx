/**
 * app/admin/contributeurs/page.tsx — Liste des contributeurs
 */
import { queryMany, queryOne } from '@/lib/db'
import Link from 'next/link'
import { Mail, Download } from 'lucide-react'
import type { Contributeur } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminContributeursPage() {
  const [contributeurs, countResult] = await Promise.all([
    queryMany<Contributeur>(
      'SELECT * FROM contributeurs ORDER BY created_at DESC'
    ),
    queryOne<{ total: number }>('SELECT COUNT(*) as total FROM contributeurs'),
  ])

  // Générer le CSV des emails
  const csvEmails = contributeurs.map((c) =>
    `${c.prenom} ${c.nom},${c.email},${c.tel || ''},${c.medias_count},${c.created_at}`
  ).join('\n')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-white">Contributeurs</h1>
          <p className="text-white/40 text-sm mt-1">
            {Number(countResult?.total || 0)} contributeur{Number(countResult?.total || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        {/* Export CSV */}
        <a
          href={`data:text/csv;charset=utf-8,Prénom,Nom,Email,Téléphone,Médias,Date\n${encodeURIComponent(csvEmails)}`}
          download="burkinavista-contributeurs.csv"
          className="btn-ghost text-sm py-2 px-4"
        >
          <Download size={16} /> Exporter CSV
        </a>
      </div>

      {/* Tableau */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Contributeur</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Email</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider hidden md:table-cell">Téléphone</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Médias</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider hidden sm:table-cell">Inscrit le</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {contributeurs.map((c) => (
              <tr key={c.id} className="hover:bg-white/2 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-faso-gold/10 flex items-center justify-center text-faso-gold text-sm font-bold flex-shrink-0">
                      {c.prenom?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{c.prenom} {c.nom}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm text-white/60 truncate max-w-[180px]">{c.email}</p>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <p className="text-sm text-white/40">{c.tel || '—'}</p>
                </td>
                <td className="p-4">
                  <span className="badge badge-gold text-xs">{c.medias_count}</span>
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <p className="text-sm text-white/40">
                    {new Date(c.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </td>
                <td className="p-4">
                  <a
                    href={`mailto:${c.email}`}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-faso-gold hover:bg-faso-gold/10 transition-all"
                    title={`Envoyer un email à ${c.prenom}`}
                  >
                    <Mail size={13} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contributeurs.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-white/30">Aucun contributeur pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  )
}
