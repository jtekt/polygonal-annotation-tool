<template>
    <v-app>
        <template v-if="!isLoginRoute">
            <v-app-bar color="#000">
                <v-app-bar-nav-icon
                    v-if="showDrawer"
                    @click="drawer = !drawer"
                />
                <v-app-bar-title>Polygonal annotation tool</v-app-bar-title>
                <template #append>
                    <LocaleSelector />
                    <ThemeToggle />
                    <v-btn v-if="session" icon="mdi-logout" @click="logout" />
                </template>
            </v-app-bar>

            <v-navigation-drawer v-if="showDrawer" v-model="drawer">
                <v-list nav>
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
            </v-navigation-drawer>
        </template>

        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOptionalAuth } from '@/composables/useOptionalAuth'
import { useAxiosAuth } from '@/composables/useAxiosAuth'
import LocaleSelector from './components/LocaleSelector.vue'
import NavCategories from './components/NavCategories.vue'
import ThemeToggle from './components/ThemeToggle.vue'

useAxiosAuth()

const showDrawer = computed(() => !authConfigured || session.value)
const { session, logout, authConfigured } = useOptionalAuth()
const route = useRoute()
const drawer = ref(true)

const isLoginRoute = computed(() => route.name === 'login')

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
