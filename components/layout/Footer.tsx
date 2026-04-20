'use client'
/**
 * components/layout/Footer.tsx — Footer avec formulaire newsletter
 */
import { useState } from 'react'
import Link from 'next/link'
import { Send, Loader2 } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'

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
        setMessage(data.message || 'Abonnement confirmé !')
        setEmail('')
        setNom('')
      } else {
        setSuccess(false)
        setMessage(data.error || 'Erreur lors de l\'abonnement')
      }
    } catch {
      setSuccess(false)
      setMessage('Erreur réseau — réessayez plus tard')
    }
    setLoading(false)
  }

  const socialLinks = [
    { Icon: FacebookIcon, href: '#', label: 'Facebook' },
    { Icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
    { Icon: InstagramIcon, href: '#', label: 'Instagram' },
  ]

  const exploreLinks = [
    { label: 'Photos', href: '/?type=photo' },
    { label: 'Vidéos', href: '/?type=video' },
    { label: 'Catégories', href: '/categories' },
    { label: 'Contribuer', href: '/upload' },
    { label: 'Guide du contributeur', href: '/guide' },
  ]

  const infoLinks = [
    { label: 'À propos', href: '/about' },
    { label: 'Licences CC', href: '/licences' },
    { label: 'CGU', href: '/cgu' },
    { label: 'Politique de confidentialité', href: '/confidentialite' },
  ]

  return (
    <footer className="border-t border-white/5 bg-faso-dusk/50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            {/* Logo cliquable → accueil */}
            <Link href="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <FasoLogo size={36} showName={true} />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mt-4">
              La bibliothèque visuelle libre du Burkina Faso. Des images authentiques,
              par des Burkinabè, pour le monde entier.
            </p>
            <div className="faso-divider w-24 mt-6" />
            {/* Réseaux sociaux */}
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-faso-gold hover:border-faso-gold/30 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explorer */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Explorer</h3>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-faso-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Informations</h3>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/40 hover:text-faso-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Newsletter</h3>
            <p className="text-xs text-white/40 mb-4 leading-relaxed">
              Recevez les nouvelles photos et vidéos du Burkina Faso chaque semaine.
            </p>

            {success ? (
              <div className="bg-faso-green/10 border border-faso-green/30 rounded-xl p-4">
                <p className="text-faso-green text-sm font-medium">✅ {message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre prénom (optionnel)"
                  className="input-field text-sm py-2.5"
                  disabled={loading}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
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
                  {loading ? 'Abonnement...' : 'S\'abonner'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Copyright centré */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} BurkinaVista — Tous droits réservés
          </p>
          <p className="text-xs text-white/20">
            🇧🇫 <span className="text-faso-red">Burkina</span>
            <span className="text-white/20"> · </span>
            <span className="text-faso-gold">Vista</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
