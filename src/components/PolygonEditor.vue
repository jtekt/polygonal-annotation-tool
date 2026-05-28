<template>
    <svg ref="svgEl" :style="{ pointerEvents: disableEvents ? 'none' : 'auto' }">
        <component
            :is="currentModeComponent"
            v-bind="modeProps"
            @update:modelValue="$emit('update:modelValue', $event)"
            @polygonCreated="$emit('polygonCreated')"
            @update:selectedPolygonIndex="$emit('update:selectedPolygonIndex', $event)"
        />
    </svg>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onBeforeUnmount } from 'vue'
import PolygonMode from './modes/PolygonMode.vue'
import RectangleMode from './modes/RectangleMode.vue'
import PolylineMode from './modes/PolylineMode.vue'
import BrushMode from './modes/BrushMode.vue'
import type { Polygon } from '@/composables/useBaseMode'

const props = defineProps<{
    width: number
    height: number
    mode: string
    selectedPolygonIndex: number
    modelValue: Polygon[]
    brushThickness: number
    disableEvents: boolean
}>()

defineEmits<{
    'update:modelValue': [value: Polygon[]]
    'update:selectedPolygonIndex': [index: number]
    polygonCreated: []
}>()

const svgEl = ref<SVGElement | null>(null)
provide('svgEl', svgEl)

const svgSize = ref({ width: 800, height: 600 })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        if (!svgEl.value) return
        svgSize.value.width = svgEl.value.clientWidth
        svgSize.value.height = svgEl.value.clientHeight
    })
    if (svgEl.value) resizeObserver.observe(svgEl.value)
})

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
})

const currentModeComponent = computed(() => {
    const modeMap: Record<string, typeof PolygonMode> = {
        polygon: PolygonMode,
        rectangle: RectangleMode,
        polyline: PolylineMode,
        brush: BrushMode,
        eraser: BrushMode,
    }
    return modeMap[props.mode] ?? PolygonMode
})

const modeProps = computed(() => ({
    width: props.width,
    height: props.height,
    mode: props.mode,
    selectedPolygonIndex: props.selectedPolygonIndex,
    modelValue: props.modelValue,
    brushThickness: props.brushThickness,
    disableEvents: props.disableEvents,
    svg: svgSize.value,
}))
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
    user-select: none;
}

polygon,
polyline {
    stroke: #7f000084;
    z-index: 0;
}
polyline {
    fill: none;
    stroke-width: 2px;
    cursor: pointer;
}

polyline.selected {
    stroke: #ff3333;
    stroke-width: 3px;
    z-index: 50;
}

polygon {
    fill: #fc5f5f48;
    cursor: pointer;
    stroke-width: 1.5px;
    transition: stroke 0.25s, fill 0.25s;
}

polygon.selected {
    fill: #ff333387;
    stroke: #ff3333;
    stroke-width: 2.5px;
    filter: drop-shadow(0 0 4px rgba(255, 51, 51, 0.5));
    z-index: 50;
}

circle {
    transition: r 0.25s, fill 0.25s, stroke 0.25s, stroke-width 0.25s;
}

.vertex {
    cursor: grab;
    fill: #c0000044;
    r: 2.5px;
    stroke-width: 0;
}

.vertex.active {
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
