'use client'
/**
 * components/photos/HeroSection.tsx
 * Hero avec slideshow, traductions FR/EN, adapté mode clair/sombre
 */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Upload, ArrowDown } from 'lucide-react'
import type { Media } from '@/types'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

interface HeroSectionProps {
  featuredMedias: Media[]
}

export default function HeroSection({ featuredMedias }: HeroSectionProps) {
  const [currentBg, setCurrentBg] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const t = useTranslations('hero')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  useEffect(() => {
    setLoaded(true)
    if (featuredMedias.length > 1) {
      const interval = setInterval(() => {
        setCurrentBg((prev) => (prev + 1) % Math.min(featuredMedias.length, 5))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [featuredMedias.length])

  const bgMedia = featuredMedias[currentBg]

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* ── Background slideshow ── */}
      <div className="absolute inset-0">
        {featuredMedias.slice(0, 5).map((media, i) => (
          <div
            key={media.id}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === currentBg ? 1 : 0 }}
          >
            <img
              src={media.cloudinary_url || media.thumbnail_url || ''}
              alt={media.alt_text}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {featuredMedias.length === 0 && (
          <div className="absolute inset-0 hero-gradient-bg" />
        )}

        {/* Overlay adapté au thème :
            - Sombre : overlay noir pour faire ressortir le texte blanc
            - Clair  : overlay bleu translucide léger — on voit encore la photo */}
        {isLight ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#1C2A3A]/50 via-[#1C2A3A]/30 to-[#EEF3FA]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C2A3A]/40 via-transparent to-[#1C2A3A]/40" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-faso-night/60 via-faso-night/40 to-faso-night" />
            <div className="absolute inset-0 bg-gradient-to-r from-faso-night/80 via-transparent to-faso-night/80" />
          </>
        )}
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      </div>

      {/* ── Éléments décoratifs flottants — couleurs drapeau BF ── */}
      <div className="absolute top-1/4 left-8 w-2 h-24 rounded-full bg-faso-red/30 animate-float" />
      <div className="absolute top-1/3 right-12 w-2 h-16 rounded-full bg-faso-gold/30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 left-16 w-2 h-20 rounded-full bg-faso-green/30 animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-32 right-1/4 w-8 h-8 faso-star bg-faso-gold/10 animate-spin-slow" />
      <div className="absolute bottom-40 left-1/4 w-5 h-5 faso-star bg-faso-red/15 animate-spin-slow" style={{ animationDelay: '3s' }} />
      <div className="absolute top-20 left-1/3 w-3 h-3 rounded-full bg-faso-gold/20 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-faso-red/20 animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-2/3 left-1/2 w-4 h-4 rounded-full bg-faso-green/15 animate-float" style={{ animationDelay: '0.5s' }} />

      {/* ── Contenu principal ── */}
      <div
        className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 badge badge-gold mb-8 animate-pulse-gold">
          <span className="w-2 h-2 rounded-full bg-faso-gold animate-pulse" />
          {t('badge')}
        </div>

        {/* Titre — toujours blanc sur la photo (overlay garantit le contraste) */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-none drop-shadow-lg">
          {t('title_1')}
          <br />
          <span className="text-gradient-faso">{t('title_2')}</span>
        </h1>

        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow">
          {t('subtitle')}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/?scroll=grid" className="btn-primary text-base px-8 py-4 animate-glow-red">
            {t('cta_explore')}
          </Link>
          <Link
            href="/upload"
            className="btn-ghost text-base px-8 py-4 text-white border-white/30 hover:border-faso-gold hover:text-faso-gold"
          >
            <Upload size={18} />
            {t('cta_contribute')}
          </Link>
        </div>

        {/* Indicateurs slideshow */}
        {featuredMedias.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            {featuredMedias.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBg(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentBg
                    ? 'w-8 h-2 bg-faso-gold'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Flèche bas */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={24} className="text-white/50" />
      </div>

      {/* Crédit photo */}
      {bgMedia && (
        <div className="absolute bottom-8 right-8 text-xs text-white/40 drop-shadow">
          📷{' '}
          {bgMedia.contributeur_nom
            ? `${bgMedia.contributeur_prenom ?? ''} ${bgMedia.contributeur_nom}`.trim()
            : 'BurkinaVista'}
        </div>
      )}
    </section>
  )
}
