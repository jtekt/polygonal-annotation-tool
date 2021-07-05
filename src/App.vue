<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark>

    <v-app-bar-title>
      Annotation tool
    </v-app-bar-title>

    </v-app-bar>

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
    options: {
      login_url: `${process.env.VUE_APP_AUTHENTICATION_API_URL}/login`,
      identification_url: `${process.env.VUE_APP_AUTHENTICATION_API_URL}/v2/whoami`,
    }
  }),
  methods: {
    get_user(user){
      this.$store.commit('set_current_user', user)
    }
  }

}
</script>
