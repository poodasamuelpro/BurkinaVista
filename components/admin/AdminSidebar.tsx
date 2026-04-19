'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Image, Users, FolderOpen, Settings, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/photos', label: 'Médias', icon: Image },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/categories', label: 'Catégories', icon: FolderOpen },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-faso-dusk border-r border-white/5 p-4 flex flex-col">
      {/* Logo admin */}
      <div className="mb-8 px-4">
        <p className="text-xs text-white/20 uppercase tracking-wider mb-1">Administration</p>
        <div className="faso-divider" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 pt-4 border-t border-white/5">
        <Link href="/" className="admin-sidebar-link text-sm">
          ← Retour au site
        </Link>
        <button onClick={handleLogout} className="admin-sidebar-link w-full text-left text-faso-red/70 hover:text-faso-red">
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
