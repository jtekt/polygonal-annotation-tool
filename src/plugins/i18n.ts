import { watch } from 'vue'
import { createI18n } from 'vue-i18n'
import { en as VuetifyEn, ja as VuetifyJa } from 'vuetify/locale'
import en from '@/locales/en.json'
import ja from '@/locales/ja.json'

const LOCALE_STORAGE_KEY = 'locale'

export const i18n = createI18n({
    legacy: false,
    locale:
        localStorage.getItem(LOCALE_STORAGE_KEY) ||
        import.meta.env.VITE_I18N_LOCALE ||
        'en',
    fallbackLocale: import.meta.env.VITE_I18N_FALLBACK_LOCALE || 'en',
    messages: {
        en: { ...en, $vuetify: VuetifyEn },
        ja: { ...ja, $vuetify: VuetifyJa },
    },
})

// Keep <html lang> in sync, and remember the user's choice
document.documentElement.lang = i18n.global.locale.value
watch(i18n.global.locale, (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale
})
