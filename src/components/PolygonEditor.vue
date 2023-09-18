<template>
    <svg
        ref="svg"
        @mousedown.self="area_mouseDown()"
        @mouseup="area_mouseUp()"
        @mousemove="area_mouseMove($event)"
    >
        <template v-for="(polygon, polygon_index) in polygons">
            <!-- Polyline when polygon is not closed -->
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
                v-for="(point, point_index) in denormalize_points(
                    midpoints(polygon)
                )"
                :key="`polygon_${polygon_index}_midpoint_${point_index}`"
                :class="midpoint_classes(polygon_index, point_index)"
                @mousedown="midpoint_clicked(polygon_index, point_index)"
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
                @mousedown="point_mousedown(polygon_index, point_index)"
                @mouseup="point_mouseup()"
                :class="point_classes(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
        </template>

        <!-- Ghost (preview of new polygon segment) -->
        <polyline :points="ghost_polyline_points" class="ghost" />
    </svg>
</template>

<script>
import {
    normal_vector,
    vectorAdd,
    vectorScalarMul,
    midpoint,
} from '@/vectorUtils.js'

export default {
    name: 'PolygonEditor',
    props: {
        // TODO: no default, make normalization optional instead
        width: { type: Number, default: 800 },
        height: { type: Number, default: 600 },

        mode: { type: String, default: 'polygon' },
        selected_polygon_index: { type: Number, default: -1 },
        value: { type: Array },

        // Only used for brush mode
        brushThickness: { type: Number, default: 5 },
    },
    data() {
        return {
            selected_point_index: -1,
            grabbed_point_index: -1,
            rectanglePending: false,
            // Mouse position needed for the ghost
            mousePosition: {
                x: 0,
                y: 0,
            },
            svg: {
                width: 800,
                height: 600,
            },
            resizeObserver: new ResizeObserver(this.getSizeOfSvg),
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handle_keydown)
        this.resizeObserver.observe(this.$refs.svg)
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handle_keydown)
        this.resizeObserver.disconnect()
    },
    methods: {
        getSizeOfSvg() {
            if (!this.$refs.svg) return
            this.svg.width = this.$refs.svg.clientWidth
            this.svg.height = this.$refs.svg.clientHeight
        },
        handle_keydown(e) {
            // Could think of using arrow keys to navigate between polygons
            const { key, keyCode, ctrlKey } = e

            if (keyCode === 46) {
                // Delete
                e.preventDefault()
                this.delete_selected_item()
            } else if (keyCode === 13 || keyCode === 27) {
                // Enter / Esc: Finsih and deselect current polygon
                e.preventDefault()

                if (this.mode === 'polygon') this.close_polygon()
                this.cleanupInvalidPolygons()
                this.$emit('update:selected_polygon_index', -1)
            } else if (keyCode === 40) {
                // Down
                e.preventDefault()
                const lastIndex = this.polygons.length - 1
                if (this.selected_polygon_index < lastIndex)
                    this.$emit(
                        'update:selected_polygon_index',
                        this.selected_polygon_index + 1
                    )
            } else if (keyCode === 38) {
                // Up
                e.preventDefault()
                if (this.selected_polygon_index > 0)
                    this.$emit(
                        'update:selected_polygon_index',
                        this.selected_polygon_index - 1
                    )
            } else if (key === ' ') {
                // SpaceBar: Opening closing polygon
                e.preventDefault()
                this.toggle_current_polygon_open()
            } else if (ctrlKey) {
                // Ctrl Z for undo
                if (key === 'z') {
                    e.preventDefault()
                    this.undo_last_point()
                }
            }
        },

        area_mouseDown() {
            // Editor clicked

            if (!this.polygons) this.polygons = []

            // Using NextTick because polygon array creation is done in parent
            this.$nextTick(() => {
                if (this.mode === 'rectangle') {
                    this.rectanglePending = true
                    const rectangle = this.create_polygon()

                    const margin = 10

                    // Add other points of the rectangle
                    // Watch the order!
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
                } else {
                    // TODO: consider using computed instead
                    let polygon = this.getSelectedPolygon()

                    if (!polygon || (!polygon.open && this.mode !== 'brush'))
                        polygon = this.create_polygon()

                    if (this.mode === 'brush' && polygon.points.length) {
                        const { lower, upper } = this.computeBrushPoints()

                        const prevPointIndex =
                            this.selectedPolygon.points.length - 1
                        if (polygon.points.length === 1) {
                            polygon.points.push(upper)
                            polygon.points.unshift(lower)
                        } else {
                            polygon.points.splice(prevPointIndex, 1, upper)
                            polygon.points.unshift(lower)
                        }
                    }

                    polygon.points.push(this.mousePosition)
                }
            })
        },

        computeBrushPoints() {
            const prevPointIndex = this.selectedPolygon.points.length - 1
            const prevPoint = this.selectedPolygon.points[prevPointIndex]
            const middle = midpoint(this.mousePosition, prevPoint)
            const normal = normal_vector(this.mousePosition, middle)
            const lower = vectorAdd(
                middle,
                vectorScalarMul(this.brushThickness, normal)
            )
            const upper = vectorAdd(
                middle,
                vectorScalarMul(-this.brushThickness, normal)
            )
            return { upper, lower }
        },

        area_mouseUp() {
            // Finish creation of rectangle
            if (this.mode === 'rectangle' && this.rectanglePending)
                this.rectanglePending = false
        },
        grab_point(polygon_index, point_index) {
            this.select_polygon(polygon_index)
            this.selected_point_index = point_index
            this.grabbed_point_index = point_index
        },
        point_mousedown(polygon_index, point_index) {
            this.select_polygon(polygon_index)

            // In polygon mode, close polygon if first point clicked
            if (
                point_index === 0 &&
                this.mode === 'polygon' &&
                this.selectedPolygon?.open
            )
                this.close_polygon()
            else this.grab_point(polygon_index, point_index)
        },

        close_polygon() {
            if (this.selectedPolygon?.open) this.selectedPolygon.open = false
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

        area_mouseMove(event) {
            // Move grabbed points or create rectangle

            // Save mouse Position for Ghost
            this.mousePosition = this.getNormalizedMousePos(event)

            // FIXME: Something here is slow

            if (!this.selectedPolygon) return

            // Move the selected point of the selected polygon
            if (this.grabbed_point_index !== -1)
                this.$set(
                    this.selectedPolygon.points,
                    this.grabbed_point_index,
                    this.mousePosition
                )

            // Stuff related to rectangles
            if (this.mode === 'rectangle' && this.rectanglePending) {
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

        polygon_clicked(polygon_index) {
            this.select_polygon(polygon_index)
            this.selected_point_index = -1
        },

        polyline_clicked(polygon_index) {
            this.polygon_clicked(polygon_index)
        },

        polygon_svg_points(points) {
            // Creates the svg attribute for point positions
            return this.denormalize_points(points).reduce(
                (output, point) => `${output} ${point.x},${point.y}`,
                ''
            )
        },

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
            // Convert point into original image coordinates
            return {
                x: (this.width * point.x) / this.svg.width,
                y: (this.height * point.y) / this.svg.height,
            }
        },

        normalize_points(points) {
            return points.map(this.normalize_point)
        },

        point_mouseup() {
            // Release grabbed point
            this.grabbed_point_index = -1
        },

        getNormalizedMousePos(event) {
            const { offsetX: x, offsetY: y } = event
            return this.normalize_point({ x, y })
        },

        create_polygon() {
            const new_polyon = {
                points: [],
                open: this.mode === 'polygon' || this.mode === 'polyline',
            }

            this.polygons.push(new_polyon)
            this.$emit('polygonCreated')
            this.select_polygon(this.polygons.length - 1)
            this.selected_point_index = -1

            return this.polygons[this.polygons.length - 1]
        },

        select_polygon(index) {
            // Sync with parent
            this.$emit('update:selected_polygon_index', index)
        },

        delete_selected_item() {
            // iF a point is selected, delete the point
            if (!this.selectedPolygon) return
            if (this.selected_point_index !== -1) {
                this.selectedPolygon.points.splice(this.selected_point_index, 1)
                this.selected_point_index = -1
            }
            // If no point is selected, delete the polygon
            else if (this.selected_polygon_index !== -1) {
                this.polygons.splice(this.selected_polygon_index, 1)
                this.select_polygon(-1)
            }
        },

        undo_last_point() {
            if (!this.selectedPolygon || !this.selectedPolygon.open) return
            this.selectedPolygon.points.pop()
        },

        close_current_polygon() {
            if (!this.selectedPolygon) return
            this.selectedPolygon.open = false
        },

        open_current_polygon() {
            if (!this.selectedPolygon) return
            this.selectedPolygon.open = false
        },

        toggle_current_polygon_open() {
            if (!this.selectedPolygon) return
            this.selectedPolygon.open = !this.selectedPolygon.open
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

        getSelectedPolygon() {
            return this.polygons[this.selected_polygon_index]
        },

        point_classes(polygon_index, point_index) {
            // TODO: consider using the computed value
            const selectedPolygon = this.getSelectedPolygon()
            const lastPointIndex = selectedPolygon
                ? selectedPolygon.points.length - 1
                : -1

            // const polygon_constructing = selectedPolygon && selectedPolygon.constructing
            const polygonOpen = selectedPolygon && selectedPolygon.open

            return {
                active: polygon_index === this.selected_polygon_index,
                start:
                    polygon_index === this.selected_polygon_index &&
                    point_index === 0 &&
                    polygonOpen &&
                    this.mode === 'polygon',
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
            if (!polygon.open || this.mode === 'rectangle')
                points_copy.push(points_copy[0])
            const points_sliced = points_copy.slice(0, -1)
            return points_sliced.map((point, index) =>
                midpoint(point, points_copy[index + 1])
            )
        },
    }, // End of methods
    computed: {
        polygons: {
            get() {
                return this.value
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
        ghost_polyline_points() {
            // This requires the computed value
            const points = [this.mousePosition]

            if (this.mode === 'polygon' && this.selectedPolygon?.open) {
                const lastPoint =
                    this.selectedPolygon.points[
                        this.selectedPolygon.points.length - 1
                    ]
                if (lastPoint) points.push(lastPoint)
            } else if (
                this.mode === 'polyline' &&
                this.selectedPolygon?.points.length >= 1
            ) {
                const lastPoint =
                    this.selectedPolygon.points[
                        this.selectedPolygon.points.length - 1
                    ]
                if (lastPoint) points.push(lastPoint)
            } else if (
                this.mode === 'brush' &&
                this.selectedPolygon?.points.length
            ) {
                const { upper, lower } = this.computeBrushPoints()
                const lastPoint =
                    this.selectedPolygon.points[
                        this.selectedPolygon.points.length - 1
                    ]

                if (
                    !isNaN(upper.x) &&
                    !isNaN(upper.y) &&
                    !isNaN(lower.x) &&
                    !isNaN(lower.y)
                ) {
                    if (this.selectedPolygon?.points.length === 1) {
                        points.push(upper)
                        points.unshift(lower)
                        points.push(lastPoint)
                        points.push(lower)
                    } else if (this.selectedPolygon?.points.length >= 1) {
                        points.push(upper)
                        points.push(
                            this.selectedPolygon.points[
                                this.selectedPolygon.points.length - 2
                            ]
                        )
                        points.unshift(lower)
                        points.unshift(this.selectedPolygon.points[0])
                    }
                }
            }

            return this.polygon_svg_points(points)
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
    stroke-width: 2px;
    cursor: pointer;
}

polyline.selected {
    stroke: #c00000;
}

polygon {
    fill: #c0000022;
    cursor: pointer;
    stroke-width: 2px;
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
    r: 2.5px; /* Small by default */
    stroke-width: 0;
}

.vertex.active {
    /* i.e. point of a selected polygon */
    fill: #c00000;
    r: 5px;
}

.vertex.start {
    r: 8px;
    stroke: #c00000;
    stroke-width: 2px;
    fill: transparent;
}

.vertex.selected {
    r: 8px;
    fill: white;
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
    r: 4px;
    visibility: visible;
}

button.active {
    background-color: #c00000;
}

.ghost {
    pointer-events: none;
}
</style>
