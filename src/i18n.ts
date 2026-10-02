import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import hi from './locales/hi.json'
import mr from './locales/mr.json'
import bn from './locales/bn.json'
import ta from './locales/ta.json'
import gu from './locales/gu.json'

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  mr: {
    translation: mr,
  },
  bn: {
    translation: bn,
  },
  ta: {
    translation: ta,
  },
  gu: {
    translation: gu,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',

    supportedLngs: ['en', 'hi', 'mr', 'bn', 'ta', 'gu'],

    interpolation: {
      escapeValue: false,
    },

    returnNull: false,
  })

export default i18n