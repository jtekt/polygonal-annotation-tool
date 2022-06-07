<template>

  <AppTemplate
    :options="options">

    <template v-slot:nav>
      <v-list
        dense
        nav>

        <v-list-item
          exact
          :to="{name: 'collections'}">
          <v-list-item-icon>
            <v-icon>mdi-home</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
          no-action>
          <template v-slot:activator>
            <v-list-item-icon>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Collections</v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            v-for="(collection, i) in collections"
            :key="i"
            :to="{name: 'collection', params: {collection}}">
            <v-list-item-content>
              <v-list-item-title v-text="collection" />
            </v-list-item-content>
          </v-list-item>

        </v-list-group>

        <v-list-item
          exact
          :to="{name: 'about'}">
          <v-list-item-icon>
            <v-icon>mdi-information-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

      </v-list>
    </template>

  </AppTemplate>

</template>

<script>
import AppTemplate from '@moreillon/vue_application_template_vuetify'
export default {
  name: 'App',
  components: {
    AppTemplate
  },
  data: () => ({
    options: {
      title: 'Annotation tool',
      login_url: process.env.VUE_APP_LOGIN_URL,
      identification_url: process.env.VUE_APP_IDENTIFICATION_URL,
    },
    collections: [],
    nav: [
      { title: 'Dashboard', icon: 'mdi-view-dashboard' },
      { title: 'Photos', icon: 'mdi-image' },
      { title: 'About', icon: 'mdi-help-box' },
    ],
  }),
  mounted(){
    this.get_collections()
  },
  methods: {
    get_user(user){
      this.$store.commit('set_current_user', user)
    },
    get_collections() {
      this.collections = []
      this.axios.get(`${process.env.VUE_APP_STORAGE_SERVICE_API_URL}/collections`)
      .then(({data}) => { this.collections = data })
      .catch(error =>{
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      // .finally(()=>{})
    }
  }

}
</script>
