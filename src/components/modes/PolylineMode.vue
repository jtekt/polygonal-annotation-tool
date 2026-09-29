<template>
    <g>
        <g
            v-for="(polygon, polygon_index) in polygons"
            :key="`polygon_${polygon_index}`"
        >
            <polyline
                v-if="polygon.open"
                :points="polygon_svg_points(polygon.points)"
                :class="polyline_class(polygon_index)"
                @click="!disableEvents && polyline_clicked(polygon_index)"
            />
            <polygon
                v-else
                :points="polygon_svg_points(polygon.points)"
                :class="polygon_classes(polygon_index)"
            />
            <circle
                class="midpoint"
                v-for="(point, point_index) in denormalize_points(midpoints(polygon))"
                :key="`polygon_${polygon_index}_midpoint_${point_index}`"
                :class="midpoint_classes(polygon_index)"
                @mousedown="!disableEvents && midpoint_clicked(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
            <circle
                class="vertex"
                v-for="(point, point_index) in denormalize_points(polygon.points)"
                :key="`polygon_${polygon_index}_point_${point_index}`"
                @mousedown="!disableEvents && onPointMousedown(polygon_index, point_index)"
                @mouseup="!disableEvents && point_mouseup()"
                :class="point_classes(polygon_index, point_index)"
                :cx="point.x"
                :cy="point.y"
            />
        </g>
        <polyline :points="ghost_polyline_points" class="ghost" />
    </g>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useBaseMode, type Polygon, type Point } from '@/composables/useBaseMode'
import { midpoint } from '@/vectorUtils'

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
    denormalize_points,
    getNormalizedMousePos,
    polygon_svg_points,
    select_polygon,
    delete_selected_item,
    point_mouseup,
    polygon_classes,
    polyline_class,
} = base

function create_polyline(initialPoints: Point[] = []): Polygon {
    const new_polygon: Polygon = { points: initialPoints, open: true }
    const newPolygons = [...polygons.value, new_polygon]
    polygons.value = newPolygons
    emit('polygonCreated')
    select_polygon(newPolygons.length - 1)
    selected_point_index.value = -1
    return new_polygon
}

function area_mouseDown() {
    const currentPolygon = polygons.value[props.selectedPolygonIndex]
    if (!currentPolygon || !currentPolygon.open) {
        create_polyline([{ ...mousePosition.value }])
    } else {
        const idx = props.selectedPolygonIndex
        polygons.value = polygons.value.map((p, i) =>
            i === idx ? { ...p, points: [...p.points, { ...mousePosition.value }] } : p
        )
    }
}

function area_mouseMove(e: MouseEvent) {
    mousePosition.value = getNormalizedMousePos(e)
    if (grabbed_point_index.value !== -1 && selectedPolygon.value) {
        selectedPolygon.value.points[grabbed_point_index.value] = { ...mousePosition.value }
    }
}

function grab_point(polygon_index: number, point_index: number) {
    select_polygon(polygon_index)
    selected_point_index.value = point_index
    grabbed_point_index.value = point_index
}

function onPointMousedown(polygon_index: number, point_index: number) {
    grab_point(polygon_index, point_index)
}

function midpoint_clicked(polygon_index: number, point_index: number) {
    if (!selectedPolygon.value) return
    selectedPolygon.value.points.splice(point_index + 1, 0, { ...mousePosition.value })
    grab_point(polygon_index, point_index + 1)
}

function polyline_clicked(polygon_index: number) {
    select_polygon(polygon_index)
    selected_point_index.value = -1
}

function cleanupInvalidPolygons() {
    polygons.value = polygons.value.filter((p) => p.points.length > 1)
}

function finish_editing() {
    cleanupInvalidPolygons()
    select_polygon(-1)
}

function undo_last_point() {
    if (!selectedPolygon.value?.open) return
    selectedPolygon.value.points.pop()
}

function point_classes(polygon_index: number, point_index: number) {
    const sp = polygons.value[props.selectedPolygonIndex]
    const lastPointIndex = sp ? sp.points.length - 1 : -1
    return {
        active: polygon_index === props.selectedPolygonIndex,
        selected:
            polygon_index === props.selectedPolygonIndex &&
            point_index === selected_point_index.value,
        grabbed:
            polygon_index === props.selectedPolygonIndex &&
            point_index === grabbed_point_index.value,
        last:
            polygon_index === props.selectedPolygonIndex &&
            point_index === lastPointIndex,
    }
}

function midpoint_classes(polygon_index: number) {
    return { active: polygon_index === props.selectedPolygonIndex }
}

function midpoints(polygon: Polygon) {
    const pts = polygon.points.slice()
    return pts.slice(0, -1).map((p, i) => midpoint(p, pts[i + 1]))
}

const ghost_polyline_points = computed(() => {
    const points = [mousePosition.value]
    if (selectedPolygon.value?.open && selectedPolygon.value.points.length >= 1) {
        const last = selectedPolygon.value.points.at(-1)
        if (last) points.push(last)
    }
    return polygon_svg_points(points)
})

function onSvgMouseDown(e: MouseEvent) {
    if (props.disableEvents) return
    if (e.target === svgEl.value) area_mouseDown()
}

function onSvgMouseUp() {
    if (props.disableEvents) return
    point_mouseup()
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
    } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo_last_point()
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
