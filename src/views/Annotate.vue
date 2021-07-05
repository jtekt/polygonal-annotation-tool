<template>
  <div class="annotate">

    <div class="toolbar">

      <button
        class=""
        type="button" @click="get_previous_item_by_date()">
        <ArrowLeftIcon />
      </button>


      <button
        class=""
        type="button" @click="save_item()">
        <ContentSaveIcon />
      </button>

      <button
        v-if="false"
        class=""
        type="button" @click="new_annotation()">
        <ShapePolygonPlusIcon />
      </button>

      <button
        class=""
        type="button" @click="get_next_item_by_date()">
        <ArrowRightIcon />
      </button>

    </div>

    <!-- This wrapper can be resized -->
    <div class="image_wrapper_outer" >

      <!-- This wrapper gets the same size as the img -->
      <div
        v-if="!loading && item"
        class="image_wrapper">

        <!-- The actual image -->
        <img
          draggable="false"
          :src="image_src"
          ref="image"
          alt="">

        <!-- The polygon editing tool -->
        <PolygonEditor
          :mode="mode"
          :polygons="annotations"
          :selected_polygon_index.sync="selected_annotation"
          @polygon_created="$event.label=labels[0]"/>

      </div>
    </div>

    <div class="annotation_list">
      <h2>Annotations</h2>
      <table class="annotation_table">
        <tr>
          <th>Index</th>
          <th>Label</th>
          <th>Delete</th>
        </tr>
        <tr
          :class="{selected: index === selected_annotation}"
          v-for="(annotation, index) in annotations"
          :key="index"
          @click="select_annotation(index)">
          <td>{{index}}</td>
          <td>
            <input list="labels" v-model="annotation.label">
            <datalist id="labels">
              <option
                v-for="label in labels"
                :key="label"
                :value="label"/>
            </datalist>
          </td>
          <td>{{annotation.points.length}}</td>
          <td>
            <button type="button" @click="delete_polygon(index)">delete</button>
          </td>
        </tr>
      </table>

    </div>

    <div class="help">
      <h2>Keyboard shortcuts</h2>
      <table class="help_table">

        <tr>
          <td>Ctrl + s</td>
          <td>保存</td>
        </tr>
        <tr>
          <td>Space</td>
          <td>New annotation</td>
        </tr>
        <tr>
          <td>← / →</td>
          <td>Next / previous image</td>
        </tr>
      </table>

    </div>

    <div class="image_metadata_wrapper">
      <h2>Item info</h2>

      <table v-if="item">
        <tr>
          <td>Time</td>
          <td>{{item.time}}</td>
        </tr>
        <tr>
          <td>File</td>
          <td>{{item.image}}</td>
        </tr>
      </table>

    </div>

    <transition name="fade">
      <div class="snackbar save_snackbar"
        v-if="show_saved_snackbar">
        Save successful
      </div>
    </transition>

  </div>
</template>

<script>

import PolygonEditor from '@/components/PolygonEditor.vue'

// Icons
// import CloseIcon from 'vue-material-design-icons/Close.vue'
import ShapePolygonPlusIcon from 'vue-material-design-icons/ShapePolygonPlus.vue'
import ContentSaveIcon from 'vue-material-design-icons/ContentSave.vue'
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue'
import ArrowLeftIcon from 'vue-material-design-icons/ArrowLeft.vue'

export default {
  name: 'Annotate',
  components: {
    PolygonEditor,

    // Icons
    // CloseIcon,
    ShapePolygonPlusIcon,
    ContentSaveIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
  },
  data(){
    return {
      show_saved_snackbar: false,
      loading: false,
      item: null,
      annotations: [],

      selected_annotation: -1,

      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,

      mode: 'polygon',
    }
  },
  watch: {
    document_id () {
      this.get_item_by_id()
    }
  },
  mounted(){

    if(this.document_id === 'random') this.get_next_unannotated_item()
    else this.get_item_by_id()

    // Listen to keyboard events for key shortcuts
    document.addEventListener("keydown", this.handle_keydown)

  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handle_keydown)
  },
  methods: {

    get_item_by_id(){
      this.loading = true
      this.annotations = []
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      this.axios.get(url)
      .then(({data}) => {
        this.item = data
        if(this.item.annotation) this.annotations = this.item.annotation
      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(() => this.loading = false)
    },

    get_next_unannotated_item(){
      const options = {
        params: {
          filter: { annotation: { $not: {$exists: true}  } },
          limit: 1,
        }
      }
      this.get_items_with_options(options)
    },

    get_items_with_options(options){
      if(this.loading) return
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/`
      this.axios.get(url,options)
      .then(({data}) => {
        if(data.length === 0) return alert('No more items')
        const item = data[0]
        // Prevent reloading current route
        if(this.document_id === item._id) return
        this.$router.push({name: 'annotate', params: {collection: this.collection_name, document_id: item._id}})
      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(() => this.loading = false)
    },

    get_next_item_by_date(){

      const params = {
        filter: {time: {'$lt' : this.item.time}},
        limit: 1,
      }

      this.get_items_with_options({params})
    },

    get_previous_item_by_date(){

      const params = {
        filter: {time: {'$gt' : this.item.time}},
        sort: {time: 1},
        limit: 1,
      }

      this.get_items_with_options({params})
    },


    save_item(){
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      const body = {annotation: this.annotations}
      this.axios.patch(url,body)
      .then(() => {
        this.show_saved_snackbar = true
        setTimeout(() => {this.show_saved_snackbar = false}, 3000)

      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
    },

    handle_keydown(e){

      // CTRL S
      if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault()
        this.save_item()
      }
      // Left arrow key: previous item
      else if (e.keyCode === 37) {
        e.preventDefault()
        this.get_previous_item_by_date()
      }
      // Right arrow key: next item
      else if (e.keyCode === 39) {
        e.preventDefault()
        this.get_next_item_by_date()
      }
    },


    delete_polygon(index){
      //if(!confirm(`Delete polygon ${index}?`)) return
      this.annotations.splice(index,1)

      // Deselect polygon
      this.select_annotation(-1)
    },
    select_annotation(index){
      // only change annotation if current is not the right one
      if(this.selected_annotation !== index) {
        this.selected_annotation = index
        this.selected_point = -1
      }
    },

  },
  computed: {
    collection_name(){
      return this.$route.params.collection
    },
    document_id(){
      return this.$route.params.document_id
    },
    image_src(){
      return `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}/image`
    },
    labels(){
      return process.env.VUE_APP_LABELS.split(',')
    }
  }
}
</script>

<style scoped>

.annotate {
  margin-top: 1em;
  display: grid;
  grid-template-areas:
    'image toolbar'
    'image metadata '
    'image annotation_list'
    'image help';
  grid-template-columns: auto 1fr 1fr;
  grid-template-rows: auto auto auto 1fr;
  grid-gap: 1em;

}



.annotation_list {
  grid-area: annotation_list;
}

.image_wrapper_outer {
  grid-area: image;

  display: flex;
  //justify-content: center;
  flex-direction: column;
  align-items: center;

}

.image_wrapper {
  position: relative;
}


.toolbar {
  grid-area: toolbar;
  display: flex;
  justify-content: center;
}

.toolbar button {
  margin: 0.5em;
  font-size: 150%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2em;
  height: 2em;
  background-color: #c00000;
  border: none;
  cursor: pointer;
  outline: none;
  color: white;
  border-radius: 50%;
}


/* Fade used for snackbar */
.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.snackbar {
  position: fixed;
  font-size: 120%;
  padding: 0.5em;
  bottom: 10vh;
  width: 10em;
  height: 2em;
  right: 10vh;
  //transform: translateX(-50%);
  z-index: 100;
  text-align: center;
  background-color: #00c00044;
  border: 2px solid #00c000;
  color: #00c000;

  display: flex;
  justify-content: center;
  align-items: center;
}


.image_metadata_wrapper{
  grid-area: metadata;
}

.image_metadata_wrapper table {
  border-collapse: collapse;
}

.image_metadata_wrapper table > *+* {
  border-top: 1px solid #dddddd;
}

.image_metadata_wrapper td {
  padding: 0.5em;
}
.image_metadata_wrapper tr > *+* {
  padding-left: 1em;
}

.annotation_table {
  width: 100%;
  border-collapse: collapse;
}



.annotation_table tr:not(:first-child) {
  border-top: 1px solid #dddddd;
  cursor: pointer;
}

.annotation_table tr:not(:first-child):hover {
  background-color: #eeeeee;
}

.annotation_table tr.selected {
  background-color: #c0000044;
}

.annotation_table th {
  text-align: left;
}

.annotation_table th, .annotation_table td {
  padding: 0.5em;
}

.help {
  grid-area: help;
}

.help_table {
  border-collapse: collapse;
}

.help_table td {
  padding-right: 0.5em;
}

</style>
