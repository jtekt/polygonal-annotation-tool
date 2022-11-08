<template>
  <v-card>

    <v-card-text>

      <v-toolbar flat>
        <v-toolbar-title>Images</v-toolbar-title>
      </v-toolbar>
      <v-divider />





      <v-data-table 
        :loading="loading" 
        :headers="headers" 
        :items="items" 
        :options.sync="tableOptions"
        :server-items-length="item_count"
        @click:row="$router.push({name: 'annotate', params: {document_id: $event._id}})">


        <!-- Thumbnails -->
        <template v-slot:item.file="{ item }">
          <img class="thumbnail" :src="image_src(item)" />
        </template>

        <template v-slot:item.time="{ item }">
          <span>{{format_date(item)}}</span>
        </template>


        <template v-slot:item.annotation="{ item }">
          <!-- An item can either has not annotation field or an empty annotation array -->

          <v-icon v-if="!item.data[annotation_field]" color="#c00000">mdi-tag-off</v-icon>
          <span v-else-if="item.data[annotation_field].length === 0">Empty set</span>

          <div v-else class="classes_wrapper">
            <v-chip v-for="(summary_item, index) in annotation_summary(item.data[annotation_field])" :key="`${item._id}_${index}`">

              {{(summary_item.label &&summary_item.label !== '') ? summary_item.label : 'Unlabeled'}}: {{summary_item.count}}

            </v-chip>
          </div>

        </template>

      </v-data-table>

    </v-card-text>



  </v-card>
</template>

<script>

export default {
  name: 'Collection',

  components: {

  },
  data(){
    return {
      items: [],
      item_count: 0,
      loading: false,
      base_headers: [
        { text: 'Image', value: 'file' },
        { text: 'Time', value: 'time' },
        { text: 'Polygonal Annotations', value: 'annotation'}
      ],
      extra_headers: [],
      dates: [],
      menu: false,
      filter_key: null,
      filter_property: null,
    }
  },
  mounted(){

    this.get_items()
    this.get_fields()

  },
  watch: {
    query: {
      handler () {
        this.get_items()
      },
      deep: true,
    },

  },
  methods: {
    get_items(){

      this.loading = true

      const params = this.query


      this.axios.get('/images', {params})
      .then(({data: {total, items}}) => {
        this.items = items
        this.item_count = total
      })
      .catch((error) => {console.error(error)})
      .finally(() => {this.loading = false})
    },

    get_fields() {
      this.axios.get('/fields')
        .then(({ data }) => {
          this.extra_headers = data.map(f => ({ text: f, value: `data.${f}` }))
        })
        .catch((error) => {
          console.error(error)
        })
    },

    format_date({ time }) {
      const date = new Date(time)
      return date.toLocaleString('Ja-JP')
    },



    annotation_summary(annotation){
      const summary = annotation.reduce((acc, item) => {
        let found = acc.find(x => x.label === item.label)
        if(!found) {
          found =  {label: item.label, count: 0}
          acc.push(found)
        }
        found.count ++
        return acc
      },[])

      return summary
    },

    image_src({ _id }) {
      return `${process.env.VUE_APP_STORAGE_SERVICE_API_URL}/images/${_id}/image`
    },


  },
  computed: {
    annotation_field() {
      return this.$store.state.annotation_field
    },
    headers() {
      return [
        ...this.base_headers,
        ...this.extra_headers,
      ]
    },
    query() {
      return this.$route.query
    },
    tableOptions: {
      get() {

        const {
          limit = 10,
          sort = 'time',
          order = -1,
          skip = 0,
        } = this.$route.query

        return {
          itemsPerPage: Number(limit),
          sortBy: [sort],
          sortDesc: [order === '-1'],
          page: (skip / limit) + 1
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
        if (JSON.stringify(this.$route.query) !== JSON.stringify(query)) this.$router.push({ query })
      }
    },


  }


}
</script>

<style>
td, th {
  white-space: nowrap;
}

.thumbnail {
  height: 5em;
  width: 5em;
}

.classes_wrapper {
  display: flex;
  gap: 0.5em;
}
</style>
