'use client'
/**
 * components/layout/Footer.tsx — Footer avec formulaire newsletter
 * Formulaire d'abonnement newsletter intégré
 * Logo FasoLogo SVG réel
 */
import { useState } from 'react'
import Link from 'next/link'
import { Github, Twitter, Instagram, Send, Loader2 } from 'lucide-react'
import FasoLogo from '@/components/ui/FasoLogo'

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

  return (
    <footer className="border-t border-white/5 bg-faso-dusk/50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <FasoLogo size={36} showName={true} />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mt-4">
              La bibliothèque visuelle libre du Burkina Faso. Des images authentiques,
              par des Burkinabè, pour le monde entier.
            </p>
            <div className="faso-divider w-24 mt-6" />
            {/* Réseaux sociaux */}
            <div className="flex gap-3 mt-5">
              {[
                { Icon: Twitter, href: '#', label: 'Twitter' },
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Github, href: 'https://github.com/poodasamuelpro/BurkinaVista', label: 'GitHub' },
              ].map(({ Icon, href, label }) => (
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
              {[
                { label: 'Photos', href: '/?type=photo' },
                { label: 'Vidéos', href: '/?type=video' },
                { label: 'Catégories', href: '/categories' },
                { label: 'Contribuer', href: '/upload' },
              ].map((link) => (
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
              {[
                { label: 'À propos', href: '/about' },
                { label: 'Licences CC', href: '/licences' },
                { label: 'CGU', href: '/cgu' },
              ].map((link) => (
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

        {/* Copyright */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} BurkinaVista — Fait avec ❤️ pour le Burkina Faso
          </p>
          <p className="text-xs text-white/20">
            🇧🇫 <span className="text-faso-red">Burkina</span>
            <span className="text-white/20">·</span>
            <span className="text-faso-gold">Vista</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
