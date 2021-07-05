<template>
  <v-app>
    <v-app-bar
      app
      color="#444444"
      dark
      clipped-left>

      <v-app-bar-nav-icon
        @click="drawer = !drawer" />


      <v-app-bar-title>
        Annotation tool
      </v-app-bar-title>

    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      clipped>

      <v-list
        dense
        nav>
        <v-list-item :to="{name: 'collections'}">
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

        <v-list-item :to="{name: 'about'}">
          <v-list-item-icon>
            <v-icon>mdi-information-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

      </v-list>

    </v-navigation-drawer>

    <v-main>
      <AuthenticationWall
        :options="options"
        @user="get_user($event)">
        <v-container fluid>
          <router-view/>
        </v-container>
      </AuthenticationWall>

    </v-main>
  </v-app>
</template>

<script>
import AuthenticationWall from '@moreillon/vue_authentication_wall_vuetify'
export default {
  name: 'App',
  components: {
    AuthenticationWall
  },
  data: () => ({
    drawer: null,
    options: {
      login_url: `${process.env.VUE_APP_AUTHENTICATION_API_URL}/login`,
      identification_url: `${process.env.VUE_APP_AUTHENTICATION_API_URL}/v2/whoami`,
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
