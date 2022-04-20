<template>
  <v-card
    max-width="500"
    class="mx-auto">
    <v-card-title>Collections</v-card-title>

    <v-card-text>
      <v-progress-circular
        v-if="loading"
        indeterminate>
      </v-progress-circular>

      <div v-else-if="error" class="red--text">
        {{error}}
      </div>

      <div v-else-if="collections.length === 0">
        No collections available
      </div>

      <v-list
        v-else
        dense>
        <v-list-item
          exact
          v-for="(collection, i) in collections"
          :key="i"
          :to="{name: 'collection', params: {collection}}">
          <v-list-item-content>
            <v-list-item-title v-text="collection" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>



  </v-card>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'Home',
  components: {
  },
  data(){
    return {
      search: '',
      error: null,
      collections: [],
      loading: false,
    }
  },
  mounted(){
    this.get_collections()
  },
  methods: {
    get_collections() {
      this.loading = true
      this.axios.get(`${process.env.VUE_APP_STORAGE_SERVICE_API_URL}/collections`)
      .then(response => {
        this.collections = []
        response.data.forEach((doc) => {
          this.collections.push(doc)
        });
      })
      .catch(error =>{
        this.error = error
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(()=>{this.loading = false})
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
