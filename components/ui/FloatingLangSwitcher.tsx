'use client'
/**
 * components/ui/FloatingLangSwitcher.tsx
 * Icône flottante de changement de langue FR ↔ EN
 * Positionnée en bas à gauche de l'écran, visible sur toutes les pages
 */
import { useLocale } from '@/context/LocaleContext'
import { useTheme } from '@/context/ThemeContext'
import { useState } from 'react'

export default function FloatingLangSwitcher() {
  const { locale, switchLocale } = useLocale()
  const { theme } = useTheme()
  const [tooltip, setTooltip] = useState(false)
  const isLight = theme === 'light'

  const nextLocale = locale === 'fr' ? 'en' : 'fr'
  const label = locale === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'
  const tooltipText = locale === 'fr' ? 'Switch to English' : 'Passer en Français'

  return (
    <div className="fixed bottom-6 left-6 z-[200] flex flex-col items-center gap-2">
      {/* Tooltip */}
      {tooltip && (
        <div
          className={`
            px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap
            shadow-lg animate-fade-in
            ${isLight
              ? 'bg-white text-gray-800 border border-gray-200 shadow-gray-200/60'
              : 'bg-faso-dusk text-white/90 border border-white/10'}
          `}
          style={{ marginBottom: '4px' }}
        >
          {tooltipText}
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => switchLocale(nextLocale)}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        aria-label={tooltipText}
        className={`
          w-12 h-12 rounded-2xl
          flex items-center justify-center
          text-sm font-extrabold
          shadow-lg
          transition-all duration-300
          hover:scale-110 active:scale-95
          border
          ${isLight
            ? 'bg-white text-gray-800 border-gray-200 shadow-gray-300/70 hover:border-[#EFC031] hover:shadow-[0_4px_18px_rgba(239,192,49,0.35)]'
            : 'bg-faso-dusk text-white/80 border-white/10 hover:border-[#EFC031]/40 hover:text-[#EFC031] hover:shadow-[0_4px_18px_rgba(239,192,49,0.25)]'}
        `}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <span className="text-base leading-none">{label}</span>
      </button>
    </div>
  )
}
