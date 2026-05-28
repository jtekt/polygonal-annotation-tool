<template>
    <v-row dense>
        <v-col>
            <v-card variant="outlined">
                <v-expansion-panels variant="accordion">
                    <v-expansion-panel>
                        <v-expansion-panel-title>
                            <span>
                                <v-icon>mdi-magnify</v-icon>
                                <span>{{ $t('Query settings') }}</span>
                            </span>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <v-row align="baseline">
                                <v-col>
                                    <DatePicker label="From" :modelValue="from" @update:modelValue="from = $event" />
                                </v-col>
                                <v-col>
                                    <DatePicker label="To" :modelValue="to" @update:modelValue="to = $event" />
                                </v-col>
                            </v-row>

                            <v-row
                                v-for="(key, index) in Object.keys(filters)"
                                :key="index"
                            >
                                <v-col>
                                    <v-text-field :model-value="key" label="Field" readonly />
                                </v-col>
                                <v-col>
                                    <v-text-field
                                        :model-value="filters[key]"
                                        label="Value"
                                        readonly
                                    />
                                </v-col>
                                <v-col cols="auto">
                                    <v-btn
                                        @click="removeFilter(key)"
                                        icon
                                        color="#c00000"
                                        variant="text"
                                    >
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>

                            <v-form @submit.prevent="addFilter">
                                <v-row>
                                    <v-col>
                                        <v-combobox
                                            :items="unusedFilters"
                                            v-model="newFilterField"
                                            label="New filter field"
                                        />
                                    </v-col>
                                    <v-col>
                                        <v-text-field
                                            label="New filter value"
                                            v-model="newFilterValue"
                                        />
                                    </v-col>
                                    <v-col cols="auto">
                                        <v-btn
                                            type="submit"
                                            :disabled="!newFilterValue"
                                            icon
                                            variant="text"
                                        >
                                            <v-icon>mdi-plus</v-icon>
                                        </v-btn>
                                    </v-col>
                                </v-row>
                            </v-form>

                            <v-row align="baseline">
                                <v-col cols="auto">
                                    <v-switch label="Partial match" v-model="regex" />
                                </v-col>
                            </v-row>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DatePicker from './DatePicker.vue'

const props = defineProps<{
    fields: string[]
}>()

const route = useRoute()
const router = useRouter()

const newFilterField = ref<string | null>(null)
const newFilterValue = ref<string | null>(null)

const from = computed({
    get: () => route.query.from as string | undefined,
    set: (val: string | undefined) => {
        const query = { ...route.query, from: val }
        if (!val) delete query.from
        router.replace({ query })
    },
})

const to = computed({
    get: () => route.query.to as string | undefined,
    set: (val: string | undefined) => {
        const query = { ...route.query, to: val }
        if (!val) delete query.to
        router.replace({ query })
    },
})

const regex = computed({
    get: () => route.query.regex as string | undefined,
    set: (val) => {
        const query = { ...route.query, regex: val }
        if (!val) delete (query as Record<string, unknown>).regex
        router.replace({ query: query as Record<string, string> })
    },
})

const filters = computed(() => {
    const { to, from, sort, order, page, limit, skip, regex, ...fields } = route.query
    return fields as Record<string, string>
})

const unusedFilters = computed(() =>
    ['file', ...props.fields].filter((f) => !Object.keys(filters.value).includes(f))
)

function addFilter() {
    if (!newFilterField.value || !newFilterValue.value) return
    const query = {
        ...route.query,
        [newFilterField.value]: newFilterValue.value,
    }
    router.replace({ query })
    newFilterField.value = null
    newFilterValue.value = null
}

function removeFilter(key: string) {
    const query = { ...route.query }
    delete (query as Record<string, unknown>)[key]
    router.replace({ query })
}
</script>
