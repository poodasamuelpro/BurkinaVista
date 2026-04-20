'use client'
/**
 * components/layout/Providers.tsx — ThemeProvider + LocaleProvider client
 */
import { ThemeProvider } from '@/context/ThemeContext'
import { LocaleProvider } from '@/context/LocaleContext'
import type { Locale } from '@/context/LocaleContext'

export default function Providers({
  children,
  locale,
}: {
  children: React.ReactNode
  locale: Locale
}) {
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={locale}>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  )
}
