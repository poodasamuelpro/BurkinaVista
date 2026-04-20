'use client'
/**
 * components/layout/Navbar.tsx — Navigation principale bilingue + thème
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
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { locale, switchLocale } = useLocale()
  const t = useTranslations('nav')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    { href: '/', label: t('home') },
    { href: '/categories', label: t('explore') },
    { href: '/upload', label: t('contribute') },
  ]

  const mobileSecondaryLinks = [
    { href: '/about', label: t('about'), Icon: Info },
    { href: '/guide', label: t('guide'), Icon: BookOpen },
    { href: '/contact', label: t('contact'), Icon: MessageSquare },
  ]

  const quickSearches = t.raw('quick_searches') as string[]

  const isLight = theme === 'light'

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? (isLight
                ? 'bg-faso-night/95 backdrop-blur-xl border-b border-black/8 shadow-lg'
                : 'bg-faso-night/95 backdrop-blur-xl border-b border-white/5 shadow-2xl')
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-13 sm:h-16 md:h-20">

            {/* Logo — réduit sur mobile */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <FasoLogo
                size={22}
                showName={true}
                className="group-hover:opacity-90 transition-opacity sm:scale-125 md:scale-150 origin-left"
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
              <Link
                href="/contact"
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === '/contact'
                    ? 'text-faso-gold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t('contact')}
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Recherche */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher"
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search size={15} />
              </button>

              {/* Toggle thème */}
              <button
                onClick={toggleTheme}
                aria-label={isLight ? 'Mode sombre' : 'Mode clair'}
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-faso-gold hover:bg-white/5 transition-all"
              >
                {isLight ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Switch langue — visible partout */}
              <button
                onClick={() => switchLocale(locale === 'fr' ? 'en' : 'fr')}
                aria-label="Changer la langue"
                className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold text-white/60 hover:text-faso-gold hover:bg-white/5 border border-white/10 hover:border-faso-gold/30 transition-all"
              >
                {locale === 'fr' ? 'EN' : 'FR'}
              </button>

              {/* Bouton Contribuer — un seul, adapté selon la taille */}
              <Link
                href="/upload"
                className="flex items-center gap-1 btn-gold text-[10px] sm:text-xs md:text-sm py-1.5 px-2 sm:py-2 sm:px-3 md:py-2 md:px-4"
              >
                <Upload size={11} className="sm:w-[13px] sm:h-[13px] md:w-4 md:h-4" />
                <span>{t('contribute')}</span>
              </Link>

              {/* Burger mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
                className="md:hidden w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden bg-faso-dusk border-t border-white/5 animate-slide-down">
            <div className="px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-1">

              {/* Liens principaux */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="faso-divider my-1.5 sm:my-2" />

              {/* Liens secondaires */}
              {mobileSecondaryLinks.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                    pathname === href
                      ? 'text-faso-gold bg-faso-gold/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {label}
                </Link>
              ))}

              <div className="faso-divider my-1.5 sm:my-2" />

              {/* Switch langue + thème mobile dans le menu */}
              <div className="flex gap-2 px-2 sm:px-4 py-2">
                <button
                  onClick={() => switchLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:text-faso-gold hover:border-faso-gold/30 transition-all"
                >
                  {locale === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}
                </button>
                <button
                  onClick={() => { toggleTheme(); setMenuOpen(false) }}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:text-faso-gold hover:border-faso-gold/30 transition-all flex items-center justify-center gap-2"
                >
                  {isLight ? <Moon size={14} /> : <Sun size={14} />}
                  {isLight ? (locale === 'fr' ? 'Sombre' : 'Dark') : (locale === 'fr' ? 'Clair' : 'Light')}
                </button>
              </div>

              {/* CTA Contribuer dans le menu */}
              <Link
                href="/upload"
                onClick={() => setMenuOpen(false)}
                className="btn-gold justify-center py-2.5 sm:py-3 mt-1"
              >
                <Upload size={16} /> {t('contribute')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Modal de recherche */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="w-full max-w-2xl animate-scale-in">
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/40"
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
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
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