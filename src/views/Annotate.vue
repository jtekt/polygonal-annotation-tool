<template>
  <div class="annotate">

    <div class="toolbar">

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
        type="button" @click="get_next_unannotated_item">
        <ArrowRightIcon />
      </button>

    </div>


    <div class="main_item_wrapper" v-if="!loading && item">

      <!-- Wrapper for the image so as to draw polygons in overlay -->
      <!-- Tracking mouse movoment using mousemove events -->
      <div
        class="image_wrapper"
        @mousemove='pointMouseMove'
        @mouseup="release_point()">

        <!-- The actual image -->
        <img
          draggable="false"
          :src="image_src"
          ref="image"
          alt=""
          @click="image_clicked($event)">

        <!-- Annotations-->
        <template v-for="(annotation, annotation_index) in annotations">

          <!-- The polygon background -->
          <div
            v-if="annotation.points.length > 2"
            class="polygon"
            :class="polygonClasses(annotation_index)"
            :style="polygonStyles(annotation_index)"
            :key="`polygon_${annotation_index}`"
            @click="select_polygon(annotation_index)">
          </div>

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

          <!-- The plygon points -->
          <div
            draggable="false"
            class="point"
            :class="pointClasses(annotation_index,point_index)"
            v-for="(point, point_index) in annotation.points"
            :key="`polygon_${annotation_index}_point${point_index}`"
            :style="pointStyles(annotation_index, point_index)"
            @mousedown="grab_point(annotation_index,point_index)">

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

      <div class="image_metadata_wrapper">

        <table>
          <tr>
            <td>Time</td>
            <td>{{item.time}}</td>
          </tr>
          <tr>
            <td>File</td>
            <td>{{item.image}}</td>
          </tr>
          <!--
          <tr>
            <td>Index</td>
            <td>{{image_index}}</td>
          </tr>
          -->
        </table>

      </div>

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

export default {
  name: 'Annotate',
  components: {
    CloseIcon,
    ShapePolygonPlusIcon,
    ContentSaveIcon,
    ArrowRightIcon,
  },
  data(){
    return {
      show_saved_snackbar: false,
      loading: false,
      item: null,
      ctx: null,
      annotations: [],
      selected_annotation: 0,
      grabbed_point: -1,
      selected_point: -1,
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
      image_index: 0,
    }
  },
  watch: {
    document_id () {
      this.get_item()
    }
  },
  mounted(){

    if(this.document_id === 'random') this.get_next_unannotated_item()
    else this.get_item()

    document.addEventListener("keydown", this.handle_keydown)


  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handle_keydown)
  },
  methods: {

    get_item(){
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
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/`
      const options = {
        params: {
          filter: { annotation: { $not: {$exists: true}  } },
          limit: 1,
        }
      }
      this.axios.get(url,options)
      .then(response => {
        const item = response.data[0]
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
    get_next_item(){
      this.image_index ++
      this.get_image_by_index(this.image_index)
    },
    get_previous_item(){
      this.image_index --
      this.get_image_by_index(this.image_index)
    },
    get_image_by_index(index){
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/`
      const options = {
        params: {
          start_index: index,
          limit: 1,
        }
      }
      this.axios.get(url,options)
      .then(response => {
        const item = response.data[0]
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
      e.preventDefault()
      if ((e.keyCode === 83 && e.ctrlKey)) {
        this.save_item()
      }
      else if ((e.keyCode === 65 && e.ctrlKey)) {
        this.new_annotation()
      }
      else if ((e.keyCode === 32)) {
        this.new_annotation()
      }
      /*
      else if ((e.keyCode === 37)) {
        this.get_previous_item()
      }
      else if ((e.keyCode === 39)) {
        this.get_next_item()
      }
      */


    },

    polygon_center_of_mass(points){
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
      // Selected: Specxific point selected
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
    polygonClasses(index){
      return {
        active: this.selected_annotation === index,
      }
    },

    polygonContentStyles(index){
      const polygon = this.annotations[index].points
      const com = this.polygon_center_of_mass(polygon)
      return {
        'color': this.selected_annotation === index ? '#c00000' : '#ffffff',
        'left': `${com.x}px`,
        'top': `${com.y}px`,
      }
    },
    polygonContentClass(index){

      return {
        active: this.selected_annotation === index,
      }
    },

    image_clicked(event){

      const {offsetX,offsetY} = event

      const click_position = {
        x: offsetX,
        y: offsetY
      }

      // Create annotation if there is none yet
      if(this.annotations.length < 1) this.new_annotation()

      const annotation = this.annotations[this.selected_annotation]

      if(!annotation) this.new_annotation()

      // creater a point if it is far enough from others
      annotation.points.push(click_position)


      //this.selected_point = this.annotations[this.selected_annotation].length -1

    },
    new_annotation(){
      this.annotations.push({
        label: 'NG',
        points: []
      })
      this.select_polygon(this.annotations.length-1)
    },
    delete_polygon(index){
      this.annotations.splice(index,1)
      if(index > 0) this.select_polygon(index-1)
      else this.select_polygon(0)
    },
    select_polygon(index){
      this.selected_annotation = index
      this.selected_point = -1;
    },
    delete_last_point(index){
      this.annotations[index].points.pop()
    },
    grab_point(annotation_index, point_index){
      this.select_polygon(annotation_index)
      this.grabbed_point = point_index
      this.selected_point = this.grabbed_point
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
    }
  }
}
</script>

<style scoped>

.main_item_wrapper {
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
}

.point_delete {
  position: absolute;
  top: 250%;
  left: 50%;

  //clip-path: polygon(50% 0, 100% 25%, 100% 90%, 0 90%, 0 25%);
}

.toolbar {
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
  margin-top: 1em;
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


</style>
