<template>
  <div class="annotate">

    <h1>{{$route.params.document_id}}</h1>

    <div class="tool_wrapper">
      <!-- This image is not displayed -->
      <template v-if="item">
        <img id="image" :src="image_src" alt="">
      </template>

      <!-- Tracking mouse movoment using mousemove events -->
      <div
        class="canvas_wrapper"
        @mousemove='pointMouseMove'
        @mouseup="release_point()">

        <img
          :src="image_src"
          ref="image"
          alt=""
          @click="image_clicked($event)">

        <!--<canvas id="canvas" @click="canvas_clicked($event)" />-->

        <template v-for="(polygon, polygon_index) in polygons">

          <div
            v-if="polygon.length > 2"
            class="polygon"
            :style="polygonStyles(polygon_index)"
            :key="`polygon_${polygon_index}`"
            @click="select_polygon(polygon_index)">
          </div>

          <div
            class="point"
            :class="{selected: selected_polygon === polygon_index && selected_point === point_index}"
            v-for="(point, point_index) in polygon"
            :key="`polygon_${polygon_index}_point${point_index}`"
            :style="pointStyles(polygon_index,point_index)"
            @mousedown="grab_point(polygon_index,point_index)">

            <button
              v-if="selected_polygon === polygon_index && selected_point === point_index"
              class="point_delete_buttom"
              type="button"
              @click="delete_point(polygon_index, point_index)">
              X
            </button>

          </div>

        </template>

      </div>



      <div class="">


        <div class="">
          <button type="button" @click="new_polygon()">追加</button>
          <button type="button" @click="save_item()">保存</button>
        </div>



        <div class="polygons_wrapper">

          <div
            class="polygon_info"
            :class="{selected: selected_polygon === index}"
            v-for="(polygon, index) in polygons"
            :key="`polygon_${index}_info`"
            @click="select_polygon(index)">

            <span>{{index+1}}</span>
            <span class="spacer"/>

            <template v-if="selected_polygon === index">
              <button type="button" v-if="polygons[selected_polygon].length > 0" @click="delete_last_point(index)">undo</button>
              <button type="button" @click.stop="delete_polygon(index)">delete</button>
            </template>



          </div>
        </div>



      </div>
    </div>




  </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Annotate',
  components: {

  },
  data(){
    return {
      item: null,
      canvas: null,
      ctx: null,
      polygons: [],
      selected_polygon: 0,
      grabbed_point: -1,
      selected_point: -1,
      loading: false,
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
    }
  },
  mounted(){

    //this.canvas = document.getElementById('canvas')
    //this.ctx = this.canvas.getContext('2d')

    this.get_item()



    // Needed otherwise image is not yet available



  },
  methods: {
    get_item(){
      this.loading = true
      const url = `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}`
      this.axios.get(url)
      .then(response => {
        this.item = response.data
        if(this.item.annotation){
          this.item.annotation.forEach((polygon) => {
            this.polygons.push(polygon)
          })
        }
        setTimeout(this.drawImage, 100)

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
      .then(response => {
        console.log(response.data)

      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
    },


    pointStyles(polygon_index, point_index){
      const polygon = this.polygons[polygon_index]
      const point = polygon[point_index]
      const background_color = this.selected_polygon === polygon_index ? '#c00000' : '#aaaaaa'
      return {
        'left': `${point.x}px`,
        'top': `${point.y}px`,
        'background-color': background_color,

      }
    },
    polygonStyles(index){
      const polygon = this.polygons[index]
      const path = polygon.map(point => {return `${point.x}px ${point.y}px`}).join(',')
      const background_color = this.selected_polygon === index ? '#c0000044' : '#aaaaaa44'

      return {
        'clip-path': `polygon(${path})`,
        'background-color': background_color,
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

      // creater a point if it is far enough from others
      this.polygons[this.selected_polygon].push(click_position)


    },
    new_polygon(){
      this.polygons.push([])
      this.select_polygon(this.polygons.length-1)
    },
    delete_polygon(index){
      this.polygons.splice(index,1)

      // does not work
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
      if(this.grabbed_point < 0) return

      this.polygons[this.selected_polygon][this.grabbed_point].x = event.x - this.$refs.image.getBoundingClientRect().left
      this.polygons[this.selected_polygon][this.grabbed_point].y = event.y- this.$refs.image.getBoundingClientRect().top
    },
    delete_point(polygon_index, point_index){
      this.polygons[polygon_index].splice(point_index,1)
    }
  },
  computed: {
    collection_name(){
      return this.$route.params.collection
    },
    document_id(){
      return (this.item && this.item._id) || this.$route.params.document_id
    },
    image_src(){
      return `${this.api_url}/collections/${this.collection_name}/images/${this.document_id}/image`
    }
  }
}
</script>

<style scoped>

.tool_wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;
}
#image {
  display: none;
}
canvas {

}

.canvas_wrapper {
  position: relative;
}

.point {
  position: absolute;
  z-index: 6;

  width: 10px;
  height: 10px;

  border-radius: 50%;

  background-color: #c00000;

  transform: translate(-50%,-50%);

  cursor: grab;
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
  background-color: #c0000044;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
}


/* list stuff */
.polygon_info {
  margin: 0.5em 0;
  padding: 0.5em;
  border: 1px solid #dddddd;
  display: flex;
  align-items: center;
  height: 3em;
  cursor: pointer;
}

.polygon_info > *:not(:last-child) {
  margin-right: 0.5em;
}

.spacer {
  flex-grow: 1;
}

.selected {
  border-color: #c00000;
}

.point_delete_buttom {
  position: absolute;
  top: 200%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5em;
  border-radius: 0.5em;
  background-color: #c00000;
  border: none;
  outline: none;
  color: white;
  cursor: pointer;
}
</style>
