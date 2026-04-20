'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Upload, ArrowDown } from 'lucide-react'
import type { Media } from '@/types'

interface HeroSectionProps {
  featuredMedias: Media[]
}

export default function HeroSection({ featuredMedias }: HeroSectionProps) {
  const [currentBg, setCurrentBg] = useState(0)
  const [loaded, setLoaded] = useState(false)

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
      {/* Background slideshow */}
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
          <div
            style={{
              background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 40%, #0A0A0A 100%)',
            }}
            className="absolute inset-0"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-faso-night/60 via-faso-night/40 to-faso-night" />
        <div className="absolute inset-0 bg-gradient-to-r from-faso-night/80 via-transparent to-faso-night/80" />
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-8 w-2 h-24 rounded-full bg-faso-red/30 animate-float" />
      <div className="absolute top-1/3 right-12 w-2 h-16 rounded-full bg-faso-gold/30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 left-16 w-2 h-20 rounded-full bg-faso-green/30 animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute top-32 right-1/4 w-8 h-8 faso-star bg-faso-gold/10 animate-spin-slow" />
      <div className="absolute bottom-40 left-1/4 w-5 h-5 faso-star bg-faso-red/15 animate-spin-slow" style={{ animationDelay: '3s' }} />

      {/* Content */}
      <div
        className={`relative z-10 text-center px-4 max-w-4xl mx-auto transition-all duration-1000 ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="inline-flex items-center gap-2 badge badge-gold mb-8 animate-pulse-gold">
          <span className="w-2 h-2 rounded-full bg-faso-gold animate-pulse" />
          🇧🇫 Bibliothèque Visuelle du Burkina Faso
        </div>

        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-none">
          Le Burkina
          <br />
          <span className="text-gradient-faso">tel qu'il est</span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
          Des milliers de photos et vidéos authentiques du Burkina Faso,
          libres de droits, par des Burkinabè pour le monde entier.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/?scroll=grid" className="btn-primary text-base px-8 py-4">
            Explorer les médias
          </Link>
          <Link href="/upload" className="btn-ghost text-base px-8 py-4">
            <Upload size={18} />
            Contribuer
          </Link>
        </div>

        {featuredMedias.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            {featuredMedias.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBg(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentBg
                    ? 'w-8 h-2 bg-faso-gold'
                    : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown size={24} className="text-white/30" />
      </div>

      {/* Attribution photo courante — corrigé avec les vrais champs du type Media */}
      {bgMedia && (
        <div className="absolute bottom-8 right-8 text-xs text-white/30">
          📷{' '}
          {bgMedia.contributeur_nom
            ? `${bgMedia.contributeur_prenom ?? ''} ${bgMedia.contributeur_nom}`.trim()
            : 'FasoStock'}
        </div>
      )}
    </section>
  )
}