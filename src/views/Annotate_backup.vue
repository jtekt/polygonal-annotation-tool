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
        class=""
        type="button" @click="new_annotation()">
        <ShapePolygonPlusIcon />
      </button>



      <button
        class=""
        type="button" @click="get_next_item_by_date()">
        <ArrowRightIcon />
      </button>

      <!-- select shape -->
      <select
        v-if="false"
        class="" v-model="mode">
        <option value="polygon">Polygon</option>
        <option value="rectangle">Rectangle</option>
      </select>

    </div>

    <!-- Not sure this wrapper is necessary -->
    <div class="main_item_wrapper" v-if="!loading && item">

      <!-- Wrapper for the image so as to draw polygons in overlay -->
      <!-- Tracking mouse movoment using mousemove events -->
      <div
        class="image_wrapper"

        @mousemove="pointMouseMove($event)"
        @mouseup="release_point()">

        <!-- The actual image -->
        <img
          @click="image_clicked($event)"
          draggable="false"
          :src="image_src"
          ref="image"
          alt="">

        <!--
        <svg height="100%" width="100%">
          <polygon
            :class="{active: selected_annotation === annotation_index}"
            v-for="(annotation, annotation_index) in annotations"
            :key="`polygon_${annotation_index}`"
            :points="`${annotation.points.reduce( (output,point) => output + ` ${point.x},${point.y}`, '' )}`"/>
        </svg>
        -->

        <!-- Annotations-->
        <template v-for="(annotation, annotation_index) in annotations">

          <!-- The polygon background -->
          <div
            v-if="annotation.points.length > 2"
            class="polygon"
            :class="{active: selected_annotation === annotation_index}"
            :style="polygonStyles(annotation_index)"
            :key="`polygon_${annotation_index}`"
            @click="select_annotation(annotation_index)">

            <!-- Polygon info, currently delete button -->
            <div
              v-if="annotation.points.length > 2"
              class="polygon_content"
              :key="`polygon_${annotation_index}_info`"
              :style="polygonContentStyles(annotation_index)">
              <!--<span>{{annotation_index}}</span>-->
              <transition name="fade" mode="out-in">
                <button
                  v-if="selected_annotation === annotation_index"
                  class="polygon_delete delete_button"
                  type="button"
                  @click.stop="delete_polygon(annotation_index)">
                  <CloseIcon/>
                </button>
              </transition>
            </div>
          </div>



          <!-- The plygon points -->
          <div
            draggable="false"
            class="point"
            :class="pointClasses(annotation_index,point_index)"
            v-for="(point, point_index) in annotation.points"
            :key="`polygon_${annotation_index}_point${point_index}`"
            :style="pointStyles(annotation_index, point_index)"
            @mousedown="grab_point(annotation_index,point_index)"
            @click="point_clicked(annotation_index,point_index)">

            <!-- the visible part of the button -->
            <div class="point_marker" />

            <!-- Point delete button -->
            <transition name="fade" mode="out-in">
              <button
                :key="`polygon_${annotation_index}_point_${point_index}_delete`"
                v-if="selected_annotation === annotation_index && selected_point === point_index"
                class="point_delete delete_button"
                type="button"
                @click="delete_point(annotation_index, point_index)">
                <CloseIcon />
              </button>
            </transition>
          </div>

        </template>

      </div>
    </div>

    <div class="annotation_list">
      <h2>Annotations</h2>
      <table class="annotation_table">
        <tr>
          <th>Index</th>
          <th>Label</th>
          <th>Points</th>
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
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'
import CloseIcon from 'vue-material-design-icons/Close.vue'
import ShapePolygonPlusIcon from 'vue-material-design-icons/ShapePolygonPlus.vue'
import ContentSaveIcon from 'vue-material-design-icons/ContentSave.vue'
import ArrowRightIcon from 'vue-material-design-icons/ArrowRight.vue'
import ArrowLeftIcon from 'vue-material-design-icons/ArrowLeft.vue'

export default {
  name: 'Annotate',
  components: {
    CloseIcon,
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

      selected_annotation: 0,
      grabbed_point: -1,
      selected_point: -1,

      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,

      mode: 'polygon',
      rectangle_started: false,
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


      if (e.keyCode === 83 && e.ctrlKey) {
        e.preventDefault()
        this.save_item()
      }
      else if (e.keyCode === 65 && e.ctrlKey) {
        e.preventDefault()
        this.new_annotation()
      }
      else if (e.keyCode === 32) {
        e.preventDefault()
        this.new_annotation()
      }
      else if (e.keyCode === 37) {
        e.preventDefault()
        this.get_previous_item_by_date()
      }
      // Right arrow key
      else if (e.keyCode === 39) {
        e.preventDefault()
        this.get_next_item_by_date()
      }
      else if (event.ctrlKey && e.key === 'z') {
        e.preventDefault()
        this.undo()
      }
    },

    get_polygon_center_of_mass(points){
      return points.reduce(({x,y}, point) => {
        return {
          x: x + (point.x)/points.length,
          y: y + (point.y)/points.length,
        }
      }, {x:0, y:0})

    },
    pointStyles(annotation_index, point_index){
      const point = this.annotations[annotation_index].points[point_index]
      if(!point) return {}
      return {
        'left': `${point.x}px`,
        'top': `${point.y}px`,
      }
    },
    pointClasses(annotation_index, point_index){
      // Active: Annotation selected
      // Selected: Speccific point selected
      return {
        active: this.selected_annotation === annotation_index,
        selected: this.selected_annotation === annotation_index && this.selected_point === point_index,
      }

    },
    polygonStyles(index){

      const path = this.annotations[index].points
        .map(point =>  `${point.x}px ${point.y}px`)
        .join(',')

      return { 'clip-path': `polygon(${path})` }

    },

    polygonContentStyles(index){
      const polygon = this.annotations[index].points
      const com = this.get_polygon_center_of_mass(polygon)
      return {
        'color': this.selected_annotation === index ? '#c00000' : '#ffffff',
        'left': `${com.x}px`,
        'top': `${com.y}px`,
      }
    },


    image_clicked(event){

      const { offsetX, offsetY } = event

      const click_position = { x: offsetX, y: offsetY }

      // Create annotation if there is none yet
      if(this.annotations.length < 1) this.new_annotation()

      const annotation = this.annotations[this.selected_annotation] || this.new_annotation()

      annotation.points.push(click_position)

    },
    distance(p1, p2){
      return Math.sqrt( Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) );
    },
    angle_from_points(p1, p2){
      return Math.atan2((p1.y-p2.y),(p1.x-p2.x)) + Math.PI
    },
    rad_to_deg(x){
      return 180.00 * x / Math.PI
    },

    new_annotation(){
      this.annotations.push({
        label: 'NG',
        points: []
      })
      this.select_annotation(this.annotations.length-1)
      return this.annotations[this.selected_annotation]
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
    delete_last_point(index){
      this.annotations[index].points.pop()
    },
    undo(){
      if(!this.annotations[this.selected_annotation]) return
      this.annotations[this.selected_annotation].points.pop()
    },
    grab_point(annotation_index, point_index){
      this.select_annotation(annotation_index)
      this.grabbed_point = point_index

    },
    point_clicked(annotation_index, point_index){

      if(point_index === this.selected_point){
        this.selected_point = -1
      }
      else {
        this.selected_point = point_index
      }
    },
    release_point(){
      this.grabbed_point = -1
    },
    pointMouseMove(event){
      // Used to move a point around
      if(this.grabbed_point < 0) return

      const {left, top} = this.$refs.image.getBoundingClientRect()

      const points = this.annotations[this.selected_annotation].points

      points[this.grabbed_point].x = event.x - left
      points[this.grabbed_point].y = event.y - top
    },
    delete_point(annotation_index, point_index){
      const polygon = this.annotations[annotation_index].points
      polygon.splice(point_index,1)
      if(polygon.length === 0) this.delete_polygon(annotation_index)
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

.main_item_wrapper {
  grid-area: image;

  display: flex;
  //justify-content: center;
  flex-direction: column;
  align-items: center;

}

.image_wrapper {
  position: relative;
}

.image_wrapper:focus {
  outline: 3px solid red;
}

.image_wrapper * {
  user-select: none;
}

.image_wrapper svg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

polygon {
  fill: #c0c0c044;
}

polygon.active {
  fill: #c0000044;
}

.point {
  position: absolute;
  z-index: 6;
  border-radius: 50%;

  //border: 1px solid red;

  //background-color:  #c0c0c0;

  transform: translate(-50%,-50%);
  cursor: grab;

  width: 0.5vmin;
  height: 0.5vmin;


  transition:
    width 0.25s,
    height 0.25s,
    background-color 0.25s;

  display: flex;
  align-items: center;
  justify-content: center;
}

.point.active {
  //background-color: #c00000;
  width: 2vmin;
  height: 2vmin;
}

/* The visible marker of a point */
.point_marker {
  border-radius: 50%;
  background-color:  #c0c0c0;
  height: 25%;
  width: 25%;
  transition:
    width 0.25s,
    height 0.25s,
    background-color 0.25s;
}



.point.active:hover .point_marker {
  height: 100%;
  width: 100%;
}

.point.active .point_marker {
  background-color: #c00000;
}

.point.selected .point_marker {
  background-color: white;
}


.polygon {
  /* Polygon takes all the surface of the wrapper and gets cut using clip */
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 5;
  background-color: #c0c0c044;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.25s;
}

.polygon.active {
  background-color: #c0000044;
}

.delete_button{

  padding: 0.5em;
  line-height: 0;

  font-size: 2vmin;

  cursor: pointer;
  color: white;
  background-color: #c00000;

  transform: translate(-50%,-50%);

  border: none;
  outline: none;
  border-radius: 50%;

  transition: 0.25s;
}

.delete_button:hover {
  background-color: white;
  color: #c00000;
}

.point_delete {
  position: absolute;
  top: 250%;
  left: 50%;
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


.polygon_content {
  position: absolute;
  z-index: 6;

  font-size: 120%;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.polygon_delete {
  opacity: 0;
}
.polygon:hover .polygon_delete{
  opacity: 1;
}


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
