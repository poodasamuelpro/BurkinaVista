'use client'
/**
 * components/admin/AdminSidebar.tsx — Barre latérale admin responsive
 * Support mobile (menu burger) + desktop (fixe)
 * Sans Supabase — déconnexion via /api/admin-logout
 */
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Image, Users, FolderOpen, LogOut, Mail,
  Newspaper, Menu, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import FasoLogo from '@/components/ui/FasoLogo'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/photos', label: 'Médias', icon: Image, exact: false },
  { href: '/admin/contributeurs', label: 'Contributeurs', icon: Users, exact: false },
  { href: '/admin/abonnes', label: 'Abonnés', icon: Mail, exact: false },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper, exact: false },
  { href: '/admin/categories', label: 'Catégories', icon: FolderOpen, exact: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-logout', { method: 'POST' })
      toast.success('Déconnecté')
      router.push('/admin/login')
      router.refresh()
    } catch {
      toast.error('Erreur déconnexion')
    }
  }

  const SidebarContent = () => (
    <>
      {/* Logo admin */}
      <div className="px-4 mb-8">
        <FasoLogo size={28} showName={true} />
        <p className="text-xs text-white/20 uppercase tracking-wider mt-2 pl-1">Administration</p>
        <div className="faso-divider mt-3" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer sidebar */}
      <div className="space-y-1 pt-4 border-t border-white/5">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="admin-sidebar-link text-sm text-white/40"
        >
          ← Retour au site
        </Link>
        <button
          onClick={handleLogout}
          className="admin-sidebar-link w-full text-left text-faso-red/70 hover:text-faso-red"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar desktop (fixe) */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-faso-dusk border-r border-white/5 p-4 flex-col z-40 pt-6">
        <SidebarContent />
      </aside>

      {/* Bouton burger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-faso-dusk border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-faso-dusk border-r border-white/5 p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fermer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="pt-2">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
