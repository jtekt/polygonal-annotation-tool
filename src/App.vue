<template>

  <AppTemplate
    :options="options">

    <template v-slot:nav>
      <v-list
        dense
        nav>

        <v-list-item
          exact
          :to="{name: 'images'}">
          <v-list-item-icon>
            <v-icon>mdi-image-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Images</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

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
      title: 'Polygonal annotation tool',
      login_url: process.env.VUE_APP_LOGIN_URL,
      identification_url: process.env.VUE_APP_IDENTIFICATION_URL,
      header_logo: require('@/assets/jtekt_logo_negative.jpg'),
      authentication_logo: require('@/assets/jtekt_logo.jpg'),
      colors: { app_bar: '#000' },
      author: 'JTEKT Corporation',
    },

  }),


}
</script>

<style>
.header_logo {
  border-right: 1px solid white;
}
</style>