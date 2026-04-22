'use client'
/**
 * components/layout/PublicLayout.tsx
 * Wrapper qui masque son contenu sur toutes les pages /admin/*
 * Utilisé dans app/layout.tsx pour cacher Navbar, Footer, FloatingLangSwitcher
 * côté admin sans toucher au reste de l'arborescence.
 */
import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export default function PublicLayout({ children }: Props) {
  const pathname = usePathname()

  // Masquer sur toutes les pages admin
  if (pathname.startsWith('/admin')) return null

  return <>{children}</>
}
