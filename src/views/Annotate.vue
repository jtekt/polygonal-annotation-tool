<template>
  <div class="annotate">

    <div class="toolbar">
      <button
        class=""
        type="button" @click="selected_polygon = -1">
        <ShapePolygonPlusIcon />
      </button>

      <button
        class=""
        type="button" @click="save_item()">
        <ContentSaveIcon />
      </button>

      <button
        class=""
        type="button" @click="get_random_unannotated_item">
        <ArrowRightIcon />
      </button>

    </div>




    <div class="main_item_wrapper" v-if="!loading && item">


      <!-- Tracking mouse movoment using mousemove events -->
      <div
        class="image_wrapper"
        @mousemove='pointMouseMove'
        @mouseup="release_point()">

        <img
          draggable="false"
          :src="image_src"
          ref="image"
          alt=""
          @click="image_clicked($event)">



        <!--<canvas id="canvas" @click="canvas_clicked($event)" />-->

        <template v-for="(polygon, polygon_index) in polygons">

          <!-- The polygon background -->
          <div
            v-if="polygon.length > 2"
            class="polygon"
            :class="polygonClasses(polygon_index)"
            :style="polygonStyles(polygon_index)"
            :key="`polygon_${polygon_index}`"
            @click="select_polygon(polygon_index)">
          </div>

          <!-- Polygon info, currently delete button -->
          <div
            v-if="polygon.length > 2"
            class="polygon_content"
            :key="`polygon_${polygon_index}_info`"
            :style="polygonContentStyles(polygon_index)">
            <!--<span>{{polygon_index}}</span>-->
            <transition name="fade" mode="out-in">
              <button
                v-if="selected_polygon === polygon_index"
                class="polygon_delete delete_button"
                type="button"
                @click.stop="delete_polygon(polygon_index)">
                <CloseIcon/>
              </button>
            </transition>
          </div>

          <!-- The plygon points -->
          <div
            draggable="false"
            class="point"
            :class="pointClasses(polygon_index,point_index)"
            v-for="(point, point_index) in polygon"
            :key="`polygon_${polygon_index}_point${point_index}`"
            :style="pointStyles(polygon_index,point_index)"
            @mousedown="grab_point(polygon_index,point_index)">

            <!-- Point delete button -->
            <transition name="fade" mode="out-in">
              <button
                :key="`polygon_${polygon_index}_point_${point_index}_delete`"
                v-if="selected_polygon === polygon_index && selected_point === point_index"
                class="point_delete delete_button"
                type="button"
                @click="delete_point(polygon_index, point_index)">
                <CloseIcon />
              </button>
            </transition>
          </div>

        </template>

      </div>

    </div>

    <transition name="fade">
      <div class="snackbar save_snackbar" v-if="show_saved_snackbar">
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
      canvas: null,
      ctx: null,
      polygons: [],
      selected_polygon: 0,
      grabbed_point: -1,
      selected_point: -1,
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
    }
  },
  watch: {
    document_id () {
      this.get_item()
    }
  },
  mounted(){
    if(this.document_id === 'random') this.get_random_unannotated_item()
    else this.get_item()
  },
  methods: {
    get_item(){
      this.loading = true
      this.polygons = []
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      this.axios.get(url)
      .then(response => {
        this.item = response.data
        if(this.item.annotation){
          this.item.annotation.forEach((polygon) => {
            this.polygons.push(polygon)
          })
        }

      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(() => this.loading = false)
    },
    get_random_unannotated_item(){
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
    save_item(){
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      const body = {annotation: this.polygons}
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

    polygon_center_of_mass(polygon){
      return polygon.reduce(({x,y}, point) => {
        return {
          x: x + (point.x)/polygon.length,
          y: y + (point.y)/polygon.length,
        }

      }, {x:0, y:0})

    },
    pointStyles(polygon_index, point_index){
      const polygon = this.polygons[polygon_index]
      const point = polygon[point_index]

      // Selected should be a class

      return {
        'left': `${point.x}px`,
        'top': `${point.y}px`,
      }
    },
    pointClasses(polygon_index, point_index){
      // polygon is selected (active)
      return {
        active: this.selected_polygon === polygon_index,
        selected: this.selected_polygon === polygon_index && this.selected_point === point_index,
      }

    },
    polygonStyles(index){
      const polygon = this.polygons[index]
      const path = polygon.map(point =>  `${point.x}px ${point.y}px`).join(',')

      return {
        'clip-path': `polygon(${path})`,
      }
    },
    polygonClasses(index){
      return {
        active: this.selected_polygon === index,
      }
    },

    polygonContentStyles(index){
      const polygon = this.polygons[index]
      const com = this.polygon_center_of_mass(polygon)
      return {
        'color': this.selected_polygon === index ? '#c00000' : '#ffffff',
        'left': `${com.x}px`,
        'top': `${com.y}px`,
      }
    },
    polygonContentClass(index){

      return {
        active: this.selected_polygon === index,
      }
    },

    image_clicked(event){

      const {offsetX,offsetY} = event

      const click_position = {
        x: offsetX,
        y: offsetY
      }

      // Create polygon if it does not exist
      if(this.polygons.length < 1) this.new_polygon()

      if(!this.polygons[this.selected_polygon]) this.new_polygon()

      // creater a point if it is far enough from others
      this.polygons[this.selected_polygon].push(click_position)

      //this.selected_point = this.polygons[this.selected_polygon].length -1

    },
    new_polygon(){
      this.polygons.push([])
      this.select_polygon(this.polygons.length-1)
    },
    delete_polygon(index){
      this.polygons.splice(index,1)
      if(index > 0) this.select_polygon(index-1)
      else this.select_polygon(0)
    },
    select_polygon(index){
      this.selected_polygon = index
      this.selected_point = -1;
    },
    delete_last_point(index){
      this.polygons[index].pop()
    },
    grab_point(polygon_index, point_index){
      this.select_polygon(polygon_index)
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

      this.polygons[this.selected_polygon][this.grabbed_point].x = event.x - left
      this.polygons[this.selected_polygon][this.grabbed_point].y = event.y- top
    },
    delete_point(polygon_index, point_index){
      this.polygons[polygon_index].splice(point_index,1)
      if(this.polygons[polygon_index].length === 0) this.delete_polygon(polygon_index)
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
  justify-content: center;
}

.image_wrapper {
  position: relative;
}

.image_wrapper * {
  user-select: none;
}

.point {
  position: absolute;
  z-index: 6;
  border-radius: 50%;

  background-color:  #c0c0c0;

  transform: translate(-50%,-50%);
  cursor: grab;

  width: 0.5vmin;
  height: 0.5vmin;


  transition:
    width 0.25s,
    height 0.25s,
    background-color 0.25s;
}

.point.active {
  background-color: #c00000;
  width: 2vmin;
  height: 2vmin;
}

.point.selected {
  background-color: white;
}


.polygon {
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
  width: 50vw;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  text-align: center;
  background-color: #00c00044;
  border: 2px solid #00c000;
  color: #00c000;
}
</style>