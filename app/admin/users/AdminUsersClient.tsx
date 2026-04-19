'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Shield, User, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminUsersClient({ users: initialUsers }: { users: any[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`Rôle mis à jour : ${newRole}`)
    }
  }

  const filtered = users.filter((u) =>
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-white">Utilisateurs ({users.length})</h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="input-field pl-9 py-2 text-sm w-64"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Utilisateur</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Contributions</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Inscrit le</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Rôle</th>
              <th className="text-left p-4 text-xs text-white/30 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-white/2 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.nom} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-faso-gold/10 flex items-center justify-center text-faso-gold text-sm font-bold">
                        {user.nom?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white font-medium">{user.nom}</p>
                      <p className="text-xs text-white/30">{user.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-white/60">{user.photos_count}</td>
                <td className="p-4 text-sm text-white/40">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="p-4">
                  <span className={`badge text-xs ${user.role === 'admin' ? 'badge-red' : 'badge-gray'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-faso-gold transition-colors"
                  >
                    {user.role === 'admin' ? <User size={13} /> : <Shield size={13} />}
                    {user.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
