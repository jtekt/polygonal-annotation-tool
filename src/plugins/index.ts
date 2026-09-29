import type { App } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import vuetify from './vuetify'
import { i18n } from './i18n'

export function registerPlugins(app: App) {
    app.use(createPinia())
    app.use(vuetify)
    app.use(i18n)
    app.use(router)
}
