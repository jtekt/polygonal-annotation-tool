<template>
    <v-select
        prepend-icon="mdi-translate"
        :items="locales"
        v-model="locale"
        item-title="text"
        item-value="value"
        @update:modelValue="saveLocale"
    />
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const locales = [
    { text: 'English', value: 'en' },
    { text: '日本語', value: 'ja' },
]

onMounted(() => {
    const saved = localStorage.getItem('locale')
    if (saved) locale.value = saved
})

function saveLocale() {
    localStorage.setItem('locale', locale.value as string)
}
</script>
