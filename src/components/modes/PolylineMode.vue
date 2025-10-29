<template>
    <g>
        <g
            v-for="(polygon, polygon_index) in polygons"
            :key="`polygon_${polygon_index}`"
        >
            <!-- Polyline when polygon is not closed -->
            <polyline
                v-if="polygon.open"
                :points="polygon_svg_points(polygon.points)"
                :class="polyline_class(polygon_index)"
                @click="!disableEvents && polyline_clicked(polygon_index)"
            />
            <!-- polygon when polygon is closed -->
            <polygon
                v-else
                :points="polygon_svg_points(polygon.points)"
                :class="polygon_classes(polygon_index)"
            />
            <!-- midpoints between vertices -->
            <circle
                class="midpoint"
                v-for="(point, point_index) in denormalize_points(
                    midpoints(polygon)
                )"
                :key="`polygon_${polygon_index}_midpoint_${point_index}`"
                :class="midpoint_classes(polygon_index, point_index)"
                @mousedown="
                    !disableEvents &&
                        midpoint_clicked(polygon_index, point_index)
                "
                :cx="point.x"
                :cy="point.y"
            />
            <!-- polygon vertices (points) -->
            <circle
                class="vertex"
                v-for="(point, point_index) in denormalize_points(
                    polygon.points
                )"
                :key="`polygon_${polygon_index}_point_${point_index}`"
                @mousedown="
                    !disableEvents &&
                        point_mousedown(polygon_index, point_index)
                "
                @mouseup="!disableEvents && point_mouseup()"
                :class="point_classes(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
        </g>
        <!-- Ghost (preview of new polyline segment) -->
        <polyline :points="ghost_polyline_points" class="ghost" />
    </g>
</template>

<script>
import BaseModeComponent from './BaseModeComponent.vue'
import { midpoint } from '@/vectorUtils.js'

export default {
    name: 'PolylineMode',
    extends: BaseModeComponent,
    methods: {
        area_mouseDown() {
            if (!this.polygons) this.polygons = []

            this.$nextTick(() => {
                let polygon = this.getSelectedPolygon()
                if (!polygon || !polygon.open) {
                    polygon = this.create_polygon()
                }
                polygon.points.push(this.mousePosition)
            })
        },

        area_mouseUp() {
            // No specific action needed for polyline mode
        },

        area_mouseMove(event) {
            this.mousePosition = this.getNormalizedMousePos(event)

            if (this.grabbed_point_index !== -1 && this.selectedPolygon) {
                this.$set(
                    this.selectedPolygon.points,
                    this.grabbed_point_index,
                    this.mousePosition
                )
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

        polyline_clicked(polygon_index) {
            this.select_polygon(polygon_index)
            this.selected_point_index = -1
        },

        getSelectedPolygon() {
            return this.polygons[this.selected_polygon_index]
        },

        point_classes(polygon_index, point_index) {
            const selectedPolygon = this.getSelectedPolygon()
            const lastPointIndex = selectedPolygon
                ? selectedPolygon.points.length - 1
                : -1

            return {
                active: polygon_index === this.selected_polygon_index,
                selected:
                    polygon_index === this.selected_polygon_index &&
                    point_index === this.selected_point_index,
                grabbed:
                    polygon_index === this.selected_polygon_index &&
                    point_index === this.grabbed_point_index,
                last:
                    polygon_index === this.selected_polygon_index &&
                    point_index === lastPointIndex,
            }
        },

        midpoint_classes(polygon_index) {
            return {
                active: polygon_index === this.selected_polygon_index,
            }
        },

        midpoints(polygon) {
            const points_copy = polygon.points.slice()
            // Don't close polylines - no connection from last to first point
            const points_sliced = points_copy.slice(0, -1)
            return points_sliced.map((point, index) =>
                midpoint(point, points_copy[index + 1])
            )
        },

        finish_editing() {
            this.cleanupInvalidPolygons()
            this.select_polygon(-1)
        },

        cleanupInvalidPolygons() {
            this.polygons = this.polygons.filter(
                (polygon) => polygon.points.length > 1
            )
        },

        handle_keydown(e) {
            if (this.disableEvents) return

            const { key, keyCode, ctrlKey } = e

            if (keyCode === 46) {
                e.preventDefault()
                this.delete_selected_item()
            } else if (keyCode === 13 || keyCode === 27) {
                e.preventDefault()
                this.finish_editing()
            } else if (ctrlKey && key === 'z') {
                e.preventDefault()
                this.undo_last_point()
            }
        },

        undo_last_point() {
            if (!this.selectedPolygon || !this.selectedPolygon.open) return
            this.selectedPolygon.points.pop()
        },

        create_polygon() {
            const new_polygon = {
                points: [],
                open: true, // Polylines are always open
            }
            this.polygons.push(new_polygon)
            this.$emit('polygonCreated')
            this.select_polygon(this.polygons.length - 1)
            this.selected_point_index = -1
            return this.polygons[this.polygons.length - 1]
        },
    },

    computed: {
        ghost_polyline_points() {
            const points = [this.mousePosition]

            if (
                this.selectedPolygon?.open &&
                this.selectedPolygon.points.length >= 1
            ) {
                const lastPoint =
                    this.selectedPolygon.points[
                        this.selectedPolygon.points.length - 1
                    ]
                if (lastPoint) points.push(lastPoint)
            }

            return this.polygon_svg_points(points)
        },
    },
}
</script>
