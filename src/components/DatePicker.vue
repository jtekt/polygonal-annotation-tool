<template>
    <v-menu
        v-model="menu"
        :close-on-content-click="false"
        transition="scale-transition"
        min-width="auto"
    >
        <template v-slot:activator="{ props: menuProps }">
            <v-text-field
                v-model="displayDate"
                :label="label"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="menuProps"
                clearable
                @click:clear="onClear"
            />
        </template>

        <v-date-picker v-model="pickerDate" hide-header>
            <template v-slot:actions>
                <v-btn variant="text" color="primary" @click="menu = false">Close</v-btn>
            </template>
        </v-date-picker>
    </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
    label: string
    modelValue: string | undefined
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string | undefined]
}>()

const menu = ref(false)

const displayDate = computed(() => {
    if (!props.modelValue) return ''
    const date = new Date(props.modelValue)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
})

const pickerDate = computed({
    get: () => (props.modelValue ? new Date(props.modelValue) : undefined),
    set: (val: Date | undefined) => {
        if (val) {
            const offset = new Date().getTimezoneOffset() * 60000
            emit('update:modelValue', new Date(val.getTime() + offset).toISOString())
        } else {
            emit('update:modelValue', undefined)
        }
        menu.value = false
    },
})

function onClear() {
    emit('update:modelValue', undefined)
}
</script>
