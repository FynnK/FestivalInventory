import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { en } from './en'
import { de } from './de'

export type Locale = 'en' | 'de'

const locales: Record<Locale, Record<string, string>> = { en, de }

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('festivalInventory_locale')
    return (saved === 'de' || saved === 'en') ? saved : 'en'
  })

  const handleSetLocale = useCallback((l: Locale) => {
    setLocale(l)
    localStorage.setItem('festivalInventory_locale', l)
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = locales[locale][key] || locales.en[key] || key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return value
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
