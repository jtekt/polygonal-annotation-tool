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
        :options.sync="options"
        :server-items-length="item_count"
        @click:row="$router.push({name: 'annotate', params: {document_id: $event._id}})">


        <!-- Thumbnails -->
        <template v-slot:item.image="{ item }">
          <v-img contain max-height="100" max-width="100"
            :src="`${api_url}/images/${item._id}/image`" alt="item" />
        </template>

        <template v-slot:item.annotation="{ item }">
          <!-- An item can either has not annotation field or an empty annotation array -->

          <v-icon v-if="!item.data[annotation_field]" color="#c00000">mdi-tag-off</v-icon>
          <span v-else-if="item.data[annotation_field].length === 0">Empty set</span>

          <div v-else class="classes_wrapper">
            <v-chip v-for="(summary_item, index) in annotation_summary(item.data[annotation_field])" :key="`${item._id}_${index}`">

              {{summary_item.label}}: {{summary_item.count}}

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
      options: {
        sortBy: ['time']
      },
      loading: false,
      headers: [
        {text: 'Image', value: "image"},
        {text: 'Time', value: "time"},
        {text: 'Annotations', value: 'annotation'}
      ],
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
      dates: [],
      menu: false,
      filter_key: null,
      filter_property: null,
    }
  },
  mounted(){

    this.get_items()
  },
  watch: {
    options: {
      handler () {
        this.get_items()
      },
      deep: true,
    },

  },
  methods: {
    get_items(){

      this.loading = true

      const { page, itemsPerPage, sortBy, sortDesc } = this.options

      const sort = sortBy.reduce((acc, item, index) => {
        acc[item] = sortDesc[index] ? 1 : -1
        return acc
      }, {})


      const params = {
        start_index: (page-1) * itemsPerPage,
        limit: itemsPerPage === -1 ? 0 : itemsPerPage,
        sort,
        filter: {}
      }

      if(this.dates.length > 0) {
        params.filter.time = {}
        if(this.dates[0]) params.filter.time['$gte'] = this.dates[0]
        if(this.dates[1]) params.filter.time['$lt'] = this.dates[1]
      }

      if(this.filter_property && this.filter_key) {
        params.filter[this.filter_key] = this.filter_property
      }

      this.axios.get('/images', {params})
      .then(({data: {total, items}}) => {
        this.items = items
        this.item_count = total
      })
      .catch((error) => {console.error(error)})
      .finally(() => {this.loading = false})
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

  },
  computed: {
    annotation_field() {
      return this.$store.state.annotation_field
    },
  }


}
</script>

<style>
td, th {
  white-space: nowrap;
}
.classes_wrapper {
  display: flex;
  gap: 0.5em;
}
</style>
