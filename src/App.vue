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
      <v-container fluid>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  }),
};
</script>
