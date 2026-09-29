<template>
    <v-dialog v-model="help_dialog" width="500">
        <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
                <v-icon>mdi-information</v-icon>
            </v-btn>
        </template>

        <v-card>
            <v-card-title>Help</v-card-title>
            <v-card-text>
                <v-list density="compact">
                    <v-list-item v-for="(shortcut, i) in shortcuts" :key="i">
                        <v-list-item-title class="py-2">
                            <span class="shortcut">{{ shortcut.key }}</span>
                            &nbsp;&nbsp;{{ shortcut.action }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="help_dialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const help_dialog = ref(false)

const shortcuts = computed(() => [
    { key: 'Ctrl + S', action: t('Save annotations') },
    { key: 'Ctrl + Z', action: 'Remove last polygon point' },
    { key: 'Del', action: 'Delete selected point / annotation' },
    { key: '←', action: 'Previous item' },
    { key: '→', action: 'Next item' },
])
</script>

<style scoped>
.shortcut {
    border: 1px solid #dddddd;
    border-radius: 0.5em;
    padding: 0.5em;
}
</style>
