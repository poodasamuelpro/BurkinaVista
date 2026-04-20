import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export default getRequestConfig(async () => {
  // 1. Cookie manuel (bouton switch)
  const cookieStore = cookies()
  const cookieLang = cookieStore.get('NEXT_LOCALE')?.value

  // 2. Accept-Language du navigateur
  let browserLang: Locale = defaultLocale
  try {
    const headersList = headers()
    const acceptLang = headersList.get('accept-language') || ''
    const primary = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
    if (primary === 'en') browserLang = 'en'
  } catch {}

  const locale: Locale = (cookieLang && locales.includes(cookieLang as Locale))
    ? (cookieLang as Locale)
    : (browserLang as Locale)

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
