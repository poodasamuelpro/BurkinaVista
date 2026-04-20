'use client'
/**
 * components/photos/StatsBar.tsx
 * Barre de statistiques animée — bilingue + mode clair/sombre
 */
import { useEffect, useRef, useState } from 'react'
import { Image, Video, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

interface StatsBarProps {
  photos: number
  videos: number
  contributors: number
}

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1500
          const step = target / (duration / 16)
          let current = 0
          const timer = setInterval(() => {
            current = Math.min(current + step, target)
            setCount(Math.floor(current))
            if (current >= target) clearInterval(timer)
          }, 16)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}</span>
}

export default function StatsBar({ photos, videos, contributors }: StatsBarProps) {
  const t = useTranslations('stats')
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const stats = [
    { icon: Image,  label: t('photos'),       value: photos,       color: 'text-faso-red' },
    { icon: Video,  label: t('videos'),        value: videos,       color: 'text-faso-green' },
    { icon: Users,  label: t('contributors'),  value: contributors, color: 'text-faso-gold' },
  ]

  return (
    <div className="relative -mt-12 z-10 max-w-4xl mx-auto px-4 mb-16">
      <div
        className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${
          isLight
            ? 'bg-white/95 border-[rgba(28,42,58,0.10)] shadow-[0_4px_24px_rgba(28,42,58,0.10)]'
            : 'bg-faso-dusk/80 border-white/10'
        }`}
      >
        <div className={`grid grid-cols-3 ${isLight ? 'divide-x divide-[rgba(28,42,58,0.08)]' : 'divide-x divide-white/5'}`}>
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-6 px-4">
              <Icon size={20} className={`${color} mb-2`} />
              <span className={`font-display text-3xl md:text-4xl font-bold ${color}`}>
                <AnimatedNumber target={value} />
              </span>
              <span className={`text-xs mt-1 text-center ${isLight ? 'text-[rgba(28,42,58,0.5)]' : 'text-white/40'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
