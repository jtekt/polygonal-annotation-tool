<template>
  <div class="home">

    <h1>{{$route.params.collection}}</h1>

    <p>
      <router-link :to="{ name: 'annotate', params: {collection: $route.params.collection, document_id: 'random'} }">
        Annotate random item
      </router-link>
    </p>



    <div
      class="error"
      v-if="collection.error">
      Error loading collection
    </div>



    <template v-if="!error">

      <p>
        Collection {{collection_name}} contains {{count}} item(s)
      </p>

      <template v-if="collection.length > 0">

        <div class="table_wrapper">
          <table>
            <tr>
              <th>Image</th>
              <th>Time</th>
              <th>File name</th>
              <th>Annotation</th>
            </tr>

            <tr
              class="doc"
              v-for="doc in collection"
              :key="doc._id"
              @click="$router.push({name: 'annotate', params: {document_id: doc._id, collection: $route.params.collection}})">


              <td>
                <img :src="`${api_url}/collections/${collection_name}/images/${doc._id}/image`">
              </td>
              <td>{{format_date(doc.time)}}</td>
              <td>{{doc.image}}</td>


              <td>
                <template v-if="doc.annotation">

                  <span class="red label" v-if="doc.annotation.length > 0">NG</span>
                  <span class="green label" v-else>OK</span>
                </template>

                <span v-else>-</span>

              </td>

            </tr>
          </table>
        </div>

      </template>


      <div
        v-if="!all_loaded && !loading"
        class="load_more_container">
        <button type="button" @click="get_list()">Load more</button>
      </div>

      <div
        class="loader_container"
        v-else-if="loading">
        <Loader />
      </div>

      <div class="" v-if="!loading && !error && collection.length === 0">
        Collection is empty
      </div>
    </template>





  </div>
</template>

<script>
// @ is an alias to /src
import Loader from '@moreillon/vue_loader'

//import CloseIcon from 'vue-material-design-icons/Close.vue'
//import CheckIcon from 'vue-material-design-icons/Check.vue'

export default {
  name: 'List',
  components: {
    Loader,
    //CloseIcon,
    //CheckIcon

  },
  data(){
    return {
      loading: false,
      error: null,
      collection: [],
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
      batch_size: 50,
      all_loaded: false,
      count: 0,
    }
  },
  mounted(){
    this.get_db_document_count()
    this.clear_list()
    this.get_list()
  },
  beforeRouteUpdate (to, from, next) {
    this.get_db_document_count()
    this.clear_list()
    this.get_list()
    next()
  },

  methods: {
    clear_list(){
      this.collection.splice(0,this.collection.length)
      this.all_loaded = false
    },
    get_db_document_count(){
      const url = `${this.api_url}/collections/${this.collection_name}`
      this.axios.get(url)
      .then(response => {
        this.count = response.data.documents
      })
      .catch(error =>{
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
    },
    get_list(){
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images`

      let params = {
        start_index: this.collection.length,
        batch_size: this.batch_size,
      }

      this.axios.get(url, {params})
      .then(({data}) => {
        data.forEach((doc) => { this.collection.push(doc) })
        if(data.length < this.batch_size) this.all_loaded = true
      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(()=>{this.loading = false})
    },

    format_date(date){

      let options = {
        hour12: false,
        year:'numeric',
        month:'2-digit',
        day: '2-digit',
        hour:'2-digit',
        minute:'2-digit',
        second: '2-digit'
      }
      return new Date(date).toLocaleString('ja-JP', options)

    }
  },
  computed: {
    collection_name(){
      return this.$route.params.collection
    },
  }
}
</script>

<style scoped>

table {
  border-collapse: collapse;
  width: 100%;
  text-align: center;
}
td, th {
  padding: 0.25em;
}
tr:not(:last-child){
  border-bottom: 1px solid #dddddd;
}
tr:not(:first-child) {
  cursor: pointer;
  transition: background-color 0.25s;
}
tr:not(:first-child):hover {
  background-color: #eeeeee;
}

.doc img {
  width: 5em;
}

.buttons_wrapper {
  margin: 1em 0;
}

.buttons_wrapper button:not(:last-child) {
  margin-right: 1em;
}

.red {
  color: #c00000;
}

.green {
  color: #00c000;
}

.label {
  font-weight: bold;
}
.load_more_container{
  margin-top: 1em;
  text-align: center;
}
</style>
