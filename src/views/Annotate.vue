<template>
    <div>
        <v-toolbar>
            <!-- Polygon editor controls -->
            <v-btn-toggle v-model="mode_index" borderless group mandatory>
                <v-btn icon>
                    <v-icon>mdi-vector-polygon</v-icon>
                </v-btn>

                <v-btn icon>
                    <v-icon>mdi-vector-rectangle</v-icon>
                </v-btn>

                <v-btn icon v-if="polylineEnabled">
                    <v-icon>mdi-vector-polyline</v-icon>
                </v-btn>

                <v-btn icon v-if="brushEnabled">
                    <v-icon>mdi-brush</v-icon>
                </v-btn>
            </v-btn-toggle>

            <!-- This is wrong -->
            <v-slider
                class="mt-6"
                v-if="mode_lookup[mode_index] === 'brush'"
                v-model="brushThickness"
                step="1"
                :thumb-label="true"
                thumb-size="24"
            />

            <v-spacer />

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        :color="grayscale ? 'primary' : 'default'"
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="toggleGrayscale"
                    >
                        <v-icon>mdi-scale</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">{{ $t('Gray Scale') }}</div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        :color="sampleMode ? 'primary' : 'default'"
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="toggleSampleMode"
                    >
                        <v-icon>mdi-eyedropper</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">{{ $t('Sample Color') }}</div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        color="#c00000"
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="unannotate()"
                    >
                        <v-icon>mdi-tag-off</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">{{ $t('Mark as unannotated') }}</div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        color="green"
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="save_annotations()"
                    >
                        <v-icon>mdi-tag-check</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>{{ $t('Save annotations') }}</div>
                    <div>(Ctrl + S)</div>
                </div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="toggle_annotations()"
                    >
                        <v-icon v-if="showAnnotations">mdi-eye</v-icon>
                        <v-icon v-else>mdi-eye-off</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>{{ $t('Hide annotations') }}</div>
                    <div>(Ctrl + H)</div>
                </div>
            </v-tooltip>

            <v-divider vertical />

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="get_previous_item()"
                    >
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Previous item by time</div>
                    <div>(earlier ←)</div>
                </div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="get_next_item()"
                    >
                        <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Next item by time</div>
                    <div>(later →)</div>
                </div>
            </v-tooltip>

            <v-divider vertical />

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="fullscreen = !fullscreen"
                    >
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
            <v-col class="mt-10" cols="auto" style="color: #c00000">
                Image not found
            </v-col>
        </v-row>

        <v-row v-else class="mt-2">
            <v-col cols="12" :lg="fullscreen ? 12 : 6">
                <v-card
                    class="image_wrapper"
                    :style="{ cursor: sampleMode ? 'crosshair' : 'auto' }"
                >
                    <!-- This wrapper gets the same size as the img -->
                    <!-- The actual image -->
                    <img
                        ref="image"
                        draggable="false"
                        :src="image_src"
                        crossorigin="anonymous"
                        @load="getImageSize()"
                        @click="onImageClick"
                        :style="{
                            filter: grayscale ? 'grayscale(100%)' : 'none',
                        }"
                    />

                    <div
                        class="helper_rectangle"
                        :style="helper_rectangle_style"
                    />
                    <!-- The polygon editing tool -->
                    <PolygonEditor
                        v-show="showAnnotations"
                        @polygonCreated="polygonCreated()"
                        v-model="item.data[annotation_field]"
                        :width="image.naturalWidth"
                        :height="image.naturalHeight"
                        :mode="mode_lookup[mode_index]"
                        :selected_polygon_index.sync="selected_annotation"
                        :brushThickness="brushThickness"
                        :disable-events="sampleMode || !showAnnotations"
                    />
                </v-card>
            </v-col>
            <v-col>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-title
                                >{{ $t('Annotations') }} ({{
                                    annotation_field
                                }})</v-card-title
                            >
                            <v-card-text>
                                <div
                                    class="text-center my-5"
                                    style="color: #c00000"
                                    v-if="!item.data[annotation_field]"
                                >
                                    <v-icon left color="#c00000"
                                        >mdi-tag-off</v-icon
                                    >
                                    <span>{{ $t('Not annotated yet') }}</span>
                                </div>

                                <v-data-table
                                    v-else
                                    hide-default-footer
                                    :itemsPerPage="-1"
                                    :loading="loading"
                                    :items="item.data[annotation_field]"
                                    :headers="headers"
                                    disable-sort
                                >
                                    <template v-slot:item="row">
                                        <tr
                                            :style="{
                                                'background-color':
                                                    selected_annotation ===
                                                    row.index
                                                        ? '#c0000044'
                                                        : '',
                                                cursor: 'pointer',
                                            }"
                                            @click="
                                                selected_annotation = row.index
                                            "
                                        >
                                            <td>
                                                <v-combobox
                                                    v-model="row.item.label"
                                                    :items="labels"
                                                />
                                            </td>

                                            <td>
                                                <v-icon
                                                    @click="
                                                        delete_single_annotation(
                                                            row.index
                                                        )
                                                    "
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
                            <v-card-title>
                                {{ $t('Image metadata') }}
                            </v-card-title>

                            <v-list>
                                <v-list-item two-line>
                                    <v-list-item-content>
                                        <v-list-item-subtitle>
                                            {{ $t('File') }}
                                        </v-list-item-subtitle>
                                        <v-list-item-title>{{
                                            item.file
                                        }}</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                                <v-list-item two-line>
                                    <v-list-item-content>
                                        <v-list-item-subtitle>
                                            {{ $t('Time') }}
                                        </v-list-item-subtitle>
                                        <v-list-item-title>{{
                                            item.time
                                        }}</v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>

                                <v-list-item
                                    v-for="(key, index) of displayed_fields"
                                    :key="index"
                                    two-line
                                >
                                    <v-list-item-content>
                                        <v-list-item-subtitle>{{
                                            key
                                        }}</v-list-item-subtitle>
                                        <v-list-item-title>
                                            <pre>{{ item.data[key] }}</pre>
                                        </v-list-item-title>
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list>

                            <v-expansion-panels
                                flat
                                v-if="hidden_fields.length"
                            >
                                <v-expansion-panel>
                                    <v-expansion-panel-header>
                                        <span>
                                            <v-icon left
                                                >mdi-dots-horizontal</v-icon
                                            >
                                            <span>See more</span>
                                        </span>
                                    </v-expansion-panel-header>
                                    <v-expansion-panel-content>
                                        <v-list>
                                            <v-list-item
                                                v-for="(
                                                    key, index
                                                ) of hidden_fields"
                                                :key="index"
                                                two-line
                                            >
                                                <v-list-item-content>
                                                    <v-list-item-subtitle>{{
                                                        key
                                                    }}</v-list-item-subtitle>
                                                    <v-list-item-title>
                                                        <pre>{{
                                                            item.data[key]
                                                        }}</pre>
                                                    </v-list-item-title>
                                                </v-list-item-content>
                                            </v-list-item>
                                        </v-list>
                                    </v-expansion-panel-content>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </v-card>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-snackbar :color="snackbar.color" v-model="snackbar.show">
            {{ snackbar.text }}

            <template v-slot:action="{ attrs }">
                <v-btn dark text v-bind="attrs" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script>
import PolygonEditor from '@/components/PolygonEditor.vue'
import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'
import { ANNOTATION_FIELD } from '../config'
const {
    VUE_APP_DISPLAYED_FIELDS,
    VUE_APP_STORAGE_SERVICE_API_URL,
    VUE_APP_HELPER_RECTANGLE,
    VUE_APP_DEFAULT_LABEL,
    VUE_APP_ENABLE_BRUSH,
    VUE_APP_ENABLE_POLYLINE,
} = process.env

export default {
    name: 'Annotate',
    components: {
        PolygonEditor,
        KeyboardShortcuts,
    },
    data() {
        return {
            loading: false,
            fullscreen: false,
            item: null,

            // used to keep track of unsaved changes
            unmodified_item_copy: null,

            polylineEnabled: !!VUE_APP_ENABLE_POLYLINE,
            brushEnabled: !!VUE_APP_ENABLE_BRUSH,
            brushThickness: 5,

            grayscale: false,
            sampleMode: false,

            headers: [
                // { text: "ID", value: "index" },
                { text: 'Label / Class', value: 'label' },
                { text: 'Delete', value: 'actions' },
            ],

            image: {
                naturalWidth: 800,
                naturalHeight: 600,
            },

            showAnnotations: true,

            selected_annotation: -1,

            mode_index: 0,
            mode_lookup: ['polygon', 'rectangle'],

            labels: process.env.VUE_APP_LABELS.split(','),

            snackbar: {
                show: false,
                text: '',
                color: 'green',
            },
        }
    },
    watch: {
        document_id() {
            this.get_item_by_id()
        },
    },
    mounted() {
        this.get_item_by_id()
        if (this.polylineEnabled) this.mode_lookup.push('polyline')
        if (this.brushEnabled) this.mode_lookup.push('brush')

        // Listen to keyboard events for key shortcuts
        document.addEventListener('keydown', this.handle_keydown)
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handle_keydown)
    },
    methods: {
        toggleGrayscale() {
            this.grayscale = !this.grayscale
        },
        toggleSampleMode() {
            this.sampleMode = !this.sampleMode
        },
        onImageClick(event) {
            if (!this.sampleMode) return
            const img = this.$refs.image
            if (!img || !img.naturalWidth || !img.naturalHeight) return
            const rect = img.getBoundingClientRect()
            const scaleX = img.naturalWidth / img.offsetWidth
            const scaleY = img.naturalHeight / img.offsetHeight
            const x = Math.floor((event.clientX - rect.left) * scaleX)
            const y = Math.floor((event.clientY - rect.top) * scaleY)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            ctx.drawImage(img, 0, 0)
            const pixel = ctx.getImageData(x, y, 1, 1)
            const data = pixel.data
            const r = data[0]
            const g = data[1]
            const b = data[2]

            this.snackbar.show = true
            this.snackbar.text = `RGB(${r}, ${g}, ${b})`
            this.snackbar.color = `rgb(${r},${g},${b})`
        },
        unannotate() {
            // Completely remove the annotation field, marking the item as not annotated yet
            if (!this.item.data[this.annotation_field]) return
            if (!confirm('Mark the item unannotated?')) return

            this.$set(this.item.data, this.annotation_field, null)
            this.save_item()
        },
        empty_annotations() {
            // Empty the annotation array but keep the field
            // Might not be used
            if (
                this.item.data[this.annotation_field] &&
                this.item.data[this.annotation_field].length &&
                !confirm('ホンマ？')
            )
                return

            this.$set(this.item.data, this.annotation_field, [])
        },
        save_annotations() {
            this.create_annotation_array_not_exists()
            this.save_item()
        },

        get_item_by_id() {
            this.loading = true
            this.axios
                .get(`/images/${this.document_id}`)
                .then(({ data }) => {
                    this.item = data
                    this.save_item_copy()
                })
                .catch((error) => {
                    this.error = true
                    if (error.response) console.error(error.response.data)
                    else console.error(error)
                })
                .finally(() => (this.loading = false))
        },

        get_items_with_options(options, nextQuery) {
            // This function simply navigates to the next item
            // The item itself is obtained with get_item_by_id
            if (
                this.item_has_unsaved_modifications &&
                !confirm('Item has modifications, discard?')
            )
                return
            if (this.loading) return

            this.loading = true
            this.axios
                .get(`/images`, options)
                .then(({ data: { items } }) => {
                    if (items.length === 0) {
                        this.snackbar.show = true
                        this.snackbar.text = 'No more items'
                        this.snackbar.color = 'orange'
                        return
                    }
                    const item = items[0]
                    // Prevent reloading current route
                    if (this.document_id !== item._id) {
                        this.$router.push({
                            name: 'annotate',
                            params: { document_id: item._id },
                            query: {
                                ...this.$route.query,
                                ...(nextQuery || {}),
                            }, // update cursor
                        })
                    }
                })
                .catch((error) => {
                    this.error = true
                    if (error.response) {
                        console.error(error.response.data)
                    } else {
                        console.error(error)
                    }
                    this.snackbar.show = true
                    this.snackbar.text = 'Error loading next/previous item'
                    this.snackbar.color = '#c00000'
                })
                .finally(() => (this.loading = false))
        },

        get_next_item() {
            const { sort = 'time', order = 1, ...rest } = this.query
            const cursor = Number(this.$route.query.cursor || 0) + 1

            const params = {
                ...rest,
                sort,
                order,
                skip: cursor, // fetch the item at the next global index
                limit: 1,
            }

            // Remove the cursor from the options
            delete params.cursor

            this.get_items_with_options({ params }, { cursor })
        },

        get_previous_item() {
            const { sort = 'time', order = 1, ...rest } = this.query
            const currentCursor = Number(this.$route.query.cursor || 0)

            if (currentCursor === 0) {
                this.snackbar.show = true
                this.snackbar.text = 'No previous items'
                this.snackbar.color = 'orange'
                return
            }

            const cursor = Math.max(0, currentCursor - 1)

            if (cursor < 0) {
                this.snackbar.show = true
                this.snackbar.text = 'Error, cursor not set correctly'
                this.snackbar.color = '#c00000'
                return
            }

            const params = {
                ...rest,
                sort,
                order,
                skip: cursor, // fetch the item at the previous global index
                limit: 1,
            }

            // Remove the cursor from the options
            delete params.cursor

            this.get_items_with_options({ params }, { cursor })
        },

        create_annotation_array_not_exists() {
            // If the item has not been annotated yet. the annotation property must be created as an array
            // Note the usage of $set for reactivity
            if (!this.item.data) this.$set(this.item, 'data', {})
            if (!this.item.data[this.annotation_field])
                this.$set(this.item.data, this.annotation_field, [])
        },

        get_copy_of_item(object) {
            return JSON.parse(JSON.stringify(object))
        },

        save_item_copy() {
            this.unmodified_item_copy = this.get_copy_of_item(this.item)
        },

        save_item() {
            const annotations = this.item.data[this.annotation_field]

            for (let i = 0; i < annotations.length; i++) {
                const element = annotations[i]

                if (element.open) {
                    this.snackbar.show = true
                    this.snackbar.text = `Annotation ${element.label} is still open`
                    this.snackbar.color = '#c00000'
                    return
                }

                // Validate if it has enough points
                if (element.points.length < 3) {
                    this.snackbar.show = true
                    this.snackbar.text = `Annotation ${element.label} has not enough points`
                    this.snackbar.color = '#c00000'
                    return
                }
            }

            const route = `/images/${this.document_id}`
            const body = {
                [this.annotation_field]: this.item.data[this.annotation_field],
            }

            const { current_user } = this.$store.state
            // WARNING: This uses a fixed field
            if (current_user)
                body.annotator_id =
                    current_user._id || current_user.properties._id

            this.axios
                .patch(route, body)
                .then(() => {
                    this.snackbar.show = true
                    this.snackbar.text = 'Item saved successful'
                    this.snackbar.color = 'green'
                    this.save_item_copy()
                })
                .catch((error) => {
                    this.error = true
                    if (error.response) console.error(error.response.data)
                    else console.error(error)
                    this.snackbar.show = true
                    this.snackbar.text = 'Error, see console for details'
                    this.snackbar.color = '#c00000'
                })
        },

        toggle_annotations() {
            this.showAnnotations = !this.showAnnotations
        },

        getImageSize() {
            // Provide image size to editor when loaded
            // const {width, height} = this.$refs.image
            if (!this.$refs.image) return
            const { naturalWidth, naturalHeight } = this.$refs.image
            this.image.naturalWidth = naturalWidth
            this.image.naturalHeight = naturalHeight
        },

        handle_keydown(e) {
            // Keyboard events

            // Ctrl S
            if (e.key === 's' && e.ctrlKey) {
                e.preventDefault()
                this.save_annotations()
            }
            // Ctrl a
            else if (e.key === 'a' && e.ctrlKey) {
                e.preventDefault()
                this.empty_annotations()
            }
            // Ctrl h
            else if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault()
                this.toggle_annotations()
            }
            // Left arrow key: previous item
            else if (e.keyCode === 37) {
                e.preventDefault()
                this.get_previous_item()
            }
            // Right arrow key: next item
            else if (e.keyCode === 39) {
                e.preventDefault()
                this.get_next_item()
            }
            // Esc key: Reset
            else if (e.key === 'Escape') {
                e.preventDefault()

                // Reset sampleMode
                this.sampleMode = false
            }
        },
        delete_single_annotation(index) {
            if (!confirm(`Delete polygon ${index}?`)) return
            this.item.data[this.annotation_field].splice(index, 1)
            this.selected_annotation = -1
        },
        object_equals(x, y) {
            return JSON.stringify(x) !== JSON.stringify(y)
        },
        format_metadata(data) {
            try {
                return JSON.stringify(data, null, 2)
            } catch (error) {
                console.warn(error)
                return data
            }
        },
        polygonCreated() {
            // Assign default label
            const lastItem =
                this.item.data[this.annotation_field][
                    this.item.data[this.annotation_field].length - 1
                ]
            lastItem.label = VUE_APP_DEFAULT_LABEL
        },
    },
    computed: {
        annotation_field() {
            return ANNOTATION_FIELD
        },
        document_id() {
            return this.$route.params.document_id
        },
        image_src() {
            return `${VUE_APP_STORAGE_SERVICE_API_URL}/images/${this.document_id}/image`
        },
        item_has_unsaved_modifications() {
            if (!this.item) return false
            if (!this.unmodified_item_copy) return false
            return this.object_equals(this.item, this.unmodified_item_copy)
        },
        query() {
            return this.$route.query
        },
        displayed_fields() {
            if (VUE_APP_DISPLAYED_FIELDS)
                return VUE_APP_DISPLAYED_FIELDS.split(',')
            return Object.keys(this.item.data)
        },
        hidden_fields() {
            return Object.keys(this.item.data).filter(
                (field) => !this.displayed_fields.includes(field)
            )
        },
        helper_rectangle_style() {
            if (!VUE_APP_HELPER_RECTANGLE) return { display: 'none' }
            const [x, y, w, h] = VUE_APP_HELPER_RECTANGLE.split(',')
            return {
                left: `${(100 * x) / this.image.naturalWidth}%`,
                top: `${(100 * y) / this.image.naturalWidth}%`,
                width: `${(100 * w) / this.image.naturalHeight}%`,
                height: `${(100 * h) / this.image.naturalHeight}%`,
            }
        },
    },
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

tr.selected {
    background-color: #c0000044;
}

.helper_rectangle {
    position: absolute;
    border: 1px dashed green;
}
</style>
