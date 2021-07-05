<template>
  <div class="home">
    <h1>Collections</h1>

    <div class="error" v-if="collections.error">
      Error loading collections
    </div>

    <div
      class="loader_container"
      v-else-if="collections.loading">
      <Loader />
    </div>

    <template v-else-if="collections.length > 0">
      <div class="collections_wrapper">
        <router-link
          v-for="collection in filtered_collections"
          :key="collection"
          class="collection"
          :to="{ name: 'collection', params: {collection} }">

          <span>{{collection}}</span>

        </router-link>
      </div>

    </template>

    <div class="" v-else-if="collections.length < 1">
      No collections available
    </div>


  </div>
</template>

<script>
// @ is an alias to /src
import Loader from '@moreillon/vue_loader'



export default {
  name: 'Home',
  components: {
    Loader,

  },
  data(){
    return {
      search: '',
      collections: [],
    }
  },
  mounted(){
    this.get_collections()
  },
  methods: {
    get_collections() {
      this.$set(this.collections,'loading',true)
      this.axios.get(`${process.env.VUE_APP_STORAGE_SERVICE_API_URL}/collections`)
      .then(response => {
        this.collections = []
        response.data.forEach((doc) => {
          this.collections.push(doc)
        });
      })
      .catch(error =>{
        this.$set(this.collections,'error',true)
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(()=>{this.$set(this.collections,'loading',false)})
    }
  },
  computed: {
    filtered_collections(){
      if(!this.search) return this.collections
      return this.collections.filter(collection => {
        return collection.toLowerCase().includes(this.search.toLowerCase())
      })
    }
  }

}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  margin: 1em 0;
}

.toolbar > *:not(:last-child) {
  margin-right: 0.5em;
}

.collections_wrapper {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 1em;
}

.collection {
  border: 1px solid #dddddd;
  border-radius: 0.5em;
  padding: 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: currentcolor;
  text-decoration: none;
  font-weight: bold;
  transition: 0.25s;
}

.collection .icon{
  font-size: 150%;
  margin-bottom: 0.5em;
}

.collection:hover {
  color: #c00000;
  border-color: #c00000;
}

input {
  flex-grow: 1;
  padding: 0.25em;
}

</style>
