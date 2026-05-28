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
                @click="!disableEvents && polygon_clicked(polygon_index)"
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
import { useBaseMode, type Polygon } from '@/composables/useBaseMode'
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
    create_polygon,
    select_polygon,
    delete_selected_item,
    point_mouseup,
    polygon_classes,
    polyline_class,
} = base

function area_mouseMove(e: MouseEvent) {
    mousePosition.value = getNormalizedMousePos(e)
    if (grabbed_point_index.value !== -1 && selectedPolygon.value) {
        selectedPolygon.value.points[grabbed_point_index.value] = { ...mousePosition.value }
    }
}

function area_mouseDown() {
    if (!polygons.value) polygons.value = []
    let polygon = polygons.value[props.selectedPolygonIndex]
    if (!polygon || !polygon.open) {
        polygon = create_polygon()
    }
    polygon.points.push({ ...mousePosition.value })
}

function close_polygon() {
    if (selectedPolygon.value?.open) {
        selectedPolygon.value.open = false
    }
}

function grab_point(polygon_index: number, point_index: number) {
    select_polygon(polygon_index)
    selected_point_index.value = point_index
    grabbed_point_index.value = point_index
}

function onPointMousedown(polygon_index: number, point_index: number) {
    select_polygon(polygon_index)
    if (point_index === 0 && selectedPolygon.value?.open) {
        close_polygon()
    } else {
        grab_point(polygon_index, point_index)
    }
}

function midpoint_clicked(polygon_index: number, point_index: number) {
    if (!selectedPolygon.value) return
    selectedPolygon.value.points.splice(point_index + 1, 0, { ...mousePosition.value })
    grab_point(polygon_index, point_index + 1)
}

function polygon_clicked(polygon_index: number) {
    select_polygon(polygon_index)
    selected_point_index.value = -1
}

function polyline_clicked(polygon_index: number) {
    polygon_clicked(polygon_index)
}

function cleanupInvalidPolygons() {
    polygons.value = polygons.value.filter((p) => p.points.length > 1)
}

function finish_editing() {
    if (selectedPolygon.value?.open) close_polygon()
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
    const polygonOpen = sp?.open ?? false
    return {
        active: polygon_index === props.selectedPolygonIndex,
        start:
            polygon_index === props.selectedPolygonIndex &&
            point_index === 0 &&
            polygonOpen,
        selected:
            polygon_index === props.selectedPolygonIndex &&
            point_index === selected_point_index.value,
        grabbed:
            polygon_index === props.selectedPolygonIndex &&
            point_index === grabbed_point_index.value,
        last:
            polygon_index === props.selectedPolygonIndex &&
            point_index === lastPointIndex &&
            polygonOpen,
    }
}

function midpoint_classes(polygon_index: number) {
    return { active: polygon_index === props.selectedPolygonIndex }
}

function midpoints(polygon: Polygon) {
    const pts = polygon.points.slice()
    if (!polygon.open) pts.push(pts[0])
    return pts.slice(0, -1).map((p, i) => midpoint(p, pts[i + 1]))
}

const ghost_polyline_points = computed(() => {
    const points = [mousePosition.value]
    if (selectedPolygon.value?.open) {
        const last = selectedPolygon.value.points.at(-1)
        if (last) points.push(last)
    }
    return polygon_svg_points(points)
})

function onSvgMouseDown(e: MouseEvent) {
    if (props.disableEvents) return
    if (e.target === svgEl.value) area_mouseDown()
}

function onSvgMouseUp(e: MouseEvent) {
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
    } else if (e.key === ' ') {
        e.preventDefault()
        if (selectedPolygon.value) selectedPolygon.value.open = !selectedPolygon.value.open
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
