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

            <v-divider vertical />

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="get_previous_item_by_date()"
                    >
                        <v-icon>mdi-arrow-left</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Previous item</div>
                    <div>(←)</div>
                </div>
            </v-tooltip>

            <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                    <v-btn
                        icon
                        v-bind="attrs"
                        v-on="on"
                        @click="get_next_item_by_date()"
                    >
                        <v-icon>mdi-arrow-right</v-icon>
                    </v-btn>
                </template>
                <div class="text-center">
                    <div>Next item</div>
                    <div>(→)</div>
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
            <v-col
                cols="12"
                :lg="fullscreen ? 12 : 6"
                class="image_wrapper_outer"
            >
                <!-- This wrapper gets the same size as the img -->
                <div class="image_wrapper">
                    <!-- The actual image -->
                    <img
                        draggable="false"
                        :src="image_src"
                        ref="image"
                        @load="image_loaded($event)"
                    />

                    <div
                        class="helper_rectangle"
                        :style="helper_rectangle_style"
                    />
                    <!-- The polygon editing tool -->
                    <PolygonEditor
                        @polygonCreated="polygonCreated()"
                        v-model="item.data[annotation_field]"
                        :width="image.width"
                        :height="image.height"
                        :mode="mode_lookup[mode_index]"
                        :selected_polygon_index.sync="selected_annotation"
                        :brushThickness="brushThickness"
                    />
                </div>
            </v-col>
            <v-col>
                <v-row>
                    <v-col>
                        <v-card>
                            <v-card-title>{{ $t('Annotations') }}</v-card-title>
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

            headers: [
                // { text: "ID", value: "index" },
                { text: 'Label / Class', value: 'label' },
                { text: 'Delete', value: 'actions' },
            ],

            image: {
                width: 800,
                height: 600,
            },

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

        get_items_with_options(options) {
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
                        return
                    }

                    const item = items[0]
                    // Prevent reloading current route

                    if (this.document_id !== item._id) {
                        this.$router.push({
                            name: 'annotate',
                            params: { document_id: item._id },
                            query: this.query,
                        })
                    }
                })
                .catch((error) => {
                    this.error = true
                    if (error.response) console.error(error.response.data)
                    else console.error(error)
                })
                .finally(() => (this.loading = false))
        },

        get_next_item_by_date() {
            const params = {
                ...this.query,
                to: this.item.time,
                sort: 'time',
                order: -1,
                limit: 1,
            }

            this.get_items_with_options({ params })
        },
        get_previous_item_by_date() {
            const params = {
                ...this.query,
                from: this.item.time,
                sort: 'time',
                order: 1,
                limit: 1,
            }

            this.get_items_with_options({ params })
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

        image_loaded() {
            // Provide image size to editor when loaded
            // const {width, height} = this.$refs.image
            const { naturalWidth, naturalHeight } = this.$refs.image
            this.image.width = naturalWidth
            this.image.height = naturalHeight
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
            // Left arrow key: previous item
            else if (e.keyCode === 37) {
                e.preventDefault()
                this.get_previous_item_by_date()
            }
            // Right arrow key: next item
            else if (e.keyCode === 39) {
                e.preventDefault()
                this.get_next_item_by_date()
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
            return this.$store.state.annotation_field
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
                left: `${(100 * x) / this.image.width}%`,
                top: `${(100 * y) / this.image.height}%`,
                width: `${(100 * w) / this.image.width}%`,
                height: `${(100 * h) / this.image.height}%`,
            }
        },
    },
}
</script>

<style scoped>
.image_wrapper_outer {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.image_wrapper {
    position: relative;
    display: flex;
}

.image_wrapper > * {
    max-width: 100%;
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
