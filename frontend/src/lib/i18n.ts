import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import ja from '../locales/ja.json'

const storedLang = localStorage.getItem('app-language')
const browserLang = navigator.language.split('-')[0]
const defaultLocale = storedLang || (browserLang === 'ja' ? 'ja' : 'en')

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    ja
  }
})

export default i18n
