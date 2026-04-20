'use client'
/**
 * context/LocaleContext.tsx — Contexte langue FR/EN
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Locale = 'fr' | 'en'

interface LocaleContextType {
  locale: Locale
  switchLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'fr',
  switchLocale: () => {},
})

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale: Locale
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  const switchLocale = (l: Locale) => {
    setLocale(l)
    document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <LocaleContext.Provider value={{ locale, switchLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
