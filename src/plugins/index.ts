import type { App } from 'vue'
import { createPinia } from 'pinia'
import { createAuthPlugin } from '@jtekt/vuetify-auth'
import router from '@/router'
import vuetify from './vuetify'
import { i18n } from './i18n'
import runtimeEnv from '@/runtimeEnv'

export function registerPlugins(app: App) {
    app.use(createPinia())
    app.use(vuetify)
    app.use(i18n)

    if (runtimeEnv.VITE_LOGIN_URL || runtimeEnv.VITE_OIDC_AUTHORITY) {
        const auth = createAuthPlugin(
            {
                oidc: runtimeEnv.VITE_OIDC_AUTHORITY
                    ? {
                          clientId: runtimeEnv.VITE_OIDC_CLIENT_ID,
                          authority: runtimeEnv.VITE_OIDC_AUTHORITY,
                          enrichmentEndpoint: runtimeEnv.VITE_AUTH_IDENTIFICATION_URL,
                          identifierLookupField: runtimeEnv.VITE_AUTH_ENRICHMENT_ID_FIELD,
                      }
                    : undefined,
                credentials: runtimeEnv.VITE_LOGIN_URL
                    ? {
                          loginEndpoint: runtimeEnv.VITE_LOGIN_URL,
                          identifierLookupField: runtimeEnv.VITE_AUTH_ENRICHMENT_ID_FIELD,
                      }
                    : undefined,
            },
            router,
        )
        app.use(auth)
    }

    app.use(router)
}
