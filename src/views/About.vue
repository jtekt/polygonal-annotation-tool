<template>
  <v-card>
    <v-card-title>Annotation tool</v-card-title>

    <v-card-text>
      <p>Authors: Maxime MOREILLON</p>
      <p>Labels: {{labels}}</p>
      <p>Annotation field: {{$store.state.annotation_field}}</p>
      <v-data-table
        hide-default-footer
        :itemsPerPage="-1"
        :headers="headers"
        :items="services"/>
    </v-card-text>


  </v-card>
</template>

<script>
import pjson from '@/../package.json'
export default {
  name: 'About',
  data () {
    return {
      version: pjson.version,
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
      ws_url: process.env.VUE_APP_WS_SERVER_URL,
      labels: process.env.VUE_APP_LABELS,
      headers: [
        {text: 'Service', value: "name"},
        {text: 'Version', value: "version"},
        {text: 'URL', value: "url"},

      ],
      services: [
        {
          name: 'Annotation tool',
          url: window.location.origin,
          version: pjson.version
        },
        {
          name: 'Image storage API',
          url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
          version: null
        },
      ],
    }
  },
  mounted () {
    this.get_services_version()
  },
  methods: {

    get_services_version () {
      this.services.forEach((service) => {
        if (service.version) return
        service.version = 'Connecting...'
        this.axios.get(service.url)
          .then(({ data }) => { service.version = data.version })
          .catch(() => { service.version = 'Unable to connect' })
      })
    }
  }

}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

}

tr:not(:last-child) {
  border-bottom: 1px solid #dddddd;
}

th {
  text-align: left;
}
td {
  padding: 0.25em;
}


</style>
