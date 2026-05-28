<template>
    <v-list-group v-if="field_name" prepend-icon="mdi-folder-multiple-image">
        <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" :title="field_name" />
        </template>

        <v-list-item
            v-for="(fieldValue, i) in fieldValues"
            :key="i"
            :prepend-icon="'mdi-image-multiple'"
            :title="String(fieldValue)"
            :to="{
                name: 'images',
                query: {
                    [field_name]: fieldValue,
                    limit: 10,
                    skip: 0,
                    order: -1,
                    sort: 'time',
                },
            }"
            exact
        />
    </v-list-group>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from '@/axios'

const field_name = import.meta.env.VITE_CATEGORIZER || ''
const fieldValues = ref<string[]>([])

onMounted(async () => {
    if (!field_name) return
    const { data } = await axios.get(`/fields/${field_name}`)
    fieldValues.value = data
})
</script>
