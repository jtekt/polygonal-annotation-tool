<template>
  <div class="home">

    <h1>{{$route.params.collection}}</h1>

    <div
      class="error"
      v-if="collection.error">
      Error loading collection
    </div>

    <div
      class="loader_container"
      v-else-if="collection.loading">
      <Loader />
    </div>

    <template v-else>

      <div class="buttons_wrapper">

      </div>


      <table v-if="collection.length > 0">
        <tr>
          <th>Image</th>
          <th>Time</th>
          <th>File name</th>
        </tr>

        <tr
          class="doc"
          v-for="doc in collection"
          :key="doc._id"
          @click="$router.push({path: `/${$route.params.collection}/${doc._id}`})">


          <td>
            <img :src="`${api_url}/images/${$route.params.collection}/${doc.image}`">
          </td>
          <td>{{format_date(doc.time)}}</td>
          <td>{{doc.image}}</td>


        </tr>
      </table>

      <div class="" v-else>
        Collection is empty
      </div>
    </template>





  </div>
</template>

<script>
// @ is an alias to /src
import Loader from '@moreillon/vue_loader'



export default {
  name: 'List',
  components: {
    Loader,

  },
  data(){
    return {
      collection: [],
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL
    }
  },
  mounted(){
    this.get_list()
  },
  beforeRouteUpdate (to, from, next) {
    this.get_list(to.query.collection)
    next()
  },

  methods: {
    get_list(){
      this.$set(this.collection,'loading',true)
      this.axios.get(`${this.api_url}/collections/${this.$route.params.collection}/images`)
      .then(response => {
        this.collection = []
        response.data.forEach((doc) => {
          this.collection.push(doc)
        });
      })
      .catch(error =>{
        this.$set(this.collection,'error',true)
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(()=>{this.$set(this.collection,'loading',false)})
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

</style>
