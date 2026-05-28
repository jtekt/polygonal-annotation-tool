<template>
    <g>
        <g
            v-for="(polygon, polygon_index) in polygons"
            :key="`polygon_${polygon_index}`"
            @mousedown="area_mouseDown"
        >
            <polyline
                v-if="polygon.open"
                :points="polygon_svg_points(polygon.points)"
                :class="polyline_class(polygon_index)"
            />
            <polygon
                v-else
                :points="polygon_svg_points(polygon.points)"
                :class="polygon_classes(polygon_index)"
            />
            <template v-if="polygon_index === selectedPolygonIndex">
                <circle
                    class="vertex"
                    v-for="(point, point_index) in denormalize_points(polygon.points)"
                    :key="`polygon_${polygon_index}_point_${point_index}`"
                    @mouseup="!disableEvents && point_mouseup()"
                    :class="point_classes(polygon_index, point_index)"
                    :cx="point.x"
                    :cy="point.y"
                />
            </template>
        </g>

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

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useBaseMode, type Polygon, type Point } from '@/composables/useBaseMode'
import ClipperLib from 'clipper-lib'

const props = defineProps<{
    width: number
    height: number
    mode: string
    selectedPolygonIndex: number
    modelValue: Polygon[]
    brushThickness: number
    disableEvents: boolean
    svg: { width: number; height: number }
}>()

const emit = defineEmits<{
    'update:modelValue': [value: Polygon[]]
    'update:selectedPolygonIndex': [index: number]
    polygonCreated: []
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base = useBaseMode(props, emit as any)
const {
    svgEl,
    selected_point_index,
    grabbed_point_index,
    mousePosition,
    polygons,
    selectedPolygon,
    denormalize_point,
    denormalize_points,
    getNormalizedMousePos,
    polygon_svg_points,
    select_polygon,
    delete_selected_item,
    point_mouseup,
    polygon_classes,
    polyline_class,
} = base

const POLYGON_SIMPLIFICATION_TOLERANCE = 1.4
const isDrawing = ref(false)
const currentStroke = ref<Point[]>([])
const showCursor = ref(false)

function point_classes(polygon_index: number, point_index: number) {
    return {
        active: polygon_index === props.selectedPolygonIndex,
        selected:
            polygon_index === props.selectedPolygonIndex &&
            point_index === selected_point_index.value,
        grabbed:
            polygon_index === props.selectedPolygonIndex &&
            point_index === grabbed_point_index.value,
    }
}

function area_mouseDown(event: MouseEvent) {
    if (event.target instanceof Element && event.target.classList.contains('vertex')) return
    if (props.disableEvents) return
    isDrawing.value = true
    currentStroke.value = [{ ...mousePosition.value }]
}

function area_mouseUp() {
    if (!isDrawing.value) return
    isDrawing.value = false
    if (currentStroke.value.length > 1 || props.mode === 'eraser') {
        const polygonPoints = strokeToPolygon(currentStroke.value)
        if (props.mode === 'brush') {
            mergePolygonIntoExisting(polygonPoints)
        } else {
            subtractPolygonFromExisting(polygonPoints)
        }
    }
    currentStroke.value = []
}

function area_mouseMove(e: MouseEvent) {
    mousePosition.value = getNormalizedMousePos(e)
    showCursor.value = true
    if (isDrawing.value) {
        currentStroke.value.push({ ...mousePosition.value })
    }
}

function strokeToPolygon(stroke: Point[]): number[] {
    const flatPoints: number[] = []
    stroke.forEach((p) => flatPoints.push(p.x, p.y))
    return lineToPolygon(flatPoints, props.brushThickness)
}

function lineToPolygon(linePoints: number[], strokeWidth: number): number[] {
    const scale = 1000
    const path = []
    for (let i = 0; i < linePoints.length; i += 2) {
        path.push({ X: linePoints[i] * scale, Y: linePoints[i + 1] * scale })
    }
    const co = new ClipperLib.ClipperOffset()
    co.AddPath(path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etOpenRound)
    const offsetPaths: typeof path[] = []
    co.Execute(offsetPaths, (strokeWidth / 2) * scale)
    const polygonPoints: number[] = []
    offsetPaths.forEach((p) => {
        const simplified = ClipperLib.JS.Lighten(p, POLYGON_SIMPLIFICATION_TOLERANCE * scale)
        simplified.forEach((pt: { X: number; Y: number }) => {
            polygonPoints.push(pt.X / scale, pt.Y / scale)
        })
    })
    return polygonPoints
}

function strokeToPath(stroke: Point[]): string {
    if (stroke.length === 0) return ''
    const pts = stroke.map((p) => denormalize_point(p))
    let path = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) path += ` L ${pts[i].x} ${pts[i].y}`
    return path
}

function pointsToClipperPath(points: number[]) {
    const scale = 100
    const path = []
    for (let i = 0; i < points.length; i += 2) {
        path.push({ X: points[i] * scale, Y: points[i + 1] * scale })
    }
    return path
}

function clipperPathsToPoints(paths: { X: number; Y: number }[][]): number[] {
    const scale = 100
    const result: number[] = []
    paths.forEach((path) => path.forEach((pt) => result.push(pt.X / scale, pt.Y / scale)))
    return result
}

function flatToPointArray(flat: number[]): Point[] {
    const pts: Point[] = []
    for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], y: flat[i + 1] })
    return pts
}

function mergePolygonIntoExisting(newPolyPoints: number[]) {
    const newPath = pointsToClipperPath(newPolyPoints)
    if (props.selectedPolygonIndex === -1) {
        polygons.value = [
            ...polygons.value,
            { points: flatToPointArray(clipperPathsToPoints([newPath])), open: false },
        ]
        select_polygon(polygons.value.length - 1)
        return
    }
    const selected = polygons.value[props.selectedPolygonIndex]
    const selectedFlat: number[] = []
    selected.points.forEach((p) => selectedFlat.push(p.x, p.y))
    const selectedPath = pointsToClipperPath(selectedFlat)

    const clipperIntersect = new ClipperLib.Clipper()
    clipperIntersect.AddPath(selectedPath, ClipperLib.PolyType.ptSubject, true)
    clipperIntersect.AddPath(newPath, ClipperLib.PolyType.ptClip, true)
    const intersection = new ClipperLib.Paths()
    const hasIntersection = clipperIntersect.Execute(
        ClipperLib.ClipType.ctIntersection,
        intersection,
        ClipperLib.PolyFillType.pftNonZero,
        ClipperLib.PolyFillType.pftNonZero
    )

    if (hasIntersection && intersection.length > 0) {
        const clipperUnion = new ClipperLib.Clipper()
        clipperUnion.AddPath(selectedPath, ClipperLib.PolyType.ptSubject, true)
        clipperUnion.AddPath(newPath, ClipperLib.PolyType.ptClip, true)
        const union = new ClipperLib.Paths()
        const succeeded = clipperUnion.Execute(
            ClipperLib.ClipType.ctUnion,
            union,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
        )
        if (succeeded && union.length > 0) {
            const newPolygons = [...polygons.value]
            newPolygons[props.selectedPolygonIndex] = {
                points: flatToPointArray(clipperPathsToPoints([union[0]])),
                open: false,
            }
            polygons.value = newPolygons
        }
    } else {
        polygons.value = [
            ...polygons.value,
            { points: flatToPointArray(clipperPathsToPoints([newPath])), open: false },
        ]
        select_polygon(polygons.value.length - 1)
    }
}

function subtractPolygonFromExisting(subtractPoints: number[]) {
    if (props.selectedPolygonIndex === -1) return
    const subtractPath = pointsToClipperPath(subtractPoints)
    const selected = polygons.value[props.selectedPolygonIndex]
    const polyFlat: number[] = []
    selected.points.forEach((p) => polyFlat.push(p.x, p.y))
    const polyPath = pointsToClipperPath(polyFlat)

    let allInside = true
    for (const p of subtractPath) {
        if (ClipperLib.Clipper.PointInPolygon(p, polyPath) <= 0) {
            allInside = false
            break
        }
    }
    if (allInside) return

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

    const updatedPolygons = [...polygons.value]
    if (succeeded && diffResult.length > 0) {
        const newPolygons = diffResult.map((path: { X: number; Y: number }[]) => ({
            ...selected,
            points: flatToPointArray(clipperPathsToPoints([path])),
        }))
        updatedPolygons.splice(props.selectedPolygonIndex, 1, ...newPolygons)
        select_polygon(props.selectedPolygonIndex)
    } else {
        updatedPolygons.splice(props.selectedPolygonIndex, 1)
        select_polygon(-1)
    }
    polygons.value = updatedPolygons
}

function finish_editing() {
    isDrawing.value = false
    currentStroke.value = []
    select_polygon(-1)
}

function onSvgMouseDown(e: MouseEvent) {
    if (props.disableEvents) return
    area_mouseDown(e)
}

function onSvgMouseUp() {
    if (props.disableEvents) return
    area_mouseUp()
}

function onSvgMouseMove(e: MouseEvent) {
    if (props.disableEvents) return
    area_mouseMove(e)
}

function handle_keydown(e: KeyboardEvent) {
    if (props.disableEvents) return
    if (e.keyCode === 46) {
        e.preventDefault()
        delete_selected_item()
    } else if (e.keyCode === 13 || e.keyCode === 27) {
        e.preventDefault()
        finish_editing()
    }
}

onMounted(() => {
    document.addEventListener('keydown', handle_keydown)
    svgEl.value?.addEventListener('mousedown', onSvgMouseDown)
    svgEl.value?.addEventListener('mouseup', onSvgMouseUp)
    svgEl.value?.addEventListener('mousemove', onSvgMouseMove)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', handle_keydown)
    svgEl.value?.removeEventListener('mousedown', onSvgMouseDown)
    svgEl.value?.removeEventListener('mouseup', onSvgMouseUp)
    svgEl.value?.removeEventListener('mousemove', onSvgMouseMove)
})
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
