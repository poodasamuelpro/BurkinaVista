/**
 * app/admin/page.tsx — Dashboard admin principal
 * Stats : médias, contributeurs, abonnés, téléchargements, vues
 * Médias récents, derniers contributeurs, derniers abonnés
 */
import { queryOne, queryMany } from '@/lib/db'
import { Image, Video, Users, Download, Eye, Clock, TrendingUp, CheckCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Media, Contributeur, Abonne } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Stats globales
  const [
    statsMedias,
    statsContrib,
    statsAbonnes,
    recentMedias,
    recentContributeurs,
    recentAbonnes,
  ] = await Promise.all([
    // Comptes médias
    queryOne<{
      total: number
      pending: number
      photos: number
      videos: number
      downloads: number
      views: number
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'pending') as pending,
        COUNT(*) FILTER (WHERE type = 'photo' AND statut = 'approved') as photos,
        COUNT(*) FILTER (WHERE type = 'video' AND statut = 'approved') as videos,
        COALESCE(SUM(downloads), 0) as downloads,
        COALESCE(SUM(views), 0) as views
      FROM medias
    `),
    // Contributeurs
    queryOne<{ total: number }>('SELECT COUNT(*) as total FROM contributeurs'),
    // Abonnés actifs
    queryOne<{ total: number }>('SELECT COUNT(*) as total FROM abonnes WHERE actif = true'),
    // Médias récents
    queryMany<Media>(
      `SELECT * FROM medias ORDER BY created_at DESC LIMIT 8`
    ),
    // Derniers contributeurs
    queryMany<Contributeur>(
      `SELECT * FROM contributeurs ORDER BY created_at DESC LIMIT 5`
    ),
    // Derniers abonnés
    queryMany<Abonne>(
      `SELECT * FROM abonnes ORDER BY created_at DESC LIMIT 5`
    ),
  ])

  const pendingCount = Number(statsMedias?.pending || 0)

  const stats = [
    {
      label: 'Total médias',
      value: Number(statsMedias?.total || 0),
      icon: Image,
      color: 'text-faso-gold',
      bg: 'bg-faso-gold/10',
      href: '/admin/photos',
    },
    {
      label: 'Contributeurs',
      value: Number(statsContrib?.total || 0),
      icon: Users,
      color: 'text-faso-green',
      bg: 'bg-faso-green/10',
      href: '/admin/contributeurs',
    },
    {
      label: 'Abonnés newsletter',
      value: Number(statsAbonnes?.total || 0),
      icon: Mail,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      href: '/admin/abonnes',
    },
    {
      label: 'En attente',
      value: pendingCount,
      icon: Clock,
      color: 'text-faso-red',
      bg: 'bg-faso-red/10',
      urgent: true,
      href: '/admin/photos?statut=pending',
    },
    {
      label: 'Téléchargements',
      value: Number(statsMedias?.downloads || 0),
      icon: Download,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      label: 'Photos publiées',
      value: Number(statsMedias?.photos || 0),
      icon: CheckCircle,
      color: 'text-faso-green',
      bg: 'bg-faso-green/10',
    },
    {
      label: 'Vidéos publiées',
      value: Number(statsMedias?.videos || 0),
      icon: Video,
      color: 'text-faso-gold',
      bg: 'bg-faso-gold/10',
    },
    {
      label: 'Vues totales',
      value: Number(statsMedias?.views || 0),
      icon: Eye,
      color: 'text-white/60',
      bg: 'bg-white/5',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Dashboard BurkinaVista</h1>
        <div className="faso-divider w-24" />
      </div>

      {/* Alerte médias en attente */}
      {pendingCount > 0 && (
        <Link
          href="/admin/photos?statut=pending"
          className="block card p-4 border border-faso-red/30 bg-faso-red/5 hover:border-faso-red/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-faso-red/20 flex items-center justify-center">
              <Clock size={16} className="text-faso-red" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {pendingCount} média{pendingCount > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-white/40 text-xs">Cliquez pour modérer</p>
            </div>
            <span className="ml-auto badge badge-red">{pendingCount}</span>
          </div>
        </Link>
      )}

      {/* Grille de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, urgent, href }) => {
          const card = (
            <div key={label} className={`card p-5 ${urgent && value > 0 ? 'border-faso-red/30' : ''}`}>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className={`font-display text-2xl font-bold ${color} mb-0.5`}>
                {value.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          )
          return href ? (
            <Link key={label} href={href} className="hover:scale-[1.02] transition-transform">
              {card}
            </Link>
          ) : card
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Médias récents */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg text-white">Médias récents</h2>
            <Link href="/admin/photos" className="text-xs text-faso-gold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMedias.map((media) => (
              <div key={media.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                {/* Miniature */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-faso-dusk">
                  {media.cloudinary_url ? (
                    <img src={media.cloudinary_url} alt={media.titre} className="w-full h-full object-cover" />
                  ) : media.thumbnail_url ? (
                    <img src={media.thumbnail_url} alt={media.titre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={14} className="text-faso-gold" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{media.titre}</p>
                  <p className="text-xs text-white/30">
                    {media.contributeur_prenom} {media.contributeur_nom} · {media.categorie}
                  </p>
                </div>
                <span className={`badge text-xs flex-shrink-0 ${
                  media.statut === 'approved' ? 'badge-green' :
                  media.statut === 'pending' ? 'badge-gold' : 'badge-red'
                }`}>
                  {media.statut === 'approved' ? 'Publié' : media.statut === 'pending' ? 'En attente' : 'Refusé'}
                </span>
              </div>
            ))}
            {recentMedias.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">Aucun média</p>
            )}
          </div>
        </div>

        {/* Sidebar droite */}
        <div className="space-y-6">
          {/* Derniers contributeurs */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base text-white">Derniers contributeurs</h2>
              <Link href="/admin/contributeurs" className="text-xs text-faso-gold hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentContributeurs.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-faso-gold/10 flex items-center justify-center text-faso-gold font-bold text-sm flex-shrink-0">
                    {c.prenom?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.prenom} {c.nom}</p>
                    <p className="text-xs text-white/30">{c.medias_count} média{c.medias_count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
              {recentContributeurs.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">Aucun contributeur</p>
              )}
            </div>
          </div>

          {/* Derniers abonnés */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base text-white">Derniers abonnés</h2>
              <Link href="/admin/abonnes" className="text-xs text-faso-gold hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentAbonnes.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{a.email}</p>
                    <p className="text-xs text-white/30">
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {recentAbonnes.length === 0 && (
                <p className="text-white/30 text-sm text-center py-4">Aucun abonné</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
