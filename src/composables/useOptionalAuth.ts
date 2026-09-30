import { computed } from 'vue'
import { useAuth } from '@jtekt/vuetify-auth'

/**
 * Safe wrapper around useAuth() for apps where authentication is optional.
 * When the auth plugin is not installed, session is null and authConfigured is false.
 * Components can use authConfigured to show UI unconditionally when auth is absent.
 */
export function useOptionalAuth() {
    try {
        const auth = useAuth()
        return { ...auth, authConfigured: true }
    } catch {
        return {
            session: computed(() => null),
            logout: async () => {},
            authConfigured: false,
        }
    }
}
