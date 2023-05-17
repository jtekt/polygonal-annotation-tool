<template>
  <svg
    ref="svg"
    :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
    @mousedown.self="area_mouseDown($event)"
    @mouseup="area_mouseUp($event)"
    @mousemove="area_mouseMove($event)"
  >
    <!-- template to wrap v-for -->
    <template v-for="(polygon, polygon_index) in polygons">
      <!-- Polyline when polygon is not closed -->
      <!-- TODO: polyline too -->
      <polyline
        v-if="polygon.open"
        :points="polygon_svg_points(polygon.points)"
        :key="`polyline_${polygon_index}`"
        :class="polyline_class(polygon_index)"
        @click="polyline_clicked(polygon_index)"
      />

      <!-- polygon when polygon is closed -->
      <polygon
        v-else
        :points="polygon_svg_points(polygon.points)"
        :key="`polygon_${polygon_index}`"
        :class="polygon_classes(polygon_index)"
        @click="polygon_clicked(polygon_index)"
      />

      <!-- midpoints between vertices -->
      <circle
        class="midpoint"
        v-for="(point, point_index) in denormalize_points(midpoints(polygon))"
        :key="`polygon_${polygon_index}_midpoint_${point_index}`"
        :class="midpoint_classes(polygon_index, point_index)"
        @mousedown="midpoint_clicked($event, polygon_index, point_index)"
        :cx="point.x"
        :cy="point.y"
      />

      <!-- polygon vertices (points) -->
      <circle
        class="vertex"
        v-for="(point, point_index) in denormalize_points(polygon.points)"
        :key="`polygon_${polygon_index}_point_${point_index}`"
        @mousedown="point_mousedown(polygon_index, point_index)"
        @mouseup="point_mouseup()"
        :class="point_classes(polygon_index, point_index)"
        :cx="point.x"
        :cy="point.y"
      />
    </template>
  </svg>
</template>

<script>
export default {
  name: "PolygonEditor",
  props: {
    // TODO: no default, make normalization optional instead
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },

    mode: { type: String, default: "polygon" },
    selected_polygon_index: { type: Number, default: -1 },
    value: { type: Array },
  },
  data() {
    return {
      selected_point_index: -1,
      grabbed_point_index: -1,
      rectanglePending: false,
    }
  },
  mounted() {
    document.addEventListener("keydown", this.handle_keydown)
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handle_keydown)
  },
  methods: {
    handle_keydown(e) {
      // Could think of using arrow keys to navigate between polygons
      if (e.keyCode === 46) {
        // Delete
        e.preventDefault()
        this.delete_selected_item()
      } else if (e.keyCode === 13) {
        // Enter key: Create a new polygon
        e.preventDefault()

        if (this.mode === "polygon") this.close_polygon()
        this.cleanupInvalidPolygons()
        // nextTick because cleanup will remove the newly created polygon otherwise
        this.$nextTick(() => {
          this.create_polygon()
        })
      } else if (e.keyCode === 40) {
        // Down
        e.preventDefault()
        const lastIndex = this.polygons.length - 1
        if (this.selected_polygon_index < lastIndex)
          this.$emit(
            "update:selected_polygon_index",
            this.selected_polygon_index + 1
          )
      } else if (e.keyCode === 38) {
        // Up
        e.preventDefault()
        if (this.selected_polygon_index > 0)
          this.$emit(
            "update:selected_polygon_index",
            this.selected_polygon_index - 1
          )
      } else if (e.key === " ") {
        // SpaceBar: Opening closing polygon
        e.preventDefault()
        this.toggle_current_polygon_open()
      } else if (e.ctrlKey) {
        // Ctrl Z for undo
        if (e.key === "z") {
          e.preventDefault()
          this.undo_last_point()
        }
      }
    },

    midpoint(p1, p2) {
      return {
        x: p1.x + 0.5 * (p2.x - p1.x),
        y: p1.y + 0.5 * (p2.y - p1.y),
      }
    },
    area_mouseDown(event) {
      // Editor clicked

      const { offsetX: x, offsetY: y } = event
      const mousePoint = this.normalize_point({ x, y })

      if (!this.polygons) this.polygons = []

      // Using NextTick because polygon array creation is done in parent
      // FIXME: REALLY?
      // TODO: would be better without needing this
      this.$nextTick(() => {
        if (this.mode === "rectangle") {
          this.rectanglePending = true
          const rectangle = this.create_polygon()

          const margin = 10

          // Add other points of the rectangle
          // Watch the order!
          rectangle.points.push(mousePoint)
          rectangle.points.push({ x: mousePoint.x, y: mousePoint.y + margin })
          rectangle.points.push({
            x: mousePoint.x + margin,
            y: mousePoint.y + margin,
          })
          rectangle.points.push({ x: mousePoint.x + margin, y: mousePoint.y })
        } else {
          let polygon = this.polygons[this.selected_polygon_index]
          // FIXME: if polygon is closed, should not allow to add points
          // TODO: consider not creating polygon if not open
          if (!polygon || !polygon.open) polygon = this.create_polygon()
          polygon.points.push(mousePoint)
        }
      })
    },

    area_mouseUp() {
      // Finish creation of rectangle if this is what the user was doing

      if (this.mode === "rectangle" && this.rectanglePending) {
        this.rectanglePending = false
        const polygon = this.polygons[this.selected_polygon_index]
        if (!polygon) return
        polygon.open = false
      }
    },
    grab_point(polygon_index, point_index) {
      this.select_polygon(polygon_index)
      this.selected_point_index = point_index
      this.grabbed_point_index = point_index
    },
    point_mousedown(polygon_index, point_index) {
      /*
      Grabbing points or closing polygon if polygon mode
      */
      this.select_polygon(polygon_index)

      if (point_index === 0 && this.mode === "polygon") {
        this.close_polygon()
      } else this.grab_point(polygon_index, point_index)
    },

    close_polygon() {
      const polygon = this.polygons[this.selected_polygon_index]
      if (!polygon) return
      if (polygon.open) {
        polygon.open = false
      }
    },
    midpoint_clicked(event, polygon_index, point_index) {
      // Create a new point at the midpoint of an edge
      this.select_polygon(polygon_index)
      const { offsetX: x, offsetY: y } = event
      const mousePoint = this.normalize_point({ x, y })
      const polygon = this.polygons[this.selected_polygon_index]
      polygon.points.splice(point_index + 1, 0, mousePoint)
      this.grab_point(polygon_index, point_index + 1)
    },

    area_mouseMove(event) {
      // Move grabbed points or create rectangle

      if (!this.polygons) return

      const polygon = this.polygons[this.selected_polygon_index]

      const { offsetX: x, offsetY: y } = event
      const mousePoint = this.normalize_point({ x, y })

      // Move the selected point of the selected polygon
      if (this.grabbed_point_index !== -1)
        this.$set(polygon.points, this.grabbed_point_index, mousePoint)

      // Stuff related to rectangles
      if (this.mode === "rectangle" && polygon && this.rectanglePending) {
        const rectanglePoint = polygon.points[0]
        const { x: startX, y: startY } = rectanglePoint

        this.$set(polygon.points, 1, { x: startX, y: mousePoint.y })
        this.$set(polygon.points, 2, mousePoint)
        this.$set(polygon.points, 3, { x: mousePoint.x, y: startY })
      }
    },

    polygon_clicked(polygon_index) {
      this.select_polygon(polygon_index)
      this.selected_point_index = -1
    },

    polyline_clicked(polygon_index) {
      this.select_polygon(polygon_index)
      this.selected_point_index = -1
    },

    polygon_svg_points(points) {
      // Creates the svg attribute for point positions
      // return points.reduce((output, point) => `${output} ${point.x},${point.y}`, '' )
      return this.denormalize_points(points).reduce(
        (output, point) => `${output} ${point.x},${point.y}`,
        ""
      )
    },

    denormalize_point(point) {
      return {
        x: (this.viewBox.width * point.x) / this.width,
        y: (this.viewBox.height * point.y) / this.height,
      }
    },

    denormalize_points(points) {
      return points.map(this.denormalize_point)
    },

    normalize_point(point) {
      // Convert point into original image coordinates
      const { clientWidth, clientHeight } = this.$refs.svg
      return {
        x: (this.width * point.x) / clientWidth,
        y: (this.height * point.y) / clientHeight,
      }
    },

    normalize_points(points) {
      return points.map(this.normalize_point)
    },

    point_mouseup() {
      // Release grabbed point
      this.grabbed_point_index = -1
    },

    create_polygon() {
      const new_polyon = {
        points: [],
        open: true,
      }
      this.polygons.push(new_polyon)
      // TODO: check what this emit does
      this.$emit("polygonCreated")

      this.select_polygon(this.polygons.length - 1)
      this.selected_point_index = -1

      return this.polygons[this.polygons.length - 1]
    },

    select_polygon(index) {
      // Sync with parent
      this.$emit("update:selected_polygon_index", index)
    },

    delete_selected_item() {
      // iF a point is selected, delete the point
      if (this.selected_point_index !== -1) {
        const polygon = this.polygons[this.selected_polygon_index]
        if (polygon) {
          polygon.points.splice(this.selected_point_index, 1)
          this.selected_point_index = -1
        }
      }
      // If no point is selected, delete the polygon
      else if (this.selected_polygon_index !== -1) {
        this.polygons.splice(this.selected_polygon_index, 1)
        this.select_polygon(-1)
      }
    },

    undo_last_point() {
      const polygon = this.polygons[this.selected_polygon_index]
      if (!polygon || !polygon.open) return
      polygon.points.pop()
    },

    close_current_polygon() {
      const polygon = this.polygons[this.selected_polygon_index]
      if (!polygon) return
      polygon.open = false
    },

    open_current_polygon() {
      const polygon = this.polygons[this.selected_polygon_index]
      if (!polygon) return
      polygon.open = false
    },

    toggle_current_polygon_open() {
      const polygon = this.polygons[this.selected_polygon_index]
      if (!polygon) return
      polygon.open = !polygon.open
    },

    cleanupInvalidPolygons() {
      this.polygons = this.polygons.filter(
        (polygon) => polygon.points.length > 1
      )
    },

    polygon_classes(polygon_index) {
      return {
        selected: polygon_index === this.selected_polygon_index,
      }
    },

    polyline_class(polygon_index) {
      return {
        selected: polygon_index === this.selected_polygon_index,
      }
    },

    point_classes(polygon_index, point_index) {
      const selectedPolygon = this.polygons[this.selected_polygon_index]
      const lastPointIndex = selectedPolygon
        ? selectedPolygon.points.length - 1
        : -1

      // const polygon_constructing = selectedPolygon && selectedPolygon.constructing
      const polygonOpen = selectedPolygon && selectedPolygon.open

      return {
        active: polygon_index === this.selected_polygon_index,
        // start:
        //   polygon_index === this.selected_polygon_index &&
        //   point_index === 0
        //   && polygon_constructing,
        selected:
          polygon_index === this.selected_polygon_index &&
          point_index === this.selected_point_index,
        grabbed:
          polygon_index === this.selected_polygon_index &&
          point_index === this.grabbed_point_index,
        last:
          polygon_index === this.selected_polygon_index &&
          point_index === lastPointIndex &&
          polygonOpen,
      }
    },

    midpoint_classes(polygon_index) {
      return {
        active: polygon_index === this.selected_polygon_index,
      }
    },

    midpoints(polygon) {
      // Computes a list of midpoints for the given polygon
      const points_copy = polygon.points.slice()
      if (!polygon.open || this.mode === "rectangle")
        points_copy.push(points_copy[0])
      const points_sliced = points_copy.slice(0, -1)
      return points_sliced.map((point, index) =>
        this.midpoint(point, points_copy[index + 1])
      )
    },
  }, // End of methods
  computed: {
    viewBox() {
      // ViewBox parameters
      // Height is computed using aspect ratio
      // ViewBox Width is set independently so that lines and points don't look smaller or bigger depending on image size
      // NOTE: could use px for those, just to make things easier to work with
      const aspectRatio = this.height / this.width
      const width = 1000
      const height = width * aspectRatio
      return { width, height }
    },
    polygons: {
      get() {
        return this.value
      },
      set(newValue) {
        this.$emit("input", newValue)
      },
    },
  },
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

polygon,
polyline {
  stroke: #c0000066;
}
polyline {
  fill: none;
  stroke-width: 0.2vw;
  cursor: pointer;
}

polyline.selected {
  stroke: #c00000;
}

polygon {
  fill: #c0000022;
  cursor: pointer;
  stroke-width: 0.2vw;
  transition: stroke 0.25s, fill 0.25s;
}

polygon.selected {
  fill: #c0000044;
  stroke: #c00000;
}

circle {
  transition: r 0.25s, fill 0.25s, stroke 0.25s, stroke-width 0.25s;
}

.vertex {
  cursor: grab;
  fill: #c0000044;
  r: 0.25vw; /* Small by default */
  stroke-width: 0;
}

.vertex.active {
  /* i.e. point of a selected polygon */
  fill: #c00000;
  r: 0.5vw;
}

.vertex.start {
  r: 0.8vw;
  stroke: #c00000;
  stroke-width: 0.2vw;
  fill: transparent;
}

.vertex.last {
  r: 0.5vw;
  fill: white;
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
