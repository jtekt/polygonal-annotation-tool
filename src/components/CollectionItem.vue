<template>
  <div
    class="collection_item">

    <img
      :style="{width: `${size}vw`}"
      :class="{zoomed: zoomed}"
      :src="image_src"
      @click="zoomed = !zoomed">

    <div
      class="current_annotation">
      <span v-if="item.annotation">{{item.annotation}}</span>
      <LabelOffIcon v-else/>
    </div>




    <div class="controls_wrapper">

      <button
        type="button"
        v-for="label in $store.state.labels"
        v-bind:key="label"
        :disabled="processing"
        @click="annotate(label)">
        {{label}}
      </button>

      <button
        type="button"
        @click="annotate(undefined)"
        :disabled="processing">
        <LabelOffIcon />
      </button>


    </div>
  </div>
</template>

<script>

import LabelOffIcon from 'vue-material-design-icons/LabelOff.vue'


export default {
  name: 'CollectionItem',
  props: {
    item: Object,
    size: String,
  },
  components: {
    LabelOffIcon
  },
  data() {
    return {
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
      zoomed: false,
      processing: false,
      labels: ['OK', 'NG'],
    }
  },
  mounted(){
    this.parse_labels_from_env()
  },
  methods: {
    parse_labels_from_env(){
      if(!process.env.VUE_APP_LABELS) return

      try {
        this.labels=JSON.parse(process.env.VUE_APP_LABELS)
      }
      catch (e) {
        return
      }
    },
    update_item(){
      this.processing = true

      let collection = this.$route.params.collection
      let entry_id = this.item._id
      let url = `${this.api_url}/collections/${collection}/${entry_id}`

      this.axios.put(url, this.item)
      .then( () => {
        // Nothing
      })
      .catch(error =>{
        alert(error)
      })
      .finally(() => {this.processing = false})
    },
    annotate(label){
      this.$set(this.item,'annotation',label)
    }


  },
  computed: {
    image_src() {
      return `${this.api_url}/images/${this.$route.params.collection}/${this.item.image}`
    },
    annotation(){
      return this.item.annotation
    }

  },
  watch: {
    annotation() {
      this.update_item()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.collection_item {

  background-color: white;
  margin: 1em;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);



}

.collection_item.zoomed {
  width: 90%;
}

.collection_item > * {
}


img {
  cursor: zoom-in;
  transition: 0.25s;
  margin: 1em;
}

img.zoomed {
  width: 80vw !important;
  cursor: zoom-out;
}


.controls_wrapper {
  width: 100%;
  margin: 1em;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.current_annotation {
  margin-top: 1em;
  font-size: 150%;
}

.controls_wrapper button {
  padding: 0.5em;
  margin: 0.5em 1em;
  font-size: 100%;
}




</style>
