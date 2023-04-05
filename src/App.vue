<template>
  <AppTemplate :options="options">
    <template v-slot:nav>
      <v-list dense nav>
        <v-list-item>
          <LocaleSelector />
        </v-list-item>
        <v-divider />

        <v-list-item exact :to="{ name: 'images' }">
          <v-list-item-icon>
            <v-icon>mdi-image-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ $t("Images") }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item exact :to="{ name: 'about' }">
          <v-list-item-icon>
            <v-icon>mdi-information-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ $t("About") }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <NavCategories />
      </v-list>
    </template>
  </AppTemplate>
</template>

<script>
import AppTemplate from "@moreillon/vue_application_template_vuetify"
import LocaleSelector from "./components/LocaleSelector.vue"
import NavCategories from "./components/NavCategories.vue"
const {
  VUE_APP_IDENTIFICATION_URL,
  VUE_APP_LOGIN_URL,
  VUE_APP_SKIP_GREETINGS,
} = process.env

export default {
  name: "App",
  components: {
    AppTemplate,
    NavCategories,
    LocaleSelector,
  },
  data: () => ({
    options: {
      title: "Polygonal annotation tool",
      login_url: VUE_APP_LOGIN_URL,
      identification_url: VUE_APP_IDENTIFICATION_URL,
      skip_greetings: VUE_APP_SKIP_GREETINGS,
      header_logo: require("@/assets/jtekt_logo_negative.jpg"),
      authentication_logo: require("@/assets/jtekt_logo.jpg"),
      colors: { app_bar: "#000" },
      author: "JTEKT Corporation",
    },
  }),
}
</script>

<style>
.header_logo {
  border-right: 1px solid white;
}
</style>
