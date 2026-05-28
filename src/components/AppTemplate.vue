<template>
    <v-app>
        <v-app-bar :color="options.colors?.app_bar ?? 'primary'" elevation="0">
            <v-app-bar-nav-icon @click="drawer = !drawer" />
            <v-toolbar-title style="color: white">{{ options.title }}</v-toolbar-title>
            <v-spacer />
            <span v-if="currentUser" style="color: white; font-size: 0.85em" class="mr-2">
                {{ currentUser }}
            </span>
        </v-app-bar>

        <v-navigation-drawer v-model="drawer" :permanent="lgAndUp">
            <slot name="nav" />
        </v-navigation-drawer>

        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import axios from '@/axios'

interface AppOptions {
    title?: string
    identification_url?: string
    login_url?: string
    login_hint?: string
    homepage_url?: string
    header_logo?: string
    authentication_logo?: string
    colors?: { app_bar?: string }
    author?: string
    oidc?: {
        authority?: string
        client_id?: string
        extraQueryParams?: Record<string, string>
    }
}

const props = defineProps<{ options: AppOptions }>()
const emit = defineEmits<{ user: [user: unknown] }>()

const { lgAndUp } = useDisplay()
const drawer = ref(true)
const currentUser = ref<string | null>(null)

onMounted(async () => {
    if (!props.options.identification_url) return
    try {
        const { data } = await axios.get(props.options.identification_url)
        currentUser.value =
            data?.properties?.display_name ?? data?.display_name ?? data?.username ?? null
        emit('user', data)
    } catch {
        // Not authenticated — continue without user
    }
})
</script>
