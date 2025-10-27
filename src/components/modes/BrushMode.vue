<template>
    <g>
        <!-- Existing polygons -->
        <g
            v-for="(polygon, polygon_index) in polygons"
            :key="`polygon_${polygon_index}`"
            @mousedown="area_mouseDown"
        >
            <!-- Polyline when polygon is not closed -->
            <polyline
                v-if="polygon.open"
                :points="polygon_svg_points(polygon.points)"
                :class="polyline_class(polygon_index)"
            />
            <!-- polygon when polygon is closed -->
            <polygon
                v-else
                :points="polygon_svg_points(polygon.points)"
                :class="polygon_classes(polygon_index)"
            />
            <!-- Vertices for selected polygon -->
            <template v-if="polygon_index === selected_polygon_index">
                <circle
                    class="vertex"
                    v-for="(point, point_index) in denormalize_points(
                        polygon.points
                    )"
                    :key="`polygon_${polygon_index}_point_${point_index}`"
                    @mouseup="!disableEvents && point_mouseup()"
                    :class="point_classes(polygon_index, point_index)"
                    :cx="point.x"
                    :cy="point.y"
                />
            </template>
        </g>

        <!-- Brush stroke preview -->
        <path
            v-if="currentStroke.length > 0"
            :d="strokeToPath(currentStroke)"
            :stroke-width="brushThickness * (svg.width / width)"
            :stroke="mode === 'brush' ? '#df4b26' : '#ffffff'"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="brush-preview"
        />

        <!-- Brush cursor -->
        <circle
            v-if="showCursor"
            :cx="denormalize_point(mousePosition).x"
            :cy="denormalize_point(mousePosition).y"
            :r="(brushThickness / 2) * (svg.width / width)"
            stroke="black"
            stroke-width="1"
            fill="transparent"
            class="brush-cursor"
            pointer-events="none"
        />
    </g>
</template>

<script>
import BaseModeComponent from './BaseModeComponent.vue'
import ClipperLib from 'clipper-lib'

export default {
    name: 'BrushMode',
    extends: BaseModeComponent,
    data() {
        return {
            isDrawing: false,
            currentStroke: [],
            showCursor: false,
            POLYGON_SIMPLIFICATION_TOLERANCE: 1.4, // higher = fewer points, less precise
            lastRecordedPoint: null,
        }
    },
    methods: {
        area_mouseDown(event) {
            // Don't prevent drawing if clicking inside selected polygon
            if (
                event.target.classList &&
                event.target.classList.contains('vertex')
            ) {
                return // Let vertex handling take precedence
            }

            if (!this.polygons) this.polygons = []

            this.isDrawing = true
            this.currentStroke = [this.mousePosition]
            this.lastRecordedPoint = this.mousePosition
        },

        area_mouseUp() {
            if (!this.isDrawing) return
            this.isDrawing = false

            if (this.currentStroke.length > 1 || this.mode === 'eraser') {
                const polygonPoints = this.strokeToPolygon(this.currentStroke)

                if (this.mode === 'brush') {
                    this.mergePolygonIntoExisting(polygonPoints)
                } else if (this.mode === 'eraser') {
                    this.subtractPolygonFromExisting(polygonPoints)
                }
            }

            this.currentStroke = []
        },

        area_mouseMove(event) {
            this.mousePosition = this.getNormalizedMousePos(event)
            this.showCursor = true

            if (this.isDrawing) {
                this.currentStroke.push(this.mousePosition)
                this.lastRecordedPoint = this.mousePosition
            }
        },

        getDistance(point1, point2) {
            const dx = point1.x - point2.x
            const dy = point1.y - point2.y
            return Math.sqrt(dx * dx + dy * dy)
        },

        strokeToPolygon(stroke) {
            // Convert stroke points to flat array format for ClipperLib
            const flatPoints = []
            stroke.forEach((point) => {
                flatPoints.push(point.x, point.y)
            })

            return this.lineToPolygon(flatPoints, this.brushThickness)
        },

        lineToPolygon(linePoints, strokeWidth) {
            const scale = 1000
            const path = []

            for (let i = 0; i < linePoints.length; i += 2) {
                path.push({
                    X: linePoints[i] * scale,
                    Y: linePoints[i + 1] * scale,
                })
            }

            const co = new ClipperLib.ClipperOffset()
            co.AddPath(
                path,
                ClipperLib.JoinType.jtRound,
                ClipperLib.EndType.etOpenRound
            )

            const offsetPaths = []
            co.Execute(offsetPaths, (strokeWidth / 2) * scale)

            // Simplify the generated polygon to reduce points
            const simplifiedPaths = []
            offsetPaths.forEach((path) => {
                const simplified = ClipperLib.JS.Lighten(
                    path,
                    this.POLYGON_SIMPLIFICATION_TOLERANCE * scale
                )

                simplifiedPaths.push(simplified)
            })

            const polygonPoints = []
            simplifiedPaths.forEach((p) => {
                p.forEach((pt) => {
                    polygonPoints.push(pt.X / scale, pt.Y / scale)
                })
            })

            return polygonPoints
        },

        strokeToPath(stroke) {
            if (stroke.length === 0) return ''

            const denormalizedPoints = stroke.map((point) =>
                this.denormalize_point(point)
            )
            let path = `M ${denormalizedPoints[0].x} ${denormalizedPoints[0].y}`

            for (let i = 1; i < denormalizedPoints.length; i++) {
                path += ` L ${denormalizedPoints[i].x} ${denormalizedPoints[i].y}`
            }

            return path
        },

        pointsToClipperPath(points) {
            const scale = 100
            const path = []
            for (let i = 0; i < points.length; i += 2) {
                path.push({ X: points[i] * scale, Y: points[i + 1] * scale })
            }
            return path
        },

        clipperPathsToPoints(paths) {
            const scale = 100
            const result = []
            paths.forEach((path) => {
                path.forEach((pt) => {
                    result.push(pt.X / scale, pt.Y / scale)
                })
            })
            return result
        },

        mergePolygonIntoExisting(newPolyPoints) {
            const newPath = this.pointsToClipperPath(newPolyPoints)

            if (this.selected_polygon_index === -1) {
                // If no polygon is selected, create a new one
                const finalPoints = this.clipperPathsToPoints([newPath])
                const convertedPoints = []
                for (let i = 0; i < finalPoints.length; i += 2) {
                    convertedPoints.push({
                        x: finalPoints[i],
                        y: finalPoints[i + 1],
                    })
                }

                this.polygons.push({
                    points: convertedPoints,
                    open: false,
                })

                // Select the newly created polygon
                this.select_polygon(this.polygons.length - 1)
                return
            }

            // If there is a selected polygon, try to merge only with that one
            const selectedPolygon = this.polygons[this.selected_polygon_index]
            const selectedPolyPoints = []
            selectedPolygon.points.forEach((point) => {
                selectedPolyPoints.push(point.x, point.y)
            })

            const selectedPath = this.pointsToClipperPath(selectedPolyPoints)

            // Check if the new stroke intersects with the selected polygon
            const clipperIntersect = new ClipperLib.Clipper()
            clipperIntersect.AddPath(
                selectedPath,
                ClipperLib.PolyType.ptSubject,
                true
            )
            clipperIntersect.AddPath(newPath, ClipperLib.PolyType.ptClip, true)

            const intersection = new ClipperLib.Paths()
            const hasIntersection = clipperIntersect.Execute(
                ClipperLib.ClipType.ctIntersection,
                intersection,
                ClipperLib.PolyFillType.pftNonZero,
                ClipperLib.PolyFillType.pftNonZero
            )

            if (hasIntersection && intersection.length > 0) {
                // Merge with the selected polygon
                const clipperUnion = new ClipperLib.Clipper()
                clipperUnion.AddPath(
                    selectedPath,
                    ClipperLib.PolyType.ptSubject,
                    true
                )
                clipperUnion.AddPath(newPath, ClipperLib.PolyType.ptClip, true)

                const union = new ClipperLib.Paths()
                const succeeded = clipperUnion.Execute(
                    ClipperLib.ClipType.ctUnion,
                    union,
                    ClipperLib.PolyFillType.pftNonZero,
                    ClipperLib.PolyFillType.pftNonZero
                )

                if (succeeded && union.length > 0) {
                    // Update the selected polygon with the merged result
                    const mergedPoints = this.clipperPathsToPoints([union[0]])
                    const convertedPoints = []
                    for (let i = 0; i < mergedPoints.length; i += 2) {
                        convertedPoints.push({
                            x: mergedPoints[i],
                            y: mergedPoints[i + 1],
                        })
                    }

                    // Replace the selected polygon with the merged version
                    this.$set(this.polygons, this.selected_polygon_index, {
                        points: convertedPoints,
                        open: false,
                    })
                }
            } else {
                // No collision with selected polygon, create a new one
                const finalPoints = this.clipperPathsToPoints([newPath])
                const convertedPoints = []
                for (let i = 0; i < finalPoints.length; i += 2) {
                    convertedPoints.push({
                        x: finalPoints[i],
                        y: finalPoints[i + 1],
                    })
                }

                this.polygons.push({
                    points: convertedPoints,
                    open: false,
                })

                // Select the newly created polygon
                this.select_polygon(this.polygons.length - 1)
            }
        },

        subtractPolygonFromExisting(subtractPoints) {
            if (this.selected_polygon_index === -1) return

            const selected = this.polygons[this.selected_polygon_index]
            const subtractPath = this.pointsToClipperPath(subtractPoints)
            const updatedPolygons = [...this.polygons] // Create a copy of the polygons array

            // Convert selected polygon's points to Clipper path
            const polyPoints = []
            selected.points.forEach((point) => {
                polyPoints.push(point.x, point.y)
            })
            const polyPath = this.pointsToClipperPath(polyPoints)

            // Perform the difference operation
            const clipperDiff = new ClipperLib.Clipper()
            clipperDiff.AddPath(polyPath, ClipperLib.PolyType.ptSubject, true)
            clipperDiff.AddPath(subtractPath, ClipperLib.PolyType.ptClip, true)

            const diffResult = new ClipperLib.Paths()
            const succeeded = clipperDiff.Execute(
                ClipperLib.ClipType.ctDifference,
                diffResult,
                ClipperLib.PolyFillType.pftNonZero,
                ClipperLib.PolyFillType.pftNonZero
            )

            if (succeeded && diffResult.length > 0) {
                const newPolygons = []
                diffResult.forEach((path) => {
                    const newPoints = this.clipperPathsToPoints([path])
                    const convertedPoints = []
                    for (let i = 0; i < newPoints.length; i += 2) {
                        convertedPoints.push({
                            x: newPoints[i],
                            y: newPoints[i + 1],
                        })
                    }
                    // Create a new polygon with the original properties
                    newPolygons.push({
                        ...selected, // Copy all properties from the original polygon
                        points: convertedPoints, // Update points with the new ones
                    })
                })

                // Replace the selected polygon with all new polygons
                updatedPolygons.splice(
                    this.selected_polygon_index,
                    1,
                    ...newPolygons
                )

                // Update the selected index to point to the first new polygon
                this.select_polygon(this.selected_polygon_index)
            } else {
                // If the operation failed or no result, remove the selected polygon
                updatedPolygons.splice(this.selected_polygon_index, 1)
                this.select_polygon(-1)
            }

            this.polygons = updatedPolygons
        },

        point_mouseup() {
            this.grabbed_point_index = -1
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

        finish_editing() {
            this.isDrawing = false
            this.currentStroke = []
            this.select_polygon(-1)
        },
    },
}
</script>

<style scoped>
.brush-preview {
    opacity: 0.8;
    pointer-events: none;
}

.brush-cursor {
    pointer-events: none;
    opacity: 0.5;
}
</style>
