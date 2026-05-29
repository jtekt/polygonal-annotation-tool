<template>
    <v-card>
        <v-toolbar flat>
            <v-toolbar-title>Images</v-toolbar-title>
            <v-spacer />
            <v-menu :close-on-content-click="true">
                <template v-slot:activator="{ props: menuProps }">
                    <v-btn icon v-bind="menuProps">
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item
                        v-for="(menu, index) in menu_items"
                        :key="index"
                        :prepend-icon="menu.icon"
                        :title="menu.title"
                        @click="handleMenuItemClick(index)"
                    />
                </v-list>
            </v-menu>
        </v-toolbar>
        <v-divider />
        <v-card-text>
            <v-container fluid>
                <QuerySettings :fields="displayed_fields" />
            </v-container>

            <v-data-table-server
                :loading="loading"
                :headers="headers"
                :items="items"
                :items-length="item_count"
                :items-per-page="tableItemsPerPage"
                :items-per-page-options="[
                    { value: 10, title: '10' },
                    { value: 50, title: '50' },
                    { value: 100, title: '100' },
                ]"
                v-model="selected"
                :show-select="allow_select"
                item-value="_id"
                @update:options="handleOptionsUpdate"
                @click:row="handleQueryItemClick"
            >
                <template v-slot:item.file="{ item }">
                    <v-img height="5em" width="5em" contain :src="image_src(item)" />
                </template>

                <template v-slot:item.time="{ item }">
                    <span>{{ format_date(item) }}</span>
                </template>

                <template v-slot:item.annotation="{ item }">
                    <v-icon v-if="item.data[annotation_field] === null || item.data[annotation_field] === undefined" color="#c00000">
                        mdi-tag-off
                    </v-icon>
                    <v-icon
                        v-else-if="!Array.isArray(item.data[annotation_field]) || !(item.data[annotation_field] as Polygon[]).length"
                        color="green"
                    >
                        mdi-tag-check
                    </v-icon>
                    <div v-else class="classes_wrapper">
                        <v-chip
                            v-for="(summary_item, index) in annotation_summary(
                                item.data[annotation_field] as Polygon[]
                            )"
                            :key="`${item._id}_${index}`"
                        >
                            {{
                                summary_item.label && summary_item.label !== ''
                                    ? summary_item.label
                                    : 'Unlabeled'
                            }}: {{ summary_item.count }}
                        </v-chip>
                    </div>
                </template>
            </v-data-table-server>
        </v-card-text>

        <v-snackbar :color="snackbar.color" v-model="snackbar.show">
            {{ snackbar.text }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import QuerySettings from '../components/QuerySettings.vue'
import { ANNOTATION_FIELD } from '@/config'
import axios from '@/axios'
import type { Polygon } from '@/composables/useBaseMode'

const storageApiUrl = import.meta.env.VITE_STORAGE_SERVICE_API_URL
const displayedFieldsEnv = import.meta.env.VITE_DISPLAYED_FIELDS

interface AnnotationItem {
    _id: string
    file: string
    time: string
    data: Record<string, Polygon[] | null | unknown>
}

interface DataTableOptions {
    page: number
    itemsPerPage: number
    sortBy: Array<{ key: string; order: 'asc' | 'desc' }>
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const annotation_field = ANNOTATION_FIELD
const selected = ref<AnnotationItem[]>([])
const allow_select = true
const items = ref<AnnotationItem[]>([])
const item_count = ref(0)
const loading = ref(false)
const fields = ref<string[]>([])
const tableItemsPerPage = ref(10)

const snackbar = ref({ show: false, text: '', color: 'green' })

const query = computed(() => route.query)

const displayed_fields = computed<string[]>(() => {
    const raw = displayedFieldsEnv ? displayedFieldsEnv.split(',') : fields.value
    return raw.filter((f) => f !== annotation_field)
})

const headers = computed(() => {
    const annotationFieldText = `${t('Annotations')} (${annotation_field})`
    return [
        { key: 'file', sortable: false },
        { title: t('Time'), key: 'time' },
        { title: annotationFieldText, key: 'annotation', sortable: false },
        ...displayed_fields.value.map((f) => ({ title: f, key: `data.${f}` })),
    ]
})

const selectedIds = computed(() => selected.value.map((item) => item._id))

const menu_items = computed(() => [
    {
        title:
            selected.value.length > 0
                ? 'Mark selected item(s) as unannotated'
                : 'Mark all as unannotated',
        icon: 'mdi-tag-off',
    },
    {
        title:
            selected.value.length > 0
                ? "Set selected item(s)' annotation to an empty set"
                : 'Set all annotations to empty set',
        icon: 'mdi-tag-check',
    },
])

watch(query, () => get_items(), { deep: true })

onMounted(() => {
    get_items()
    if (!displayedFieldsEnv) get_fields()
})

function get_items() {
    loading.value = true
    const params = query.value
    axios
        .get('/images', { params })
        .then(({ data: { total, items: newItems } }) => {
            items.value = Array.isArray(newItems) ? newItems : []
            item_count.value = total ?? 0
        })
        .catch(console.error)
        .finally(() => {
            loading.value = false
            selected.value = []
        })
}

function get_fields() {
    axios
        .get('/fields')
        .then(({ data }) => {
            fields.value = data
        })
        .catch(console.error)
}

function format_date(item: AnnotationItem) {
    return new Date(item.time).toLocaleString('ja-JP')
}

function annotation_summary(annotation: Polygon[]) {
    if (!Array.isArray(annotation)) return []
    return annotation.reduce<Array<{ label: string | undefined; count: number }>>(
        (acc, item) => {
            let found = acc.find((x) => x.label === item.label)
            if (!found) {
                found = { label: item.label, count: 0 }
                acc.push(found)
            }
            found.count++
            return acc
        },
        []
    )
}

function image_src(item: AnnotationItem) {
    return `${storageApiUrl}/images/${item._id}/image`
}

function handleMenuItemClick(index: number) {
    if (index === 0) unannotate_all_items()
    else if (index === 1) annotate_all_items()
}

function handleQueryItemClick(_event: MouseEvent, row: { item: AnnotationItem; index: number }) {
    const document_id = row.item._id
    const { skip = 0, limit = 50, sort = 'time', order = 1, ...rest } = query.value
    const cursor = Number(skip) + Number(row.index)
    router.push({
        name: 'annotate',
        params: { document_id },
        query: { ...rest, skip, limit, sort, order, cursor },
    })
}

function handleOptionsUpdate(options: DataTableOptions) {
    const { itemsPerPage, page, sortBy } = options
    tableItemsPerPage.value = itemsPerPage
    const sort = sortBy[0]?.key ?? 'time'
    const order = sortBy[0]?.order === 'desc' ? '-1' : '1'
    const params = {
        limit: String(itemsPerPage),
        skip: String((page - 1) * itemsPerPage),
        order,
        sort,
    }
    const newQuery = { ...route.query, ...params }
    if (JSON.stringify(route.query) !== JSON.stringify(newQuery))
        router.replace({ query: newQuery })
}

function annotate_all_items() {
    let msg = `Are you sure you want to set the annotation for all ${item_count.value} items to an empty set?`
    if (selected.value.length > 0)
        msg = `Are you sure you want to set the annotation for all ${selected.value.length} selected items to an empty set?`
    if (!confirm(msg)) return
    save_bulk_annotation({ [annotation_field]: [] })
}

function unannotate_all_items() {
    let msg = `Mark all ${item_count.value} items unannotated?`
    if (selected.value.length > 0)
        msg = `Mark all selected ${selected.value.length} items unannotated?`
    if (!confirm(msg)) return
    save_bulk_annotation({ [annotation_field]: null })
}

function save_bulk_annotation(body: Record<string, unknown>) {
    let params: Record<string, unknown> = { ...query.value }
    if (selected.value.length > 0) params = { ...params, ids: selectedIds.value }
    loading.value = true
    axios
        .patch('/images', body, { params })
        .then(() => {
            snackbar.value = { show: true, text: 'Items annotation successful', color: 'green' }
            get_items()
        })
        .catch((error) => {
            if (error.response) console.error(error.response.data)
            else console.error(error)
            snackbar.value = { show: true, text: 'Error, see console for details', color: '#c00000' }
        })
        .finally(() => {
            loading.value = false
        })
}
</script>

<style>
td,
th {
    white-space: nowrap;
}

.classes_wrapper {
    display: flex;
    gap: 0.5em;
}
</style>
