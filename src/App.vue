<template>
    <AppTemplate :options="options" @user="store.set_current_user($event as any)">
        <template v-slot:nav>
            <v-list density="compact" nav>
                <v-list-item>
                    <LocaleSelector />
                </v-list-item>
                <v-divider />

                <v-list-item
                    :to="{ name: 'images', query }"
                    exact
                    prepend-icon="mdi-image-multiple"
                    :title="$t('Images')"
                />

                <v-list-item
                    exact
                    :to="{ name: 'about' }"
                    prepend-icon="mdi-information-outline"
                    :title="$t('About')"
                />

                <NavCategories />
            </v-list>
        </template>
    </AppTemplate>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppTemplate from './components/AppTemplate.vue'
import LocaleSelector from './components/LocaleSelector.vue'
import NavCategories from './components/NavCategories.vue'
import { useAppStore } from './store'
import jtektLogoNegative from '@/assets/jtekt_logo_negative.jpg'
import jtektLogo from '@/assets/jtekt_logo.jpg'

const store = useAppStore()
const route = useRoute()

const options = {
    title: 'Polygonal annotation tool',
    login_url: import.meta.env.VITE_LOGIN_URL,
    identification_url: import.meta.env.VITE_IDENTIFICATION_URL,
    login_hint: import.meta.env.VITE_LOGIN_HINT,
    homepage_url: import.meta.env.VITE_HOMEPAGE_URL,
    oidc: {
        authority: import.meta.env.VITE_OIDC_AUTHORITY,
        client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
        extraQueryParams: {
            audience: import.meta.env.VITE_OIDC_AUDIENCE,
        },
    },
    header_logo: jtektLogoNegative,
    authentication_logo: jtektLogo,
    colors: { app_bar: '#000' },
    author: 'Maxime Moreillon - JTEKT Corporation',
}

const query = computed(() => {
    const { cursor, ...rest } = route.query
    return rest
})
</script>

<style>
.header_logo {
    border-right: 1px solid white;
}
</style>
