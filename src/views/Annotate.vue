<template>
    <div>
        <v-toolbar>
            <v-btn-toggle v-model="mode_index" group mandatory>
                <v-btn :value="0" icon>
                    <v-icon>mdi-vector-polygon</v-icon>
                </v-btn>
                <v-btn :value="1" icon>
                    <v-icon>mdi-vector-rectangle</v-icon>
                </v-btn>
                <v-btn v-if="polylineEnabled" :value="2" icon>
                    <v-icon>mdi-vector-polyline</v-icon>
                </v-btn>
                <v-btn v-if="brushEnabled" :value="polylineEnabled ? 3 : 2" icon>
                    <v-icon>mdi-brush</v-icon>
                </v-btn>
                <v-btn v-if="brushEnabled" :value="polylineEnabled ? 4 : 3" icon>
                    <v-icon>mdi-eraser</v-icon>
                </v-btn>
            </v-btn-toggle>

            <v-slider
                v-if="mode_lookup[mode_index] === 'brush' || mode_lookup[mode_index] === 'eraser'"
                class="mt-6"
                v-model="brushThickness"
                step="1"
                thumb-label
                :thumb-size="24"
            />

            <v-spacer />

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn
                        :color="grayscale ? 'primary' : undefined"
                        icon
                        v-bind="props"
                        @click="grayscale = !grayscale"
                    >
                        <v-icon>mdi-scale</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">{{ $t('Gray Scale') }}</div>
            </v-tooltip>

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" @click="showAnnotations = !showAnnotations">
                        <v-icon v-if="showAnnotations">mdi-eye</v-icon>
                        <v-icon v-else>mdi-eye-off</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>{{ $t('Hide annotations') }}</div>
                    <div>(Ctrl + H)</div>
                </div>
            </v-tooltip>

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn color="#c00000" icon v-bind="props" @click="unannotate">
                        <v-icon>mdi-tag-off</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">{{ $t('Mark as unannotated') }}</div>
            </v-tooltip>

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn color="green" icon v-bind="props" @click="save_annotations">
                        <v-icon>mdi-tag-check</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>{{ $t('Save annotations') }}</div>
                    <div>(Ctrl + S)</div>
                </div>
            </v-tooltip>

            <v-divider vertical />

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" @click="get_previous_item">
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Previous item by time</div>
                    <div>(earlier ←)</div>
                </div>
            </v-tooltip>

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" @click="get_next_item">
                        <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Next item by time</div>
                    <div>(later →)</div>
                </div>
            </v-tooltip>

            <v-divider vertical />

            <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                    <v-btn icon v-bind="props" @click="fullscreen = !fullscreen">
                        <v-icon v-if="fullscreen">mdi-fullscreen-exit</v-icon>
                        <v-icon v-else>mdi-fullscreen</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">Full screen</div>
            </v-tooltip>

            <v-divider vertical />
            <KeyboardShortcuts />
        </v-toolbar>
        <v-divider />

        <v-row v-if="loading" justify="center">
            <v-col class="mt-10" cols="auto">
                <v-progress-circular indeterminate size="46" />
            </v-col>
        </v-row>

        <v-row v-else-if="!item" justify="center">
            <v-col class="mt-10" cols="auto" style="color: #c00000">Image not found</v-col>
        </v-row>

        <v-row v-else class="mt-2">
            <v-col cols="12" :lg="fullscreen ? 12 : 6">
                <v-card class="image_wrapper">
                    <img
                        ref="imageEl"
                        draggable="false"
                        :src="image_src"
                        crossorigin="anonymous"
                        @load="getImageSize"
                        :style="{ filter: grayscale ? 'grayscale(100%)' : 'none' }"
                    />
                    <div class="helper_rectangle" :style="helper_rectangle_style" />
                    <PolygonEditor
                        v-show="showAnnotations"
                        @polygonCreated="polygonCreated"
                        :modelValue="(item.data[annotation_field] as Polygon[])"
                        @update:modelValue="item!.data[annotation_field] = $event"
                        :width="imageSize.naturalWidth"
                        :height="imageSize.naturalHeight"
                        :mode="mode_lookup[mode_index]"
                        v-model:selectedPolygonIndex="selected_annotation"
                        :brushThickness="brushThickness"
                        :disable-events="!showAnnotations"
                    />
                </v-card>
            </v-col>

            <v-col>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-title>
                                {{ $t('Annotations') }} ({{ annotation_field }})
                            </v-card-title>
                            <v-card-text>
                                <div
                                    class="text-center my-5"
                                    style="color: #c00000"
                                    v-if="!item.data[annotation_field]"
                                >
                                    <v-icon left color="#c00000">mdi-tag-off</v-icon>
                                    <span>{{ $t('Not annotated yet') }}</span>
                                </div>

                                <v-data-table
                                    v-else-if="Array.isArray(item.data[annotation_field])"
                                    hide-default-footer
                                    :items-per-page="-1"
                                    :loading="loading"
                                    :items="(item.data[annotation_field] as Polygon[])"
                                    :headers="annotationHeaders"
                                    disable-sort
                                >
                                    <template v-slot:item="{ item: ann, index }">
                                        <tr
                                            :style="{
                                                'background-color':
                                                    selected_annotation === index
                                                        ? '#c0000044'
                                                        : '',
                                                cursor: 'pointer',
                                            }"
                                            @click="
                                                selected_annotation =
                                                    selected_annotation === index ? -1 : index
                                            "
                                        >
                                            <td>
                                                <v-combobox
                                                    v-model="ann.label"
                                                    :items="labels"
                                                />
                                            </td>
                                            <td>
                                                <v-icon
                                                    @click.stop="delete_single_annotation(index)"
                                                >
                                                    mdi-delete
                                                </v-icon>
                                            </td>
                                        </tr>
                                    </template>
                                </v-data-table>
                            </v-card-text>
                        </v-card>
                    </v-col>

                    <v-col>
                        <v-card>
                            <v-card-title>{{ $t('Image metadata') }}</v-card-title>
                            <v-list>
                                <v-list-item lines="two">
                                    <v-list-item-subtitle>{{ $t('File') }}</v-list-item-subtitle>
                                    <v-list-item-title>{{ item.file }}</v-list-item-title>
                                </v-list-item>
                                <v-list-item lines="two">
                                    <v-list-item-subtitle>{{ $t('Time') }}</v-list-item-subtitle>
                                    <v-list-item-title>{{ item.time }}</v-list-item-title>
                                </v-list-item>
                                <v-list-item
                                    v-for="(key, index) of displayed_fields"
                                    :key="index"
                                    lines="two"
                                >
                                    <v-list-item-subtitle>{{ key }}</v-list-item-subtitle>
                                    <v-list-item-title>
                                        <pre>{{ item.data[key] }}</pre>
                                    </v-list-item-title>
                                </v-list-item>
                            </v-list>

                            <v-expansion-panels v-if="hidden_fields.length" variant="accordion">
                                <v-expansion-panel>
                                    <v-expansion-panel-title>
                                        <v-icon>mdi-dots-horizontal</v-icon>
                                        <span>See more</span>
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text>
                                        <v-list>
                                            <v-list-item
                                                v-for="(key, index) of hidden_fields"
                                                :key="index"
                                                lines="two"
                                            >
                                                <v-list-item-subtitle>{{ key }}</v-list-item-subtitle>
                                                <v-list-item-title>
                                                    <pre>{{ item.data[key] }}</pre>
                                                </v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </v-card>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-snackbar :color="snackbar.color" v-model="snackbar.show">
            {{ snackbar.text }}
            <template v-slot:actions>
                <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PolygonEditor from '@/components/PolygonEditor.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { ANNOTATION_FIELD } from '@/config'
import { useAppStore } from '@/store'
import axios from '@/axios'
import type { Polygon } from '@/composables/useBaseMode'

const storageApiUrl = import.meta.env.VITE_STORAGE_SERVICE_API_URL
const displayedFieldsEnv = import.meta.env.VITE_DISPLAYED_FIELDS
const helperRectangle = import.meta.env.VITE_HELPER_RECTANGLE
const defaultLabel = import.meta.env.VITE_DEFAULT_LABEL
const polylineEnabled = !!import.meta.env.VITE_ENABLE_POLYLINE
const brushEnabled = !!import.meta.env.VITE_ENABLE_BRUSH

interface AnnotationItem {
    _id: string
    file: string
    time: string
    data: Record<string, Polygon[] | null | unknown>
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useAppStore()

const annotation_field = ANNOTATION_FIELD
const loading = ref(false)
const fullscreen = ref(false)
const item = ref<AnnotationItem | null>(null)
const unmodified_item_copy = ref<AnnotationItem | null>(null)
const grayscale = ref(false)
const showAnnotations = ref(true)
const selected_annotation = ref(-1)
const brushThickness = ref(5)
const imageEl = ref<HTMLImageElement | null>(null)
const imageSize = ref({ naturalWidth: 800, naturalHeight: 600 })
const mode_index = ref(0)
const snackbar = ref({ show: false, text: '', color: 'green' })

const labels = (import.meta.env.VITE_LABELS || '').split(',')

const mode_lookup = computed(() => {
    const modes = ['polygon', 'rectangle']
    if (polylineEnabled) modes.push('polyline')
    if (brushEnabled) { modes.push('brush'); modes.push('eraser') }
    return modes
})

const annotationHeaders = [
    { title: 'Label / Class', key: 'label' },
    { title: 'Delete', key: 'actions', sortable: false },
]

const document_id = computed(() => route.params.document_id as string)

const image_src = computed(
    () => `${storageApiUrl}/images/${document_id.value}/image`
)

const query = computed(() => route.query)

const displayed_fields = computed<string[]>(() => {
    if (displayedFieldsEnv) return displayedFieldsEnv.split(',')
    if (!item.value) return []
    return Object.keys(item.value.data)
})

const hidden_fields = computed(() => {
    if (!item.value) return []
    return Object.keys(item.value.data).filter(
        (f) => !displayed_fields.value.includes(f)
    )
})

const item_has_unsaved_modifications = computed(() => {
    if (!item.value || !unmodified_item_copy.value) return false
    return JSON.stringify(item.value) !== JSON.stringify(unmodified_item_copy.value)
})

const helper_rectangle_style = computed(() => {
    if (!helperRectangle) return { display: 'none' }
    const [x, y, w, h] = helperRectangle.split(',')
    return {
        left: `${(100 * Number(x)) / imageSize.value.naturalWidth}%`,
        top: `${(100 * Number(y)) / imageSize.value.naturalWidth}%`,
        width: `${(100 * Number(w)) / imageSize.value.naturalHeight}%`,
        height: `${(100 * Number(h)) / imageSize.value.naturalHeight}%`,
    }
})

watch(document_id, () => get_item_by_id())

onMounted(() => {
    get_item_by_id()
    document.addEventListener('keydown', handle_keydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handle_keydown)
})

function getImageSize() {
    if (!imageEl.value) return
    imageSize.value.naturalWidth = imageEl.value.naturalWidth
    imageSize.value.naturalHeight = imageEl.value.naturalHeight
}

function get_item_by_id() {
    loading.value = true
    axios
        .get(`/images/${document_id.value}`)
        .then(({ data }) => {
            item.value = data
            unmodified_item_copy.value = JSON.parse(JSON.stringify(data))
        })
        .catch(console.error)
        .finally(() => (loading.value = false))
}

function get_items_with_options(
    options: { params: Record<string, unknown> },
    nextQuery?: Record<string, unknown>
) {
    if (item_has_unsaved_modifications.value && !confirm('Item has modifications, discard?'))
        return
    if (loading.value) return

    loading.value = true
    axios
        .get('/images', options)
        .then(({ data: { items } }) => {
            if (!items.length) {
                snackbar.value = { show: true, text: 'No more items', color: 'orange' }
                return
            }
            const next = items[0]
            if (document_id.value !== next._id) {
                router.push({
                    name: 'annotate',
                    params: { document_id: next._id },
                    query: { ...route.query, ...(nextQuery ?? {}) } as Record<string, string>,
                })
            }
        })
        .catch((error) => {
            console.error(error.response?.data ?? error)
            snackbar.value = {
                show: true,
                text: 'Error loading next/previous item',
                color: '#c00000',
            }
        })
        .finally(() => (loading.value = false))
}

function get_next_item() {
    const { sort = 'time', order = 1, ...rest } = query.value
    const cursor = Number(route.query.cursor ?? 0) + 1
    const params = { ...rest, sort, order, skip: cursor, limit: 1 }
    delete (params as Record<string, unknown>).cursor
    get_items_with_options({ params }, { cursor })
}

function get_previous_item() {
    const { sort = 'time', order = 1, ...rest } = query.value
    const currentCursor = Number(route.query.cursor ?? 0)
    if (currentCursor === 0) {
        snackbar.value = { show: true, text: 'No previous items', color: 'orange' }
        return
    }
    const cursor = Math.max(0, currentCursor - 1)
    const params = { ...rest, sort, order, skip: cursor, limit: 1 }
    delete (params as Record<string, unknown>).cursor
    get_items_with_options({ params }, { cursor })
}

function unannotate() {
    if (!item.value?.data[annotation_field]) return
    if (!confirm('Mark the item unannotated?')) return
    item.value.data[annotation_field] = null
    save_item()
}

function save_annotations() {
    if (!item.value) return
    if (!item.value.data) item.value.data = {}
    if (!item.value.data[annotation_field]) item.value.data[annotation_field] = []
    save_item()
}

function save_item() {
    if (!item.value) return
    const annotations = item.value.data[annotation_field] as Polygon[] | null
    if (annotations) {
        for (let i = 0; i < annotations.length; i++) {
            const el = annotations[i]
            if (el.open) {
                snackbar.value = {
                    show: true,
                    text: `Annotation ${el.label} is still open`,
                    color: '#c00000',
                }
                return
            }
            if (el.points.length < 3) {
                snackbar.value = {
                    show: true,
                    text: `Annotation ${el.label} has not enough points`,
                    color: '#c00000',
                }
                return
            }
        }
    }

    const body: Record<string, unknown> = {
        [annotation_field]: item.value.data[annotation_field],
    }
    const current_user = store.current_user
    if (current_user)
        body.annotator_id = current_user._id ?? current_user.properties?._id

    axios
        .patch(`/images/${document_id.value}`, body)
        .then(() => {
            snackbar.value = { show: true, text: 'Item saved successful', color: 'green' }
            unmodified_item_copy.value = JSON.parse(JSON.stringify(item.value))
        })
        .catch((error) => {
            console.error(error.response?.data ?? error)
            snackbar.value = { show: true, text: 'Error, see console for details', color: '#c00000' }
        })
}

function delete_single_annotation(index: number) {
    if (!confirm(`Delete polygon ${index}?`)) return
    const annotations = item.value?.data[annotation_field] as Polygon[]
    annotations.splice(index, 1)
    selected_annotation.value = -1
}

function polygonCreated() {
    const annotations = item.value?.data[annotation_field] as Polygon[]
    if (!annotations?.length) return
    annotations[annotations.length - 1].label = defaultLabel
}

function handle_keydown(e: KeyboardEvent) {
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault()
        save_annotations()
    } else if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault()
        showAnnotations.value = !showAnnotations.value
    } else if (e.keyCode === 37) {
        e.preventDefault()
        get_previous_item()
    } else if (e.keyCode === 39) {
        e.preventDefault()
        get_next_item()
    }
}
</script>

<style scoped>
.image_wrapper {
    position: relative;
    display: flex;
}

.image_wrapper img {
    width: 100%;
}

tr {
    transition: background-color 0.25s;
}

.helper_rectangle {
    position: absolute;
    border: 1px dashed green;
}
</style>
