<template>
  <svg
    @click.self="area_clicked($event)"
    @mousedown.self="area_mouseDown($event)"
    @mouseup="area_mouseUp($event)"
    @mousemove="area_mouseMove($event)">

    <!-- template to wrap v-for -->
    <template v-for="(polygon, polygon_index) in polygons">

      <!-- Polyline during construction -->
      <polyline
        v-if="mode === 'polygon' && polygon.constructing"
        :points="polygon_svg_points(polygon.points)"
        :key="`polyline_${polygon_index}`"/>

      <!-- polygon when construction finished -->
      <polygon
        v-else
        :points="polygon_svg_points(polygon.points)"
        :key="`polygon_${polygon_index}`"
        :class="polygon_classes(polygon_index)"
        @click="polygon_clicked(polygon_index)"/>

      <!-- mid points between vertices -->
      <circle
        class="midpoint"
        v-for="(point, point_index) in midpoints(polygon)"
        :key="`polygon_${polygon_index}_midpoint_${point_index}`"
        :class="midpoint_classes(polygon_index,point_index)"
        @mousedown="midpoint_clicked($event, polygon_index, point_index)"
        :cx="point.x" :cy="point.y"/>

      <!-- The polygon vertices -->
      <circle
        class="vertex"
        v-for="(point, point_index) in polygon.points"
        :key="`polygon_${polygon_index}_point_${point_index}`"
        @mousedown="point_mousedown(polygon_index, point_index)"
        @mouseup="point_mouseup()"
        :class="point_classes(polygon_index,point_index)"
        :cx="point.x" :cy="point.y"/>




    </template>
  </svg>
</template>

<script>
export default {
  name: 'PolygonEditor',
  props: {
    polygons: {type: Array},
    mode: {type: String, default() {return 'polygon'}},
    selected_polygon_index: {type: Number, default() {return -1}},


  },
  data () {
    return {
      //selected_polygon_index: -1,
      selected_point_index: -1,
      grabbed_point_index: -1,
    }
  },
  mounted(){
    document.addEventListener("keydown", this.handle_keydown)
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handle_keydown)
  },
  methods: {

    handle_keydown(e){
      // Delete
      if (e.keyCode === 46) {
        e.preventDefault()
        this.delete_selected_item()
      }
      // Enter key
      else if (e.keyCode === 13) {
        e.preventDefault()
        this.finish_current_polygon()
      }


    },

    midpoint(p1,p2){
      return {
        x: p1.x + 0.5 * (p2.x -p1.x),
        y: p1.y + 0.5 * (p2.y -p1.y),
      }
    },

    area_clicked(){

    },
    area_mouseDown(event){

      const {offsetX: x, offsetY: y} = event

      if(!this.polygons) {
        this.$emit('create_polygons_array')
      }

      // Using NextTick because polygon array creation is done in parent

      this.$nextTick(() => {
        if(this.mode === 'polygon') {
          let polygon = this.polygons[this.selected_polygon_index]
          if(!polygon || !polygon.constructing) polygon = this.create_polygon()
          polygon.points.push({x,y})

        }

        else if(this.mode === 'rectangle') {
          const rectangle = this.create_polygon()

          // Add other points of the rectangle
          rectangle.points.push({x,y})
          rectangle.points.push({x,y: y+10})
          rectangle.points.push({x: x+10,y: y+10})
          rectangle.points.push({x: x+10,y})
        }
      })






    },

    area_mouseUp(){

      // Finish creation of rtectangle if this is what the user was doing
      const polygon = this.polygons[this.selected_polygon_index]
      if(this.mode === 'rectangle' && polygon && polygon.constructing) {
        this.finish_current_polygon()
      }

    },
    grab_point(polygon_index,point_index){
      this.select_polygon(polygon_index)
      this.selected_point_index = point_index
      this.grabbed_point_index = point_index
    },
    point_mousedown(polygon_index, point_index){
      /*
      Two potential actions
        1) while constructing, if first point clicked then construction mode off
        2) IF not constructing, then start grabbing the point to move it
      */
      const polygon = this.polygons[this.selected_polygon_index]
      if(polygon.constructing && point_index === 0) this.finish_current_polygon()
      else this.grab_point(polygon_index,point_index)

    },
    midpoint_clicked(event, polygon_index, point_index){
      const {offsetX: x, offsetY: y} = event
      this.select_polygon(polygon_index)
      const polygon = this.polygons[this.selected_polygon_index]
      polygon.points.splice(point_index+1, 0, {x,y})
      this.grab_point(polygon_index, point_index+1)
    },

    area_mouseMove(event){

      if(!this.polygons) return

      const {offsetX: x, offsetY: y} = event

      const polygon = this.polygons[this.selected_polygon_index]

      // Move the selected point of the selected polygon
      if(this.grabbed_point_index !== -1) {
        this.$set(polygon.points,this.grabbed_point_index,{x,y})
      }

      // Stuff related to rectangles
      if(this.mode === 'rectangle' && polygon && polygon.constructing) {
        const {x:startX,y:startY} = polygon.points[0]
        this.$set(polygon.points,1,{x:startX,y})
        this.$set(polygon.points,2,{x,y})
        this.$set(polygon.points,3,{x,y:startY})
      }

    },

    polygon_clicked(polygon_index){
      this.finish_current_polygon()
      this.select_polygon(polygon_index)
      this.selected_point_index = -1
    },

    polygon_svg_points(points){
      return `${points.reduce( (output,point) => output + ` ${point.x},${point.y}`, '' )}`
    },

    point_mouseup(){
      this.release_grabbed_point()
    },

    release_grabbed_point(){
      this.grabbed_point_index = -1
    },

    create_polygon(){

      const new_polygon = {
        points: [],
        constructing: true,
      }

      this.polygons.push(new_polygon)



      this.select_polygon(this.polygons.length -1)
      this.selected_point_index = -1

      const created_polygon = this.polygons[this.polygons.length -1]

      this.$emit('polygon_created', created_polygon)

      return created_polygon
    },

    select_polygon(index){
      this.$emit('update:selected_polygon_index', index)
    },

    delete_selected_item(){
      // Do nothing if no polygon selected
      if(this.selected_point_index !== -1) {
        const polygon = this.polygons[this.selected_polygon_index]
        if(polygon){
          polygon.points.splice(this.selected_point_index,1)
          this.selected_point_index = -1
        }
      }
      else if(this.selected_polygon_index !== -1){
        this.polygons.splice(this.selected_polygon_index,1)
        this.select_polygon(-1)
      }

    },



    finish_current_polygon(){
      const polygon = this.polygons[this.selected_polygon_index]
      if(!polygon) return
      polygon.constructing = false
      // maybe need a function for deleting the current polygon
      if(polygon.points.length < 3) {
        this.polygons.splice(this.selected_polygon_index,1)
        this.select_polygon(-1)
      }
    },

    polygon_classes(polygon_index){
      return {
        selected: polygon_index === this.selected_polygon_index
      }
    },

    point_classes(polygon_index, point_index){
      const polygon = this.polygons[this.selected_polygon_index]
      const polygon_constructing = polygon && polygon.constructing
      return {
        active: polygon_index === this.selected_polygon_index,
        start: polygon_index === this.selected_polygon_index && point_index === 0 && polygon_constructing,
        selected: polygon_index === this.selected_polygon_index && point_index === this.selected_point_index,
        grabbed: polygon_index === this.selected_polygon_index && point_index === this.grabbed_point_index,
      }
    },

    midpoint_classes(polygon_index){
      return {
        active: polygon_index === this.selected_polygon_index,
      }
    },

    midpoints(polygon){
      const points_copy = polygon.points.slice()

      if(!polygon.constructing || this.mode === 'rectangle') points_copy.push(points_copy[0])

      const points_sliced = points_copy.slice(0,-1)

      return points_sliced.map((point, index) => this.midpoint(point, points_copy[index+1])  )

    },


  },// End of methods

}
</script>

<style>


svg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  /* Prevent selection */
  user-select: none;
}

polyline {
  stroke: #c00000;
  fill: none;
  stroke-width: 0.2vw;
}

polygon {
  fill: #44444444;
  stroke: #444444;
  cursor: pointer;
  stroke-width: 0.2vw;
  transition: stroke 0.25s, fill 0.25s;
}

polygon.selected {
  fill: #c0000044;
  stroke: #c00000;
}


circle {
  transition:
    r 0.25s,
    fill 0.25s,
    stroke 0.25s,
    stroke-width 0.25s;
}
.vertex {
  cursor: grab;
  fill: #444444;
  r: 0; /* Invisible by default */
  stroke-width:0;


}

.vertex.active {
  /* i.e. part of a selected polygon */
  fill: #c00000;
  r: 0.5vw;
}

.vertex.start {
  r: 0.8vw;
  stroke: #c00000;
  stroke-width: 0.2vw;
  fill: transparent;
}

.vertex.selected {
  r: 0.8vw;
}

.vertex.grabbed {
  cursor: grabbing;
}

.midpoint {
  visibility: hidden;
  cursor: grab;
  fill: transparent;
  stroke: #c00000;
  r: 0;
}

.midpoint.active {
  cursor: grab;
  r: 0.4vw;
  visibility: visible;
}

button.active {
  background-color: #c00000;
}

</style>