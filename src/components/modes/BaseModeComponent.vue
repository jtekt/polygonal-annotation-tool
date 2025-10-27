<script>
export default {
    name: 'BaseModeComponent',
    props: {
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        mode: { type: String, required: true },
        selected_polygon_index: { type: Number, required: true },
        value: { type: Array, required: true },
        brushThickness: { type: Number, required: true },
        disableEvents: { type: Boolean, required: true },
        svg: { type: Object, required: true },
    },
    data() {
        return {
            selected_point_index: -1,
            grabbed_point_index: -1,
            mousePosition: { x: 0, y: 0 },
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handle_keydown)
        // Add mouse event listeners to the parent SVG
        this.$parent.$refs.svg.addEventListener('mousedown', this.onSvgMouseDown)
        this.$parent.$refs.svg.addEventListener('mouseup', this.onSvgMouseUp)
        this.$parent.$refs.svg.addEventListener('mousemove', this.onSvgMouseMove)
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handle_keydown)
        if (this.$parent.$refs.svg) {
            this.$parent.$refs.svg.removeEventListener('mousedown', this.onSvgMouseDown)
            this.$parent.$refs.svg.removeEventListener('mouseup', this.onSvgMouseUp)
            this.$parent.$refs.svg.removeEventListener('mousemove', this.onSvgMouseMove)
        }
    },
    methods: {
        // SVG event handlers that delegate to mode-specific methods
        onSvgMouseDown(event) {
            if (this.disableEvents) return
            if (event.target === this.$parent.$refs.svg) {
                this.area_mouseDown(event)
            }
        },
        
        onSvgMouseUp(event) {
            if (this.disableEvents) return
            this.area_mouseUp(event)
        },
        
        onSvgMouseMove(event) {
            if (this.disableEvents) return
            this.area_mouseMove(event)
        },

        // Common utility methods
        denormalize_point(point) {
            return {
                x: (this.svg.width * point.x) / this.width,
                y: (this.svg.height * point.y) / this.height,
            }
        },
        denormalize_points(points) {
            return points.map(this.denormalize_point)
        },
        normalize_point(point) {
            return {
                x: (this.width * point.x) / this.svg.width,
                y: (this.height * point.y) / this.svg.height,
            }
        },
        normalize_points(points) {
            return points.map(this.normalize_point)
        },
        getNormalizedMousePos(event) {
            const { offsetX: x, offsetY: y } = event
            return this.normalize_point({ x, y })
        },
        polygon_svg_points(points) {
            return this.denormalize_points(points).reduce(
                (output, point) => `${output} ${point.x},${point.y}`,
                ''
            )
        },
        create_polygon() {
            const new_polygon = {
                points: [],
                open: this.mode === 'polygon' || this.mode === 'polyline',
            }
            this.polygons.push(new_polygon)
            this.$emit('polygonCreated')
            this.select_polygon(this.polygons.length - 1)
            this.selected_point_index = -1
            return this.polygons[this.polygons.length - 1]
        },
        select_polygon(index) {
            this.$emit('update:selected_polygon_index', index)
        },
        handle_keydown(e) {
            if (this.disableEvents) return
            const { keyCode } = e
            if (keyCode === 46) { // Delete
                e.preventDefault()
                this.delete_selected_item()
            } else if (keyCode === 13 || keyCode === 27) { // Enter / Esc
                e.preventDefault()
                this.finish_editing()
            } else if (keyCode === 40) { // Down arrow
                e.preventDefault()
                const lastIndex = this.polygons.length - 1
                if (this.selected_polygon_index < lastIndex) {
                    this.select_polygon(this.selected_polygon_index + 1)
                }
            } else if (keyCode === 38) { // Up arrow
                e.preventDefault()
                if (this.selected_polygon_index > 0) {
                    this.select_polygon(this.selected_polygon_index - 1)
                }
            }
        },
        delete_selected_item() {
            if (!this.selectedPolygon) return
            if (this.selected_point_index !== -1) {
                this.selectedPolygon.points.splice(this.selected_point_index, 1)
                this.selected_point_index = -1
            } else if (this.selected_polygon_index !== -1) {
                this.polygons.splice(this.selected_polygon_index, 1)
                this.select_polygon(-1)
            }
        },
        point_mouseup() {
            this.grabbed_point_index = -1
        },

                // Abstract methods - must be implemented by child components
        finish_editing() {
            // Override in child components
        },
        area_mouseDown() {
            // Override in child components
        },
        area_mouseUp() {
            // Override in child components  
        },
        area_mouseMove(event) {
            // Override in child components
            this.mousePosition = this.getNormalizedMousePos(event)
        },
        point_mousedown() {
            // Override in child components
        },
    },
    computed: {
        polygons: {
            get() {
                return this.value || []
            },
            set(newValue) {
                this.$emit('input', newValue)
            },
        },
        selectedPolygon() {
            if (!this.polygons) return null
            if (this.selected_polygon_index < 0) return null
            return this.polygons[this.selected_polygon_index]
        },
    }
}
</script>