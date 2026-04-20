/**
 * components/ui/FasoLogo.tsx — Logo SVG drapeau Burkina Faso réel
 * Couleurs officielles : Rouge #EF2B2D, Vert #009A00, Étoile jaune #EFC031
 * Proportions réelles du drapeau (ratio 2:3)
 */
interface FasoLogoProps {
  /** Taille en pixels (hauteur de base) — défaut 36 */
  size?: number
  /** Classes CSS additionnelles */
  className?: string
  /** Afficher le nom à côté du logo */
  showName?: boolean
  /** Coins arrondis */
  rounded?: boolean
}

export default function FasoLogo({
  size = 36,
  className = '',
  showName = false,
  rounded = true,
}: FasoLogoProps) {
  // Proportions réelles drapeau Burkina Faso : largeur = 1.5 × hauteur (ratio 2:3)
  const width = size * 1.5
  const height = size
  const halfHeight = height / 2
  const cornerRadius = rounded ? 4 : 0

  // Étoile à 5 branches — calcul des points
  const cx = width / 2
  const cy = height / 2
  // Rayon externe et interne de l'étoile
  const outerR = height * 0.22
  const innerR = height * 0.09

  const starPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* SVG drapeau */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Drapeau Burkina Faso"
        role="img"
      >
        <defs>
          {rounded && (
            <clipPath id="flag-clip">
              <rect width={width} height={height} rx={cornerRadius} ry={cornerRadius} />
            </clipPath>
          )}
        </defs>

        {/* Bande rouge supérieure — exactement 50% */}
        <rect
          x="0"
          y="0"
          width={width}
          height={halfHeight}
          fill="#EF2B2D"
          clipPath={rounded ? 'url(#flag-clip)' : undefined}
        />

        {/* Bande verte inférieure — exactement 50% */}
        <rect
          x="0"
          y={halfHeight}
          width={width}
          height={halfHeight}
          fill="#009A00"
          clipPath={rounded ? 'url(#flag-clip)' : undefined}
        />

        {/* Bord arrondi (appliqué après les rectangles) */}
        {rounded && (
          <rect
            width={width}
            height={height}
            rx={cornerRadius}
            ry={cornerRadius}
            fill="none"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth="0.5"
          />
        )}

        {/* Étoile jaune à 5 branches centrée */}
        <polygon
          points={starPoints}
          fill="#EFC031"
        />
      </svg>

      {/* Nom optionnel */}
      {showName && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-xl font-bold text-white">
            BurkinaVista
          </span>
          <span className="text-[10px] text-white/40 tracking-widest uppercase">
            Burkina Faso
          </span>
        </div>
      )}
    </div>
  )
}
