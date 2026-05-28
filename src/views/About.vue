<template>
    <v-card>
        <v-card-title>Annotation tool</v-card-title>
        <v-card-text>
            <p>Authors: Maxime MOREILLON</p>
            <p>Labels: {{ labels }}</p>
            <p>Annotation field: {{ annotation_field }}</p>
            <v-data-table
                hide-default-footer
                :items-per-page="-1"
                :headers="headers"
                :items="services"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from '@/axios'
import pjson from '../../package.json'

interface Service {
    name: string
    url: string
    version: string | null
}

const labels = import.meta.env.VITE_LABELS
const annotation_field = import.meta.env.VITE_ANNOTATION_FIELD
const storageApiUrl = import.meta.env.VITE_STORAGE_SERVICE_API_URL

const headers = [
    { title: 'Service', key: 'name' },
    { title: 'Version', key: 'version' },
    { title: 'URL', key: 'url' },
]

const services = ref<Service[]>([
    { name: 'Annotation tool', url: window.location.origin, version: pjson.version },
    { name: 'Image storage API', url: storageApiUrl, version: null },
])

onMounted(async () => {
    for (const service of services.value) {
        if (service.version) continue
        service.version = 'Connecting...'
        try {
            const { data } = await axios.get(service.url)
            service.version = data.version
        } catch {
            service.version = 'Unable to connect'
        }
    }
})
</script>
