<template>

  <v-card :loading="loading">

    <v-toolbar flat>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" exact
            :to="{name: 'collection', params: {collection_name: $route.params.collection_name}}">
            <v-icon>mdi-format-list-bulleted</v-icon>
          </v-btn>
        </template>
        <span>Return to collection</span>
      </v-tooltip>

      <v-divider vertical />

      <!-- Polygon editor controls -->
      <v-btn-toggle v-model="mode_index" borderless group>
        <v-btn icon>
          <v-icon>mdi-vector-polygon</v-icon>
        </v-btn>

        <v-btn text>
          <v-icon>mdi-vector-rectangle</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-spacer />

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="#c00000" icon v-bind="attrs" v-on="on" @click="unannotate()">
            <v-icon>mdi-tag-off</v-icon>
          </v-btn>
        </template>
        <div class="text-center">
          <div class="">
            Mark as unannotated
          </div>
        </div>
      </v-tooltip>

      <v-divider vertical />

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn color="green" icon v-bind="attrs" v-on="on" @click="save_annotations()">
            <v-icon>mdi-tag-check</v-icon>
          </v-btn>
        </template>
        <div class="text-center">
          <div class="">
            Save annotations
          </div>
          <div class="">
            (Ctrl + S)
          </div>
        </div>
      </v-tooltip>





      <v-divider vertical />

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="get_previous_item_by_date()">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </template>
        <div class="text-center">
          <div class="">
            Previous item
          </div>
          <div class="">
            (←)
          </div>
        </div>
      </v-tooltip>

      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="get_next_item_by_date()">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
        <div class="text-center">
          <div class="">
            Next item
          </div>
          <div class="">
            (→)
          </div>
        </div>
      </v-tooltip>

      <v-divider vertical />
      <KeyboardShortcuts />





    </v-toolbar>
    <v-divider />

    <v-container fluid>
      <v-row>
        <v-col class="image_wrapper_outer">
          <!-- This wrapper gets the same size as the img -->
          <div v-if="!loading && item" class="image_wrapper">

            <!-- The actual image -->
            <img draggable="false" :src="image_src" ref="image" alt="">

            <!-- The polygon editing tool -->
            <PolygonEditor :mode="mode_lookup[mode_index]" :polygons="item.annotation"
              :selected_polygon_index.sync="selected_annotation"
              @create_polygons_array="create_annotation_array_not_exists()"
              @polygon_created="$event.label = labels[0]" />

          </div>
        </v-col>
        <v-col>

          <div v-if="loading" class="text-center text-h5 mt-5">
            <v-progress-circular indeterminate />
          </div>

          <div class="text-center text-h5 mt-5" v-else-if="!item.annotation">
            Not annotated yet
          </div>

          <v-data-table hide-default-footer :itemsPerPage="-1" :loading="loading" :items="item.annotation || []"
            :headers="headers">

            <template v-slot:item="row">
              <tr
                :style="{'background-color': selected_annotation === row.index ? '#c0000044' : '', cursor: 'pointer' }"
                @click="selected_annotation = row.index">
                <td>{{row.index}}</td>
                <td>
                  <v-combobox v-model="row.item.label" :items="labels" />
                </td>

                <td>
                  <v-icon small class="mr-2" @click="delete_single_annotation(row.index)">
                    mdi-delete
                  </v-icon>
                </td>
              </tr>
            </template>

          </v-data-table>

          <!-- Item details -->
          <v-list class="mt-5" v-if="item">
            <v-list-item two-line>
              <v-list-item-content>
                <v-list-item-subtitle>File name</v-list-item-subtitle>
                <v-list-item-title>{{ item.image }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item two-line>
              <v-list-item-content>
                <v-list-item-subtitle>Timestamp</v-list-item-subtitle>
                <v-list-item-title>{{ item.time }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="item.annotation && item.annotator_id" two-line>
              <v-list-item-content>
                <v-list-item-subtitle>Annotator ID</v-list-item-subtitle>
                <v-list-item-title>{{ item.annotator_id }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>


        </v-col>
      </v-row>
    </v-container>



    <v-snackbar :color="snackbar.color" v-model="snackbar.show">
      {{ snackbar.text }}

      <template v-slot:action="{ attrs }">
        <v-btn dark text v-bind="attrs" @click="snackbar.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

  </v-card>



</template>

<script>

import PolygonEditor from '@/components/PolygonEditor.vue'

import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue'


export default {
  name: 'Annotate',
  components: {
    PolygonEditor,
    KeyboardShortcuts,

  },
  data(){
    return {
      loading: false,

      // probably don't need both item and annotation since annotation is in item
      // annotation becomes an array
      item: {
        annotation: null,
      },

      // used to keep track of unsaved changes
      unmodified_item_copy: null,

      headers: [
        {text: 'ID', value: 'index'},
        {text: 'Label / Class', value: 'label'},
        {text: 'Delete', value: 'actions'},
      ],

      selected_annotation: -1,

      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,

      mode_index: 0,
      mode_lookup: ['polygon','rectangle'],

      snackbar: {
        show: false,
        text: '',
        color: 'green'
      },


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
    unannotate(){
      // Completely remove the annotation field, marking the item as not annotated yet
      if (!this.item.annotation) return
      if (!confirm('Mark the item unannotated?')) return

      this.$set(this.item, 'annotation', null)
      this.save_item()
    },
    empty_annotations() {
      // Empty the annotation array but keep the field
      if(this.item.annotation && this.item.annotation.length) {
        if(!confirm('ホンマ？')) return
      }

      this.$set(this.item, 'annotation', [])
    },
    save_annotations(){
      this.create_annotation_array_not_exists()
      this.save_item()
    },

    get_item_by_id(){
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      this.axios.get(url)
      .then(({data}) => {
        this.item = data
        this.save_item_copy()
       })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(() => this.loading = false)
    },

    get_items_with_options(options){
      // This function simply navigates to the next item
      // The item itself is obtained with get_item_by_id
      if(this.item_has_unsaved_modifications && !confirm('Item has modifications, discard?')) return
      if(this.loading) return
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/`
      this.axios.get(url,options)
      .then(({data}) => {

        if(data.length === 0) {
          this.snackbar.show = true
          this.snackbar.text = 'No more items'
        }

        const item = data[0]
        // Prevent reloading current route
        if(this.document_id !== item._id) {
          this.$router.push({name: 'annotate', params: {collection: this.collection_name, document_id: item._id}})
        }

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

    create_annotation_array_not_exists(){
      // If the item has not been annotated yet. the annotation property must be created as an array
      // Note the usage of $set for reactivity
      if(!this.item.annotation) this.$set(this.item, 'annotation', [])
    },

    get_copy_of_item(object){
      return JSON.parse(JSON.stringify(object))
    },

    save_item_copy(){
      this.unmodified_item_copy = this.get_copy_of_item(this.item)
    },

    save_item(){

      

      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      const body = { annotation: this.item.annotation }

      const {current_user} = this.$store.state
      if(current_user) body.annotator_id = current_user._id || current_user.properties._id

      this.axios.patch(url,body)
      .then(() => {
        this.snackbar.show = true
        this.snackbar.text = 'Item saved successful'
        this.snackbar.color = 'green'
        this.save_item_copy()
      })
      .catch(error =>{
        this.error = true
        if(error.response) console.error(error.response.data)
        else console.error(error)
        this.snackbar.show = true
        this.snackbar.text = 'Errro, see console for details'
        this.snackbar.color = '#c00000'
      })
    },

    handle_keydown(e){
      // Keyboard events

      // CTRL S
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault()
        this.save_annotations()
      }
      else if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault()
        this.empty_annotations()
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
    delete_single_annotation(index){
      if(!confirm(`Delete polygon ${index}?`)) return
      this.item.annotation.splice(index,1)
      this.selected_annotation = -1
    },
    object_equals( x, y ) {
      return JSON.stringify(x) !== JSON.stringify(y)
    }
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
    },
    item_has_unsaved_modifications(){
      if(!this.item) return false
      if(!this.unmodified_item_copy) return false
      return this.object_equals(this.item,this.unmodified_item_copy)
    },
  }
}
</script>

<style scoped>


.image_wrapper_outer {

  display: flex;
  flex-direction: column;
  align-items: center;

}

.image_wrapper {
  position: relative;
}

tr {
  transition: background-color 0.25s;
}

tr.selected {
  background-color: #c0000044;
}

</style>
