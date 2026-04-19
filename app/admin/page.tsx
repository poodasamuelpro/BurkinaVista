import { createServerSupabaseClient } from '@/lib/supabase'
import { Image, Video, Users, Download, Eye, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalMedias },
    { count: totalUsers },
    { count: pendingCount },
    { count: photosCount },
    { count: videosCount },
    { data: recentMedias },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('medias').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('medias').select('*', { count: 'exact', head: true }).eq('statut', 'pending'),
    supabase.from('medias').select('*', { count: 'exact', head: true }).eq('type', 'photo').eq('statut', 'approved'),
    supabase.from('medias').select('*', { count: 'exact', head: true }).eq('type', 'video').eq('statut', 'approved'),
    supabase.from('medias').select('*, auteur:profiles(nom)').order('created_at', { ascending: false }).limit(8),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total médias', value: totalMedias || 0, icon: Image, color: 'text-faso-gold', bg: 'bg-faso-gold/10' },
    { label: 'Contributeurs', value: totalUsers || 0, icon: Users, color: 'text-faso-green', bg: 'bg-faso-green/10' },
    { label: 'En attente', value: pendingCount || 0, icon: Clock, color: 'text-faso-red', bg: 'bg-faso-red/10', urgent: true },
    { label: 'Photos publiées', value: photosCount || 0, icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Dashboard Admin</h1>
        <div className="faso-divider w-24" />
      </div>

      {/* Alert pending */}
      {(pendingCount || 0) > 0 && (
        <Link href="/admin/photos?statut=pending" className="block card p-4 border border-faso-red/30 bg-faso-red/5 hover:border-faso-red/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-faso-red/20 flex items-center justify-center">
              <Clock size={16} className="text-faso-red" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {pendingCount} média{(pendingCount || 0) > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-white/40 text-xs">Cliquez pour modérer</p>
            </div>
            <span className="ml-auto badge badge-red">{pendingCount}</span>
          </div>
        </Link>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, urgent }) => (
          <div key={label} className={`card p-6 ${urgent && (value > 0) ? 'border-faso-red/30' : ''}`}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`font-display text-3xl font-bold ${color} mb-1`}>
              {value.toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-white/40">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Médias récents */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg text-white">Médias récents</h2>
            <Link href="/admin/photos" className="text-xs text-faso-gold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {(recentMedias || []).map((media: any) => (
              <div key={media.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-faso-dusk">
                  {media.cloudinary_url ? (
                    <img src={media.cloudinary_url} alt={media.titre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={16} className="text-faso-gold" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{media.titre}</p>
                  <p className="text-xs text-white/30">{media.auteur?.nom} · {media.categorie}</p>
                </div>
                <span className={`badge text-xs ${
                  media.statut === 'approved' ? 'badge-green' :
                  media.statut === 'pending' ? 'badge-gold' : 'badge-red'
                }`}>
                  {media.statut === 'approved' ? 'Publié' : media.statut === 'pending' ? 'En attente' : 'Refusé'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg text-white">Nouveaux membres</h2>
            <Link href="/admin/users" className="text-xs text-faso-gold hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-4">
            {(recentUsers || []).map((user: any) => (
              <div key={user.id} className="flex items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nom} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-faso-gold/10 flex items-center justify-center text-faso-gold font-bold text-sm">
                    {user.nom?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user.nom}</p>
                  <p className="text-xs text-white/30">{user.photos_count} contribution{user.photos_count !== 1 ? 's' : ''}</p>
                </div>
                <span className={`badge text-xs ${user.role === 'admin' ? 'badge-red' : 'badge-gray'}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
