<template>
  <div class="application_template">
    <header>
      <div class="application_title">
        {{application_name}}
      </div>
      <div class="spacer"/>
      <a
        v-if="homepage_url"
        :href="homepage_url">
        <AppsIcon />
      </a>
    </header>

    <nav>

      <router-link :to="{ name: 'home' }">
        Collections
      </router-link>

      <template v-if="$route.params.collection">

        <ChevronRightIcon />

        <router-link :to="{ name: 'collection', params: {collection: $route.params.collection} }">
          {{$route.params.collection}}
        </router-link>

        <template v-if="$route.params.entry_id">
          <ChevronRightIcon />
          <span>
            {{$route.params.entry_id}}
          </span>
        </template>

      </template>

      <div class="spacer"/>

      <router-link :to="{ name: 'about' }">
        <InformationOutlineIcon />
        <span>Info</span>
      </router-link>



    </nav>

    <main>
      <router-view/>
    </main>

    <footer>
      <img src="@/assets/logo.png" alt="">
      <div class="">
        <div class="">
          {{application_name}}
        </div>
        <div class="">
          Maxime MOREILLON
        </div>

      </div>

    </footer>
  </div>
</template>

<script>
import 'vue-material-design-icons/styles.css';
import AppsIcon from 'vue-material-design-icons/Apps.vue';
import ChevronRightIcon from 'vue-material-design-icons/ChevronRight.vue';
import InformationOutlineIcon from 'vue-material-design-icons/InformationOutline.vue';

export default {
  name: 'AppTemplate',
  components: {
    AppsIcon,
    ChevronRightIcon,
    InformationOutlineIcon,
  },
  props: {
    application_name: String,
  },
  data() {
    return {
      homepage_url: process.env.VUE_APP_HOMEPAGE_URL,
    }
  }

}
</script>

<style>
body {
  margin: 0;
  box-sizing: border-box;

  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

}

.material-design-icon > * {
  bottom: 0 !important;
}

.application_template {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}


header {
  font-size: 150%;
  background-color: #444444;
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
}

header a {
  color: currentcolor;
  transition: 0.25s;
}

header a:hover {
  color: #c00000;
}


nav {
  padding: 15px;
  //margin: 0 15px;
  font-weight: bold;
  display: flex;
  align-items: center;

  border-bottom: 1px solid #dddddd;
}
nav a {
  color: currentColor;
  text-decoration: none;
  display: flex;
  align-items: center;
}

nav a > *:not(:last-child) {
  margin-right: 0.25em;
}

nav a:hover:not(.router-link-exact-active) {
  color: #c00000;
}

nav a.router-link-exact-active {
  //color: #c00000;
}

nav a.router-link-exact-active:hover {
  cursor: default;
}

nav > * {
  margin-right: 15px;
}

main {
  flex-grow: 1;
  margin: 0 15px;
}



footer {
  margin-top: 1em;
  margin-left: 1em;
  margin-right: 1em;
  border-top: 1px solid #dddddd;
  padding: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
}


footer img {
  width: 2em;
  height: 2em;

  animation-name: logo_rotation;
  animation-duration: 60s;
  animation-fill-mode: both;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}


footer > div {
  margin-left: 0.5em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

@keyframes logo_rotation {
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
}

.error {
  color: #c00000;
}

.loader_container {
  margin-top: 1em;
  text-align: center;
  font-size: 200%;
}

.spacer {
  flex-grow: 1;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #444444;
  background-color: white;
  border-radius: 0.25em;
  padding: 0.5em;
  cursor: pointer;
  transition: 0.25s;
}

button > *:not(:last-child) {
  margin-right: 0.25em;
}

button:hover {
  color: #c00000;
  border-color: #c00000;
}

</style>
