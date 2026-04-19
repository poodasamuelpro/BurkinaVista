'use client'
import { useEffect, useRef, useState } from 'react'
import { Image, Video, Users } from 'lucide-react'

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
  const stats = [
    { icon: Image, label: 'Photos libres', value: photos, color: 'text-faso-red' },
    { icon: Video, label: 'Vidéos', value: videos, color: 'text-faso-green' },
    { icon: Users, label: 'Contributeurs', value: contributors, color: 'text-faso-gold' },
  ]

  return (
    <div className="relative -mt-12 z-10 max-w-4xl mx-auto px-4 mb-16">
      <div className="card border border-white/10 backdrop-blur-xl bg-faso-dusk/80">
        <div className="grid grid-cols-3 divide-x divide-white/5">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center py-6 px-4">
              <Icon size={20} className={`${color} mb-2`} />
              <span className={`font-display text-3xl md:text-4xl font-bold ${color}`}>
                <AnimatedNumber target={value} />
              </span>
              <span className="text-xs text-white/40 mt-1 text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
