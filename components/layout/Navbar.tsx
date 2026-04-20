'use client'
/**
 * components/layout/Navbar.tsx — Navigation principale
 * Sans authentification utilisateur (Supabase supprimé)
 * Garde : Logo, liens, bouton Contribuer, recherche, menu mobile
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, Menu, X } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/categories', label: 'Explorer' },
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
            <Link href="/" className="flex items-center group">
              <FasoLogo
                size={36}
                showName={true}
                className="group-hover:opacity-90 transition-opacity"
              />
            </Link>

            {/* Liens desktop */}
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
              {/* Recherche */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search size={18} />
              </button>

              {/* Bouton Contribuer desktop */}
              <Link
                href="/upload"
                className="hidden md:flex btn-gold text-sm py-2 px-4"
              >
                <Upload size={16} />
                Contribuer
              </Link>

              {/* Burger mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden bg-faso-dusk border-t border-white/5 animate-slide-down">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="faso-divider my-2" />
              <Link
                href="/upload"
                onClick={() => setMenuOpen(false)}
                className="btn-gold justify-center py-3"
              >
                <Upload size={16} /> Contribuer
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Modal de recherche */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="w-full max-w-2xl animate-scale-in">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40"
                size={20}
              />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des photos, vidéos, lieux..."
                className="w-full pl-14 pr-12 py-5 rounded-2xl text-lg input-field border-faso-gold/30"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </form>
            {/* Suggestions rapides */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['Ouagadougou', 'FESPACO', 'Marché', 'Architecture', 'Nature', 'Bobo-Dioulasso'].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      router.push(`/?q=${tag}`)
                      setSearchOpen(false)
                    }}
                    className="badge badge-gray hover:badge-gold cursor-pointer transition-all"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
