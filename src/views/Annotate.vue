<template>
  <div class="annotate">

    <h1>{{$route.params.document_id}}</h1>

    <div class="tool_wrapper">
      <!-- This image is not displayed -->
      <template v-if="item">
        <img id="image" :src="image_src" alt="">
      </template>

      <canvas id="canvas" @click="canvas_clicked($event)" />

      <div class="">

        <div class="">
          <button type="button" @click="new_polygon()">追加</button>
        </div>

        <div class="polygons_wrapper">
          <div
            class="polygon"
            :class="{selected: selected_polygon === index}"
            v-for="(polygon, index) in polygons"
            :key="`polygon_${index}`"
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
      loading: false,
      api_url: process.env.VUE_APP_STORAGE_SERVICE_API_URL,
    }
  },
  mounted(){

    this.canvas = document.getElementById('canvas')
    this.ctx = this.canvas.getContext('2d')

    this.get_item()



    // Needed otherwise image is not yet available



  },
  methods: {
    get_item(){
      this.loading = true
      const collection = this.$route.params.collection
      const document_id = this.$route.params.document_id
      const url = `${this.api_url}/collections/${collection}/${document_id}`
      this.axios.get(url)
      .then(response => {
        this.item = response.data
        setTimeout(this.drawImage, 100)

      })
      .catch(error =>{
        this.error = true
        if(error.response) console.log(error.response.data)
        else console.log(error)
      })
      .finally(() => this.loading = false)
    },
    clearCanvas(){
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawImage(){
      const image = document.getElementById('image')

      this.canvas.width = image.width
      this.canvas.height = image.height

      this.ctx.drawImage(image,0,0)
    },
    drawAllPolygons(){



      this.polygons.forEach((polygon, index) => {

        if(polygon.length < 1) return

        this.ctx.lineWidth  = 1

        if(this.selected_polygon === index){
          this.ctx.fillStyle = '#c0000044'
          this.ctx.strokeStyle = '#c00000'
        }
        else {
          this.ctx.fillStyle = '#aaaaaa44'
          this.ctx.strokeStyle = '#aaaaaa'
        }

        this.ctx.beginPath()
        this.ctx.moveTo(polygon[0].x, polygon[0].y)



        for (let point of polygon) {
          this.ctx.lineTo(point.x,point.y)
        }

        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.lineWidth  = 4
        for (let point of polygon) {
          this.ctx.beginPath()
          this.ctx.arc(point.x,point.y, 1, 0, 2 * Math.PI)
          this.ctx.closePath()
          this.ctx.stroke()
        }

        if(this.selected_polygon === index){
          this.ctx.fillStyle = '#c00000'
        }
        else {
          this.ctx.fillStyle = '#aaaaaa'
        }

        this.ctx.font = "20px Arial";
        this.ctx.fillText(index+1, polygon[0].x+5, polygon[0].y-10)


      })



    },
    redraw_all(){
      this.clearCanvas()
      this.drawImage()
      this.drawAllPolygons()
    },

    canvas_clicked(event){

      const canvas_rendered_dimensions = {width: event.target.offsetWidth, height: event.target.offsetHeight}
      const click_rendered_position = {x: event.offsetX, y: event.offsetY}

      // click position must be computed better
      const click_position = {
        x: this.canvas.width * click_rendered_position.x/canvas_rendered_dimensions.width,
        y: this.canvas.height * click_rendered_position.y/canvas_rendered_dimensions.height
      }

      // Create polygon if it does not exist
      if(this.polygons.length < 1) this.new_polygon()

      // creater a point if it is far enough from others
      this.polygons[this.selected_polygon].push(click_position)


      this.redraw_all()

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


      //this.redraw_all()
    },
    select_polygon(index){
      this.selected_polygon = index
      this.redraw_all()
    },
    delete_last_point(index){
      this.polygons[index].pop()
    }
  },
  computed: {
    image_src(){
      return `${this.api_url}/images/${this.$route.params.collection}/${this.item.image}`
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

.polygon {
  margin: 0.5em 0;
  padding: 0.5em;
  border: 1px solid #dddddd;
  display: flex;
  align-items: center;
  height: 3em;
  cursor: pointer;
}

.polygon > *:not(:last-child) {
  margin-right: 0.5em;
}

.spacer {
  flex-grow: 1;
}

.selected {
  border-color: #c00000;
}
</style>
