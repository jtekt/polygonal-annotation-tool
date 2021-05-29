<template>
  <div class="about">
    <h1>Annotation tool</h1>
    <p>Author: Maxime MOREILLON</p>
    <h2>Services</h2>
    <table>
      <tr>
        <th>Service</th>
        <th>Version</th>
        <th>URL</th>
      </tr>
      <tr
        v-for="(service, index) in services"
        :key="`service_${index}`">
        <td>{{service.name}}</td>
        <td>{{service.version}}</td>
        <td>{{service.url || 'UNDEFINED'}}</td>
      </tr>
    </table>
  </div>
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
      services: [
        {
          name: 'Image storage GUI',
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
