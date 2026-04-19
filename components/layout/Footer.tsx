import Link from 'next/link'
import { Github, Twitter, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-faso-dusk/50 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
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
              <span className="font-display text-xl font-bold text-white">FasoStock</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              La bibliothèque visuelle libre du Burkina Faso. Des images authentiques, par des Burkinabè, pour le monde entier.
            </p>
            <div className="faso-divider w-24 mt-6" />
            <div className="flex gap-4 mt-6">
              {[Twitter, Instagram, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
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
                  <Link href={link.href} className="text-sm text-white/40 hover:text-faso-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Informations</h3>
            <ul className="space-y-3">
              {[
                { label: 'À propos', href: '/about' },
                { label: 'Licences CC', href: '/licences' },
                { label: 'CGU', href: '/cgu' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/40 hover:text-faso-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            © 2024 FasoStock — Fait avec ❤️ pour le Burkina Faso
          </p>
          <p className="text-xs text-white/20">
            🇧🇫 <span className="text-faso-gold">Faso</span> · <span className="text-faso-red">Stock</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
