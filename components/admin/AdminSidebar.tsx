'use client'
/**
 * components/admin/AdminSidebar.tsx — Barre latérale admin responsive
 * Support mobile (menu burger) + desktop (fixe)
 * Sans Supabase — déconnexion via /api/admin-logout
 *
 * AJOUT (2026-04-22) :
 *  - Sous-menu Médias avec accès rapide : Tous / Publiés / En attente / Refusés
 *
 * FIX (2026-05-06) :
 *  - Ajout lien /admin/reports (Signalements) — était créé mais absent de la nav
 *  - Accès admin uniquement (déjà protégé par middleware.ts)
 *
 * FIX (2026-05-06) — Scroll mobile :
 *  - Le aside mobile avait overflow caché → impossible de scroller la nav
 *  - Ajout overflow-y-auto + flex flex-col sur le aside mobile
 *  - Le contenu interne prend toute la hauteur avec flex-1
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Image, Users, FolderOpen, LogOut, Mail,
  Newspaper, Menu, X, CheckCircle, Clock, XCircle, LayoutGrid,
  Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import FasoLogo from '@/components/ui/FasoLogo'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/contributeurs', label: 'Contributeurs', icon: Users, exact: false },
  { href: '/admin/abonnes', label: 'Abonnés', icon: Mail, exact: false },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper, exact: false },
  { href: '/admin/categories', label: 'Catégories', icon: FolderOpen, exact: false },
]

const mediaSubLinks = [
  { href: '/admin/photos', label: 'Tous les médias', icon: LayoutGrid, exact: true },
  { href: '/admin/photos?statut=approved', label: 'Publiés', icon: CheckCircle, color: 'text-faso-green' },
  { href: '/admin/photos?statut=pending', label: 'En attente', icon: Clock, color: 'text-faso-gold' },
  { href: '/admin/photos?statut=rejected', label: 'Refusés', icon: XCircle, color: 'text-faso-red' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingReports, setPendingReports] = useState(0)

  const isOnPhotos = pathname.startsWith('/admin/photos')
  const isOnReports = pathname.startsWith('/admin/reports')

  useEffect(() => {
    fetch('/api/admin/reports?statut=pending')
      .then((r) => r.json())
      .then((data) => {
        if (data?.reports) setPendingReports(data.reports.length)
      })
      .catch(() => {})
  }, [pathname])

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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
      <div className="px-4 mb-8 flex-shrink-0">
        <FasoLogo size={28} showName={true} />
        <p className="text-xs text-white/20 uppercase tracking-wider mt-2 pl-1">Administration</p>
        <div className="faso-divider mt-3" />
      </div>

      {/* Navigation — flex-1 pour prendre l'espace dispo */}
      <nav className="flex-1 space-y-1 min-h-0">
        {/* Dashboard */}
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className={`admin-sidebar-link ${pathname === '/admin' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {/* Médias — avec sous-menu permanent */}
        <div>
          <Link
            href="/admin/photos"
            onClick={() => setMobileOpen(false)}
            className={`admin-sidebar-link ${isOnPhotos ? 'active' : ''}`}
          >
            <Image size={18} />
            Médias
          </Link>

          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/5 pl-3">
            {mediaSubLinks.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors
                  ${color || 'text-white/50'} hover:text-white hover:bg-white/5`}
              >
                <Icon size={13} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Signalements — avec badge si pending */}
        <Link
          href="/admin/reports"
          onClick={() => setMobileOpen(false)}
          className={`admin-sidebar-link ${isOnReports ? 'active' : ''}`}
        >
          <Flag size={18} />
          <span className="flex-1">Signalements</span>
          {pendingReports > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-faso-red text-white text-[10px] font-bold">
              {pendingReports > 99 ? '99+' : pendingReports}
            </span>
          )}
        </Link>

        {/* Autres liens */}
        {links.slice(1).map(({ href, label, icon: Icon, exact }) => {
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
      <div className="space-y-1 pt-4 border-t border-white/5 flex-shrink-0">
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
      {/* ── Sidebar desktop (fixe + scrollable) ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-faso-dusk border-r border-white/5 p-4 flex-col z-40 pt-6 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── Bouton burger mobile ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-faso-dusk border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Overlay mobile ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          {/*
            FIX SCROLL MOBILE :
            - flex flex-col        → permet au contenu interne d'utiliser flex-1
            - overflow-y-auto      → active le scroll vertical sur le aside lui-même
            - h-full               → prend toute la hauteur de l'écran
          */}
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-faso-dusk border-r border-white/5 p-4 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white z-10"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
            <div className="pt-2 flex flex-col flex-1">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
