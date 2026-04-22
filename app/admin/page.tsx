/**
 * app/admin/page.tsx — Dashboard admin principal
 * Stats : médias, contributeurs, abonnés, téléchargements, vues
 * Médias récents, derniers contributeurs, derniers abonnés
 * Toggles upload photos/vidéos (lecture admin_settings)
 *
 * AJOUT (2026-04-22) :
 *  - Boutons d'accès rapide aux médias par statut (Tous / Publiés / En attente / Refusés)
 *  - Cards Photos publiées et Vidéos publiées maintenant cliquables → /admin/photos?statut=approved
 */
import { queryOne, queryMany } from '@/lib/db'
import { Image, Video, Users, Download, Eye, Clock, CheckCircle, Mail, XCircle, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import type { Media, Contributeur, Abonne } from '@/types'
import UploadToggles from '@/components/admin/UploadToggles'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [
    statsMedias,
    statsContrib,
    statsAbonnes,
    recentMedias,
    recentContributeurs,
    recentAbonnes,
    uploadSettings,
  ] = await Promise.all([
    queryOne<{
      total: number
      pending: number
      photos: number
      videos: number
      downloads: number
      views: number
      rejected: number
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE statut = 'pending') as pending,
        COUNT(*) FILTER (WHERE statut = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE type = 'photo' AND statut = 'approved') as photos,
        COUNT(*) FILTER (WHERE type = 'video' AND statut = 'approved') as videos,
        COALESCE(SUM(downloads), 0) as downloads,
        COALESCE(SUM(views), 0) as views
      FROM medias
    `),
    queryOne<{ total: number }>('SELECT COUNT(*) as total FROM contributeurs'),
    queryOne<{ total: number }>('SELECT COUNT(*) as total FROM abonnes WHERE actif = true'),
    queryMany<Media>(`SELECT * FROM medias ORDER BY created_at DESC LIMIT 8`),
    queryMany<Contributeur>(`SELECT * FROM contributeurs ORDER BY created_at DESC LIMIT 5`),
    queryMany<Abonne>(`SELECT * FROM abonnes ORDER BY created_at DESC LIMIT 5`),
    queryMany<{ cle: string; valeur: string }>(
      "SELECT cle, valeur FROM admin_settings WHERE cle IN ('upload_photos_enabled', 'upload_videos_enabled')"
    ),
  ])

  const pendingCount = Number(statsMedias?.pending || 0)
  const rejectedCount = Number(statsMedias?.rejected || 0)

  const photosEnabled =
    uploadSettings.find((s) => s.cle === 'upload_photos_enabled')?.valeur === 'true'
  const videosEnabled =
    uploadSettings.find((s) => s.cle === 'upload_videos_enabled')?.valeur === 'true'

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
      href: '/admin/photos?statut=approved',
    },
    {
      label: 'Vidéos publiées',
      value: Number(statsMedias?.videos || 0),
      icon: Video,
      color: 'text-faso-gold',
      bg: 'bg-faso-gold/10',
      href: '/admin/photos?statut=approved',
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

      {/* ── Accès rapide médias ── */}
      <div className="card p-5">
        <h2 className="font-display text-base text-white mb-4 flex items-center gap-2">
          <Image size={16} className="text-faso-gold" />
          Gestion des médias
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/photos"
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-faso-gold/10 flex items-center justify-center group-hover:bg-faso-gold/20 transition-colors">
              <LayoutGrid size={17} className="text-faso-gold" />
            </div>
            <span className="text-xs text-white/60 group-hover:text-white transition-colors text-center">
              Tous les médias
            </span>
          </Link>

          <Link
            href="/admin/photos?statut=approved"
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-faso-green/10 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-faso-green/10 flex items-center justify-center group-hover:bg-faso-green/20 transition-colors">
              <CheckCircle size={17} className="text-faso-green" />
            </div>
            <span className="text-xs text-white/60 group-hover:text-faso-green transition-colors text-center">
              Publiés
            </span>
          </Link>

          <Link
            href="/admin/photos?statut=pending"
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-faso-gold/10 transition-all group relative"
          >
            <div className="w-9 h-9 rounded-xl bg-faso-gold/10 flex items-center justify-center group-hover:bg-faso-gold/20 transition-colors">
              <Clock size={17} className="text-faso-gold" />
            </div>
            <span className="text-xs text-white/60 group-hover:text-faso-gold transition-colors text-center">
              En attente
            </span>
            {pendingCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-faso-red text-white text-[9px] flex items-center justify-center font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/admin/photos?statut=rejected"
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-faso-red/10 transition-all group relative"
          >
            <div className="w-9 h-9 rounded-xl bg-faso-red/10 flex items-center justify-center group-hover:bg-faso-red/20 transition-colors">
              <XCircle size={17} className="text-faso-red" />
            </div>
            <span className="text-xs text-white/60 group-hover:text-faso-red transition-colors text-center">
              Refusés
            </span>
            {rejectedCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-faso-red/60 text-white text-[9px] flex items-center justify-center font-bold">
                {rejectedCount > 9 ? '9+' : rejectedCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ── Toggles Upload ── */}
      <UploadToggles
        initialPhotosEnabled={photosEnabled}
        initialVideosEnabled={videosEnabled}
      />

      {/* Grille de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, urgent, href }) => {
          const card = (
            <div
              key={label}
              className={`card p-5 ${urgent && value > 0 ? 'border-faso-red/30' : ''}`}
            >
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
          ) : (
            <div key={label}>{card}</div>
          )
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
              <div
                key={media.id}
                className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-faso-dusk">
                  {media.type === 'photo' && media.cloudinary_url ? (
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
                <span
                  className={`badge text-xs flex-shrink-0 ${
                    media.statut === 'approved'
                      ? 'badge-green'
                      : media.statut === 'pending'
                      ? 'badge-gold'
                      : 'badge-red'
                  }`}
                >
                  {media.statut === 'approved'
                    ? 'Publié'
                    : media.statut === 'pending'
                    ? 'En attente'
                    : 'Refusé'}
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
                    <p className="text-sm text-white font-medium truncate">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="text-xs text-white/30">
                      {c.medias_count} média{c.medias_count !== 1 ? 's' : ''}
                    </p>
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
