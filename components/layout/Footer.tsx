'use client'
/**
 * components/layout/Footer.tsx
 * Footer bilingue avec newsletter inline
 * Logo centré en mobile, aligné à gauche en desktop
 * Adapté mode clair/sombre
 */
import { useState } from 'react'
import Link from 'next/link'
import { Send, Loader2, Mail } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [nom, setNom] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const t = useTranslations('footer')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), nom: nom.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        setMessage(data.message || t('newsletter_success'))
        setEmail('')
        setNom('')
      } else {
        setSuccess(false)
        setMessage(data.error || t('newsletter_error'))
      }
    } catch {
      setSuccess(false)
      setMessage(t('newsletter_network_error'))
    }
    setLoading(false)
  }

  const socialLinks = [
    { Icon: FacebookIcon, href: '#', label: 'Facebook' },
    { Icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
    { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  ]

  const exploreLinks = [
    { label: t('photos'),         href: '/?type=photo' },
    { label: t('videos'),         href: '/?type=video' },
    { label: t('categories'),     href: '/categories' },
    { label: t('contribute_link'),href: '/upload' },
    { label: t('guide_link'),     href: '/guide' },
  ]

  const infoLinks = [
    { label: t('about'),    href: '/about' },
    { label: t('licences'), href: '/licences' },
    { label: t('cgu'),      href: '/cgu' },
    { label: t('privacy'),  href: '/confidentialite' },
    { label: t('contact'),  href: '/contact' },
  ]

  /* Couleurs adaptées au thème */
  const mutedText = isLight ? 'text-[rgba(28,42,58,0.5)]' : 'text-white/40'
  const labelText = isLight ? 'text-[#1C2A3A] font-semibold' : 'text-white font-semibold'
  const borderColor = isLight ? 'border-[rgba(28,42,58,0.09)]' : 'border-white/5'
  const socialBtn = isLight
    ? 'border-[rgba(28,42,58,0.12)] text-[rgba(28,42,58,0.4)] hover:text-faso-gold hover:border-faso-gold/30'
    : 'border-white/10 text-white/40 hover:text-faso-gold hover:border-faso-gold/30'

  return (
    <footer className={`border-t mt-24 ${borderColor} ${isLight ? 'bg-[#E2EAF4]' : 'bg-faso-dusk/50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* ── Brand / Logo ── */}
          <div className="md:col-span-2 lg:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            {/* Logo centré en mobile, aligné gauche en md+ */}
            <Link
              href="/"
              className="flex items-center justify-center md:justify-start gap-3 mb-4 hover:opacity-80 transition-opacity"
            >
              <FasoLogo size={36} showName={true} />
            </Link>

            <p className={`text-sm leading-relaxed max-w-xs mt-2 ${mutedText}`}>
              {t('tagline')}
            </p>

            {/* Email de contact */}
            <a
              href="mailto:BurkinaVista@gmail.com"
              className="inline-flex items-center gap-2 mt-4 text-sm text-faso-gold hover:text-faso-gold/80 transition-colors"
            >
              <Mail size={14} />
              {t('email_contact')}
            </a>

            <div className="faso-divider w-24 mt-5" />

            {/* Réseaux sociaux */}
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${socialBtn}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Explorer ── */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className={`text-sm mb-4 ${labelText}`}>{t('explore')}</h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm hover:text-faso-gold transition-colors ${mutedText}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Informations ── */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className={`text-sm mb-4 ${labelText}`}>{t('info')}</h3>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm hover:text-faso-gold transition-colors ${mutedText}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Newsletter ── */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className={`text-sm mb-2 ${labelText}`}>{t('newsletter_title')}</h3>
            <p className={`text-xs mb-4 leading-relaxed text-center md:text-left ${mutedText}`}>
              {t('newsletter_desc')}
            </p>

            {success ? (
              <div className="bg-faso-green/10 border border-faso-green/30 rounded-xl p-4 w-full">
                <p className="text-faso-green text-sm font-medium">✅ {message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 w-full">
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder={t('newsletter_name')}
                  className="input-field text-sm py-2.5"
                  disabled={loading}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletter_email')}
                  className="input-field text-sm py-2.5"
                  required
                  disabled={loading}
                />
                {message && !success && (
                  <p className="text-faso-red text-xs">{message}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full btn-gold justify-center py-2.5 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {loading ? t('newsletter_subscribing') : t('newsletter_subscribe')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Copyright ── */}
        <div className={`border-t mt-12 pt-8 flex flex-col items-center gap-2 text-center ${borderColor}`}>
          <p className={`text-xs ${isLight ? 'text-[rgba(28,42,58,0.3)]' : 'text-white/20'}`}>
            © {new Date().getFullYear()} BurkinaVista — {t('copyright')}
          </p>
          <a
            href="mailto:BurkinaVista@gmail.com"
            className="text-xs text-faso-gold/60 hover:text-faso-gold transition-colors"
          >
            {t('email_contact')}
          </a>
          <p className={`text-xs ${isLight ? 'text-[rgba(28,42,58,0.3)]' : 'text-white/20'}`}>
            🇧🇫 <span className="text-faso-red">Burkina</span>
            <span className={isLight ? 'text-[rgba(28,42,58,0.2)]'  : 'text-white/20'}> · </span>
            <span className="text-faso-gold">Vista</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
