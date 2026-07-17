import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import es from './locales/es.json'

// El público principal (agencias inmobiliarias en RD) usa español — por eso
// es el fallback, no inglés, y por eso se detecta primero lo que el usuario
// ya eligió antes (localStorage) sobre el idioma del navegador.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'vipe-crm-language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
