'use client'
/**
 * components/layout/Navbar.tsx
 * Navigation principale BurkinaVista — responsive (mobile / tablet / desktop)
 * 
 * LOGIQUE :
 * - Desktop (md+)  : Logo | Liens nav | Actions (Recherche, Thème, Contribuer)
 * - Tablette (sm)  : Logo | Actions (Recherche, Thème, Contribuer, Burger)
 * - Mobile (<sm)   : Logo | Actions (Recherche, Thème, Contribuer réduit, Burger)
 *
 * Menu burger (mobile/tablette) :
 *   - Accueil, Explorer  ← déjà dans la barre donc on les garde (liens principaux)
 *   - À propos, Guide, Contact  ← liens secondaires
 *   - Toggle thème  ← pratique dans le menu
 *   ❌ PAS de bouton Contribuer en double (déjà dans la barre)
 *   ❌ PAS de switch langue (géré par l'icône flottante)
 *
 * TRADUCTION : gérée par FloatingLangSwitcher (composant flottant bas-gauche)
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Upload, Menu, X, BookOpen, Info, Sun, Moon, MessageSquare } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from '@/context/LocaleContext'
import { useTranslations } from 'next-intl'

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname  = usePathname()
  const router    = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { locale } = useLocale()
  const t = useTranslations('nav')

  /* Scroll effect */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* Fermer les overlays à chaque changement de page */
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  /* Recherche */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const isLight = theme === 'light'

  /* Liens principaux (desktop centre + burger) */
  const primaryLinks = [
    { href: '/',           label: t('home') },
    { href: '/categories', label: t('explore') },
  ]

  /* Liens secondaires — uniquement dans le burger */
  const secondaryLinks = [
    { href: '/about',   label: t('about'),   Icon: Info },
    { href: '/guide',   label: t('guide'),   Icon: BookOpen },
    { href: '/contact', label: t('contact'), Icon: MessageSquare },
  ]

  const quickSearches = t.raw('quick_searches') as string[]

  /* Classes conditionnelles navbar */
  const navBg = scrolled
    ? isLight
      ? 'bg-white/95 backdrop-blur-xl border-b border-black/8 shadow-md'
      : 'bg-faso-night/95 backdrop-blur-xl border-b border-white/5 shadow-2xl'
    : 'bg-transparent'

  /* Couleurs des liens */
  const linkActive   = 'text-faso-gold'
  const linkInactive = isLight
    ? 'text-[#1A0F05]/70 hover:text-[#1A0F05]'
    : 'text-white/70 hover:text-white'

  const iconBtn = isLight
    ? 'text-[#1A0F05]/60 hover:text-[#1A0F05] hover:bg-black/5'
    : 'text-white/60 hover:text-white hover:bg-white/5'

  return (
    <>
      {/* ═══════════════════════════════════════════════
          BARRE PRINCIPALE
      ═══════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <FasoLogo
                size={22}
                showName={true}
                className="group-hover:opacity-90 transition-opacity sm:scale-125 md:scale-150 origin-left"
              />
            </Link>

            {/* ── Liens desktop (md+) ── */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === link.href ? linkActive : linkInactive
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {secondaryLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === href ? linkActive : linkInactive
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* ── Actions droites ── */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Recherche */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher"
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${iconBtn}`}
              >
                <Search size={16} />
              </button>

              {/* Toggle thème */}
              <button
                onClick={toggleTheme}
                aria-label={isLight ? 'Mode sombre' : 'Mode clair'}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${iconBtn} hover:text-faso-gold`}
              >
                {isLight ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {/* ── Bouton Contribuer (toujours visible) ── */}
              <Link
                href="/upload"
                className="flex items-center gap-1 btn-gold text-[10px] sm:text-xs md:text-sm
                           py-1.5 px-2.5 sm:py-2 sm:px-3 md:py-2 md:px-4 rounded-xl"
              >
                <Upload size={12} className="sm:w-[13px] sm:h-[13px] md:w-4 md:h-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">{t('contribute')}</span>
              </Link>

              {/* Burger (visible en dessous de md) */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                className={`md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${iconBtn}`}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            MENU MOBILE / TABLETTE
            ❌ Pas de doublon "Contribuer"
            ❌ Pas de switch langue (FloatingLangSwitcher)
        ═══════════════════════════════════════════════ */}
        {menuOpen && (
          <div
            className={`md:hidden border-t animate-slide-down ${
              isLight
                ? 'bg-white/98 border-black/5'
                : 'bg-faso-dusk border-white/5'
            }`}
          >
            <div className="px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-0.5">

              {/* Liens principaux */}
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : isLight
                        ? 'text-[#1A0F05]/75 hover:text-[#1A0F05] hover:bg-black/4'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Séparateur drapeau */}
              <div className="faso-divider my-2" />

              {/* Liens secondaires avec icônes */}
              {secondaryLinks.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                    pathname === href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : isLight
                        ? 'text-[#1A0F05]/55 hover:text-[#1A0F05] hover:bg-black/4'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {label}
                </Link>
              ))}

              {/* Séparateur drapeau */}
              <div className="faso-divider my-2" />

              {/* Toggle thème dans le menu mobile */}
              <button
                onClick={() => { toggleTheme(); setMenuOpen(false) }}
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                  isLight
                    ? 'text-[#1A0F05]/60 hover:text-[#1A0F05] hover:bg-black/4'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {isLight ? <Moon size={15} className="flex-shrink-0" /> : <Sun size={15} className="flex-shrink-0" />}
                {isLight
                  ? (locale === 'fr' ? 'Passer en mode sombre' : 'Switch to dark mode')
                  : (locale === 'fr' ? 'Passer en mode clair'  : 'Switch to light mode')
                }
              </button>

            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════
          MODAL RECHERCHE
      ═══════════════════════════════════════════════ */}
      {searchOpen && (
        <div
          className={`fixed inset-0 z-[100] backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 ${
            isLight ? 'bg-white/70' : 'bg-black/80'
          }`}
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="w-full max-w-2xl animate-scale-in">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-[#1A0F05]/40' : 'text-white/40'
                }`}
                size={18}
              />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-12 sm:pl-14 pr-10 sm:pr-12 py-3.5 sm:py-5 rounded-2xl text-base sm:text-lg input-field border-faso-gold/30"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 transition-colors ${
                  isLight ? 'text-[#1A0F05]/40 hover:text-[#1A0F05]' : 'text-white/40 hover:text-white'
                }`}
              >
                <X size={20} />
              </button>
            </form>

            {/* Suggestions rapides */}
            <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible scrollbar-hide">
              {quickSearches.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => {
                    router.push(`/?q=${tag}`)
                    setSearchOpen(false)
                  }}
                  className="badge badge-gray hover:badge-gold cursor-pointer transition-all whitespace-nowrap flex-shrink-0 sm:flex-shrink"
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
