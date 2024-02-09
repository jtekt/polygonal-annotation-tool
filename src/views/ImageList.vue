<template>
    <v-card>
        <v-toolbar flat>
            <v-toolbar-title>Images</v-toolbar-title>
            <v-spacer />

            <template v-if="allow_select">
                <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            color="#c00000"
                            icon
                            v-bind="attrs"
                            v-on="on"
                            :disabled="selected.length === 0"
                            @click="unannotate_all_items()"
                        >
                            <v-icon>mdi-tag-off</v-icon>
                        </v-btn>
                    </template>
                    <div class="text-center">
                        Mark all selected item as unannotated
                    </div>
                </v-tooltip>

                <v-tooltip bottom>
                    <template v-slot:activator="{ on, attrs }">
                        <v-btn
                            color="green"
                            icon
                            v-bind="attrs"
                            v-on="on"
                            :disabled="selected.length === 0"
                            @click="annotate_all_items()"
                        >
                            <v-icon>mdi-tag-check</v-icon>
                        </v-btn>
                    </template>
                    <div class="text-center">
                        <div>
                            Set all selected items' annotations to an empty set
                        </div>
                    </div>
                </v-tooltip>
                <v-btn outlined color="primary" @click="reset_selection()">
                    Cancel
                </v-btn>
            </template>
            <v-menu :close-on-click="true" :offset-y="true">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </template>

                <v-list>
                    <v-list-item
                        v-for="(menu, index) in menu_items"
                        :key="index"
                        link
                        @click="handleMenuItemClick(index)"
                    >
                        <v-list-item-icon>
                            <v-icon dense :color="menu.color">{{
                                menu.icon
                            }}</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title>{{
                            $t(menu.title)
                        }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-toolbar>
        <v-divider />
        <v-card-text>
            <v-container fluid>
                <QuerySettings :fields="displayed_fields" />
            </v-container>

            <v-data-table
                :loading="loading"
                :headers="headers"
                :items="items"
                :options.sync="tableOptions"
                :server-items-length="item_count"
                :footer-props="footerProps"
                v-model="selected"
                :show-select="allow_select"
                item-key="_id"
                @click:row="
                    $router.push({
                        name: 'annotate',
                        params: { document_id: $event._id },
                    })
                "
            >
                <!-- Thumbnails -->
                <template v-slot:item.file="{ item }">
                    <v-img
                        height="5emc"
                        width="5em"
                        contain
                        :src="image_src(item)"
                    />
                </template>

                <template v-slot:item.time="{ item }">
                    <span>{{ format_date(item) }}</span>
                </template>

                <template v-slot:item.annotation="{ item }">
                    <!-- An item can either has not annotation field or an empty annotation array -->

                    <v-icon v-if="!item.data[annotation_field]" color="#c00000"
                        >mdi-tag-off</v-icon
                    >
                    <span v-else-if="!item.data[annotation_field].length">{{
                        $t('Empty set')
                    }}</span>

                    <div v-else class="classes_wrapper">
                        <v-chip
                            v-for="(summary_item, index) in annotation_summary(
                                item.data[annotation_field]
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
            </v-data-table>
        </v-card-text>

        <v-snackbar :color="snackbar.color" v-model="snackbar.show">
            {{ snackbar.text }}

            <template v-slot:action="{ attrs }">
                <v-btn dark text v-bind="attrs" @click="snackbar.show = false">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-card>
</template>

<script>
import QuerySettings from '../components/QuerySettings.vue'
import { ANNOTATION_FIELD } from '@/config'

const { VUE_APP_STORAGE_SERVICE_API_URL, VUE_APP_DISPLAYED_FIELDS } =
    process.env
export default {
    name: 'Images',

    components: {
        QuerySettings,
    },
    data() {
        return {
            selected: [],
            allow_select: false,
            menu_items: [
                {
                    title: 'Mark as unannotated',
                    icon: 'mdi-tag-off',
                    color: 'red',
                    active: true,
                },
                {
                    title: 'Set annotations to empty set',
                    icon: 'mdi-tag-check',
                    color: 'green',
                    active: true,
                },
                {
                    title: 'Custom selection',
                    icon: 'mdi-format-list-checks',
                    color: 'yellow',
                    active: true,
                },
            ],
            items: [],
            item_count: 0,
            loading: false,
            menu: false,
            fields: [],
            field: null,
            footerProps: { 'items-per-page-options': [10, 50, 100, 500] },

            snackbar: {
                show: false,
                text: '',
                color: 'green',
            },
        }
    },
    mounted() {
        this.get_items_and_fields()
    },

    watch: {
        query: {
            handler() {
                this.get_items()
            },
            deep: true,
        },
    },
    methods: {
        get_items_and_fields() {
            this.get_items()
            if (!VUE_APP_DISPLAYED_FIELDS) this.get_fields()
        },

        get_items() {
            this.loading = true

            const params = this.query

            this.axios
                .get('/images', { params })
                .then(({ data: { total, items } }) => {
                    this.items = items
                    this.item_count = total
                })
                .catch((error) => {
                    console.error(error)
                })
                .finally(() => {
                    this.loading = false
                })
        },

        get_fields() {
            this.axios
                .get('/fields')
                .then(({ data }) => {
                    this.fields = data
                })
                .catch((error) => {
                    console.error(error)
                })
        },

        format_date({ time }) {
            const date = new Date(time)
            return date.toLocaleString('Ja-JP')
        },

        annotation_summary(annotation) {
            const summary = annotation.reduce((acc, item) => {
                let found = acc.find((x) => x.label === item.label)
                if (!found) {
                    found = { label: item.label, count: 0 }
                    acc.push(found)
                }
                found.count++
                return acc
            }, [])

            return summary
        },

        image_src({ _id }) {
            return `${VUE_APP_STORAGE_SERVICE_API_URL}/images/${_id}/image`
        },
        handleMenuItemClick(index) {
            switch (index) {
                case 0:
                    this.unannotate_all_items()
                    break
                case 1:
                    this.annotate_all_items()
                    break
                case 2:
                    this.allow_select = true
                    this.selected = []
                    break
            }
        },
        annotate_all_items() {
            let msg = `Are you sure you want to set the annotation for all ${this.item_count} items to an empty set?`
            if (this.allow_select)
                msg = `Are you sure you want to set the annotation for all ${this.selected.length} selected items to an empty set?`

            if (!confirm(msg)) return
            this.save_bulk_annotation({
                [this.annotation_field]: [],
            })
        },
        unannotate_all_items() {
            let msg = `Mark all ${this.item_count} items unannotated?`
            if (this.allow_select)
                msg = `Mark all selected ${this.selected.length} items unannotated?`

            if (!confirm(msg)) return
            this.save_bulk_annotation({
                [this.annotation_field]: null,
            })
        },
        save_bulk_annotation(body) {
            let params = this.query
            if (this.allow_select) params = { ...params, ids: this.selectedIds }
            this.loading = true
            this.axios
                .patch('/images', body, params)
                .then(() => {
                    this.snackbar.show = true
                    this.snackbar.text = 'Items annotation successful'
                    this.snackbar.color = 'green'
                    this.get_items()
                })
                .catch((error) => {
                    this.error = true
                    if (error.response) console.error(error.response.data)
                    else console.error(error)
                    this.snackbar.show = true
                    this.snackbar.text = 'Error, see console for details'
                    this.snackbar.color = '#c00000'
                })
                .finally(() => {
                    this.loading = false
                    this.reset_selection()
                })
        },
        reset_selection() {
            this.allow_select = false
            this.selected = []
        },
    },
    computed: {
        annotation_field() {
            return ANNOTATION_FIELD
        },
        base_headers() {
            const annotationFieldText = `${this.$t('Annotations')} (${
                this.annotation_field
            })`
            return [
                { value: 'file' },
                { text: this.$t('Time'), value: 'time' },
                {
                    text: annotationFieldText,
                    value: 'annotation',
                },
            ]
        },
        displayed_fields() {
            const fields = VUE_APP_DISPLAYED_FIELDS
                ? VUE_APP_DISPLAYED_FIELDS.split(',')
                : this.fields

            return fields.filter((f) => f !== this.annotation_field)
        },
        headers() {
            return [
                ...this.base_headers,
                ...this.displayed_fields.map((f) => ({
                    text: f,
                    value: `data.${f}`,
                })),
            ]
        },
        query() {
            return this.$route.query
        },
        selectedIds() {
            // Extract _id from selected items
            return this.selected.map((item) => item._id)
        },
        tableOptions: {
            get() {
                const {
                    limit = 10,
                    sort = 'time',
                    order = 1,
                    skip = 0,
                } = this.$route.query

                return {
                    itemsPerPage: Number(limit),
                    sortBy: [sort],
                    sortDesc: [order === '-1'],
                    page: skip / limit + 1,
                }
            },
            set(newVal) {
                const { itemsPerPage, page, sortBy, sortDesc } = newVal
                const params = {
                    limit: String(itemsPerPage),
                    skip: String((page - 1) * itemsPerPage),
                    order: String(sortDesc[0] ? -1 : 1),
                    sort: sortBy[0],
                }
                const query = { ...this.$route.query, ...params }

                // Preventing route duplicates
                if (JSON.stringify(this.$route.query) !== JSON.stringify(query))
                    this.$router.replace({ query })
            },
        },
    },
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
