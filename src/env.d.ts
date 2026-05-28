/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_STORAGE_SERVICE_API_URL: string
    readonly VITE_LABELS: string
    readonly VITE_ANNOTATION_FIELD: string
    readonly VITE_DISPLAYED_FIELDS: string
    readonly VITE_HELPER_RECTANGLE: string
    readonly VITE_DEFAULT_LABEL: string
    readonly VITE_ENABLE_BRUSH: string
    readonly VITE_ENABLE_POLYLINE: string
    readonly VITE_CATEGORIZER: string
    readonly VITE_I18N_LOCALE: string
    readonly VITE_I18N_FALLBACK_LOCALE: string
    readonly VITE_IDENTIFICATION_URL: string
    readonly VITE_LOGIN_URL: string
    readonly VITE_HOMEPAGE_URL: string
    readonly VITE_LOGIN_HINT: string
    readonly VITE_OIDC_AUTHORITY: string
    readonly VITE_OIDC_CLIENT_ID: string
    readonly VITE_OIDC_AUDIENCE: string
    readonly VITE_WS_SERVER_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
