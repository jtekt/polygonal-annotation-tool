<template>
  <div id="app">

    <header>
      Annotation tool v{{version}}
    </header>

    <nav>
      <router-link
        :to="{ name: 'collection_list'}">
        collections
      </router-link>
      <template v-if="this.$route.params.collection">
        <ChevronRightIcon />
        <router-link

          :to="{ name: 'collection', params: {collection: this.$route.params.collection} }">
          {{this.$route.params.collection}}
        </router-link>
      </template>

      <template v-if="this.$route.params.document_id">
        <ChevronRightIcon />
        <span>
          {{this.$route.params.document_id}}
        </span>
      </template>


    </nav>

    <main>
      <router-view/>
    </main>


  </div>
</template>

<script>

import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue'
import 'vue-material-design-icons/styles.css'
import pjson from '@/../package.json'

export default {
  name: 'App',
  components: {
    ChevronRightIcon
  },
  data(){
    return {
      version: pjson.version,

    }
  }

}
</script>

<style>

.material-design-icon > .material-design-icon__svg {
  bottom: 0 !important;
}

* {
  box-sizing: border-box;
}
body {
  font-family: sans-serif;
  margin: 0;
}

header {
  background-color: #444444;
  color: white;
  padding: 0.5em;
  font-size: 150%;
}
nav {
  padding: 0.5em;
  display: flex;
  align-items: center;
}
nav > * {
  text-decoration: none;
  color: currentColor;
}

nav > a {
  font-weight: bold;
}

nav > a:hover {
  color: #c00000;
}

nav > *:not(:last-child) {
  margin-right: 0.25em;
}

main {
  padding: 0.5em;
}
</style>
