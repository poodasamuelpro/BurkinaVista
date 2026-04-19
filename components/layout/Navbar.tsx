'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { User as UserType } from '@/types'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<UserType | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(profile)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) setUser(null)
      else getUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setUserMenuOpen(false)
  }

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/categories/architecture-urbanisme', label: 'Explorer' },
    { href: '/upload', label: 'Contribuer' },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-faso-night/95 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div className="h-1/3 bg-faso-red" />
                  <div className="h-1/3 bg-faso-gold" />
                  <div className="h-1/3 bg-faso-green" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 faso-star bg-white opacity-90" />
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold text-white group-hover:text-faso-gold transition-colors">
                  FasoStock
                </span>
                <span className="text-[10px] text-white/40 tracking-widest uppercase">Burkina Faso</span>
              </div>
            </Link>

            {/* Nav links desktop */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === link.href
                      ? 'text-faso-gold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search size={18} />
              </button>

              {/* Upload CTA */}
              <Link
                href="/upload"
                className="hidden md:flex btn-gold text-sm py-2 px-4"
              >
                <Upload size={16} />
                Contribuer
              </Link>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-faso-gold/30 hover:border-faso-gold transition-colors"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-faso-gold/20 flex items-center justify-center text-faso-gold font-bold text-sm">
                        {user.nom?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-52 card border border-white/10 py-2 animate-slide-down">
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="font-medium text-sm">{user.nom}</p>
                        <p className="text-xs text-white/40">{user.role}</p>
                      </div>
                      <Link
                        href={`/profil/${user.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} /> Mon profil
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-faso-gold hover:bg-faso-gold/5"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={15} /> Dashboard Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-faso-red hover:bg-faso-red/5"
                      >
                        <LogOut size={15} /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="btn-ghost text-sm py-2 px-4"
                >
                  Connexion
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-faso-dusk border-t border-white/5 animate-slide-down">
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    pathname === link.href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : 'text-white/70'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="faso-divider my-2" />
              <Link href="/upload" onClick={() => setMenuOpen(false)} className="btn-gold justify-center">
                <Upload size={16} /> Contribuer
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="w-full max-w-2xl animate-scale-in">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des photos, vidéos, lieux..."
                className="w-full pl-14 pr-6 py-5 rounded-2xl text-lg input-field border-faso-gold/30"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Ouagadougou', 'FESPACO', 'Marché', 'Architecture', 'Nature'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setSearchQuery(tag); router.push(`/?q=${tag}`); setSearchOpen(false) }}
                  className="badge badge-gray hover:badge-gold cursor-pointer transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
