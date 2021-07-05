<template>
  <v-card>

    <v-card-text>

      <v-toolbar flat>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
              exact
              :to="{name: 'collections'}">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
          </template>
          <span>Return to home</span>
        </v-tooltip>

        <v-toolbar-title>{{collection_name}}</v-toolbar-title>



      </v-toolbar>
      <v-divider/>





      <v-data-table
        :loading="loading"
        :headers="headers"
        :items="items"
        :options.sync="options"
        :server-items-length="item_count"
        @click:row="$router.push({name: 'annotate', params: {document_id: $event._id, collection: collection_name}})">


        <!-- Thumbnails -->
        <template v-slot:item.image="{ item }">
          <v-img
            contain
            max-height="100"
            max-width="100"
            :src="`${api_url}/collections/${collection_name}/images/${item._id}/image`"
            alt="item"/>
        </template>

        <template v-slot:item.annotation="{ item }">
          <span v-if="!item.annotation">-</span>
          <span v-else-if="item.annotation.length === 0" class="green--text">OK</span>
          <div class="" v-else>
            <div class="red--text"
              v-for="(summary_item, index) in annotation_summary(item.annotation)"
              :key="`${item._id}_${index}`">

              {{summary_item.label}}: {{summary_item.count}}

            </div>
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
      options: {},
      loading: false,
      headers: [
        {text: 'Image', value: "image"},
        {text: 'Time', value: "time"},
        {text: 'Annotation', value: 'annotation'}
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
    this.get_item_count()
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
      const url = `${this.api_url}/collections/${this.collection_name}/images`
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

      this.axios.get(url, {params})
      .then(({data}) => {
        this.items = data
      })
      .catch((error) => {console.error(error)})
      .finally(() => {this.loading = false})
    },


    get_item_count(){
      const url = `${this.api_url}/collections/${this.collection_name}`
      this.axios.get(url)
      .then(({data}) => { this.item_count = data.documents })
      .catch(error =>{
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
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
    collection_name(){
      return this.$route.params.collection
    },

  }

}
</script>

<style>
td, th {
  white-space: nowrap;
}
</style>
