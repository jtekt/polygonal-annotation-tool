<template>
    <g>
        <g v-for="(polygon, polygon_index) in polygons" :key="`polygon_${polygon_index}`">
            <polygon
                :points="polygon_svg_points(polygon.points)"
                :class="polygon_classes(polygon_index)"
                @click="!disableEvents && polygon_clicked(polygon_index)"
            />
            <!-- midpoints between vertices -->
            <circle
                class="midpoint"
                v-for="(point, point_index) in denormalize_points(midpoints(polygon))"
                :key="`polygon_${polygon_index}_midpoint_${point_index}`"
                :class="midpoint_classes(polygon_index, point_index)"
                @mousedown="!disableEvents && midpoint_clicked(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
            <!-- polygon vertices (points) -->
            <circle
                class="vertex"
                v-for="(point, point_index) in denormalize_points(polygon.points)"
                :key="`polygon_${polygon_index}_point_${point_index}`"
                @mousedown="!disableEvents && point_mousedown(polygon_index, point_index)"
                @mouseup="!disableEvents && point_mouseup()"
                :class="point_classes(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
        </g>
    </g>
</template>

<script>
import BaseModeComponent from './BaseModeComponent.vue'
import { midpoint } from '@/vectorUtils.js'

export default {
    name: 'RectangleMode',
    extends: BaseModeComponent,
    data() {
        return {
            rectanglePending: false,
        }
    },
    methods: {
        area_mouseDown() {
            if (!this.polygons) this.polygons = []
            
            this.$nextTick(() => {
                this.rectanglePending = true
                const rectangle = this.create_polygon()
                const margin = 10

                // Add rectangle points in correct order
                rectangle.points.push(this.mousePosition)
                rectangle.points.push({
                    x: this.mousePosition.x,
                    y: this.mousePosition.y + margin,
                })
                rectangle.points.push({
                    x: this.mousePosition.x + margin,
                    y: this.mousePosition.y + margin,
                })
                rectangle.points.push({
                    x: this.mousePosition.x + margin,
                    y: this.mousePosition.y,
                })
            })
        },

        area_mouseUp() {
            if (this.rectanglePending) {
                this.rectanglePending = false
            }
        },

        area_mouseMove(event) {
            this.mousePosition = this.getNormalizedMousePos(event)
            
            if (!this.selectedPolygon) return
            
            // Move grabbed point
            if (this.grabbed_point_index !== -1) {
                this.$set(
                    this.selectedPolygon.points,
                    this.grabbed_point_index,
                    this.mousePosition
                )
            }
            
            // Update rectangle while being created
                        if (this.rectanglePending) {
                const rectanglePoint = this.selectedPolygon.points[0]
                const { x: startX, y: startY } = rectanglePoint
                
                this.$set(this.selectedPolygon.points, 1, {
                    x: startX,
                    y: this.mousePosition.y,
                })
                this.$set(this.selectedPolygon.points, 2, this.mousePosition)
                this.$set(this.selectedPolygon.points, 3, {
                    x: this.mousePosition.x,
                    y: startY,
                })
            }
        },

        point_mousedown(polygon_index, point_index) {
            this.select_polygon(polygon_index)
            this.grab_point(polygon_index, point_index)
        },

        grab_point(polygon_index, point_index) {
            this.select_polygon(polygon_index)
            this.selected_point_index = point_index
            this.grabbed_point_index = point_index
        },

        midpoint_clicked(polygon_index, point_index) {
            if (!this.selectedPolygon) return
            this.selectedPolygon.points.splice(
                point_index + 1,
                0,
                this.mousePosition
            )
            this.grab_point(polygon_index, point_index + 1)
        },

        polygon_clicked(polygon_index) {
            this.select_polygon(polygon_index)
            this.selected_point_index = -1
        },

        polygon_classes(polygon_index) {
            return {
                selected: polygon_index === this.selected_polygon_index,
            }
        },

        point_classes(polygon_index, point_index) {
            return {
                active: polygon_index === this.selected_polygon_index,
                selected:
                    polygon_index === this.selected_polygon_index &&
                    point_index === this.selected_point_index,
                grabbed:
                    polygon_index === this.selected_polygon_index &&
                    point_index === this.grabbed_point_index,
            }
        },

        midpoint_classes(polygon_index) {
            return {
                active: polygon_index === this.selected_polygon_index,
            }
        },

        midpoints(polygon) {
            const points_copy = polygon.points.slice()
            points_copy.push(points_copy[0]) // Close the rectangle
            const points_sliced = points_copy.slice(0, -1)
            return points_sliced.map((point, index) =>
                midpoint(point, points_copy[index + 1])
            )
        },

        finish_editing() {
            this.rectanglePending = false
            this.select_polygon(-1)
        },

        create_polygon() {
            const new_polygon = {
                points: [],
                open: false, // Rectangles are always closed
            }
            this.polygons.push(new_polygon)
            this.$emit('polygonCreated')
            this.select_polygon(this.polygons.length - 1)
            this.selected_point_index = -1
            return this.polygons[this.polygons.length - 1]
        }
    }
}
</script>