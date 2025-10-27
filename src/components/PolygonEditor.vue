<template>
    <svg ref="svg" :style="{ pointerEvents: disableEvents ? 'none' : 'auto' }">
        <!-- Mode-specific component -->
        <component
            :is="currentModeComponent"
            v-bind="modeProps"
            @input="$emit('input', $event)"
            @polygonCreated="$emit('polygonCreated')"
            @update:selected_polygon_index="
                $emit('update:selected_polygon_index', $event)
            "
        />
    </svg>
</template>

<script>
import PolygonMode from './modes/PolygonMode.vue'
import RectangleMode from './modes/RectangleMode.vue'
import PolylineMode from './modes/PolylineMode.vue'
import BrushMode from './modes/BrushMode.vue'

export default {
    name: 'PolygonEditor',
    components: {
        PolygonMode,
        RectangleMode,
        PolylineMode,
        BrushMode,
    },
    props: {
        width: { type: Number, default: 800 },
        height: { type: Number, default: 600 },
        mode: { type: String, default: 'polygon' },
        selected_polygon_index: { type: Number, default: -1 },
        value: { type: Array },
        brushThickness: { type: Number, default: 5 },
        disableEvents: { type: Boolean, default: false },
    },
    data() {
        return {
            svg: {
                width: 800,
                height: 600,
            },
            resizeObserver: new ResizeObserver(this.getSizeOfSvg),
        }
    },
    mounted() {
        this.resizeObserver.observe(this.$refs.svg)
    },
    beforeDestroy() {
        this.resizeObserver.disconnect()
    },
    methods: {
        getSizeOfSvg() {
            if (!this.$refs.svg) return
            this.svg.width = this.$refs.svg.clientWidth
            this.svg.height = this.$refs.svg.clientHeight
        },
    },
    computed: {
        currentModeComponent() {
            const modeMap = {
                polygon: 'PolygonMode',
                rectangle: 'RectangleMode',
                polyline: 'PolylineMode',
                brush: 'BrushMode',
                eraser: 'BrushMode',
            }
            return modeMap[this.mode] || 'PolygonMode'
        },
        modeProps() {
            return {
                width: this.width,
                height: this.height,
                mode: this.mode,
                selected_polygon_index: this.selected_polygon_index,
                value: this.value,
                brushThickness: this.brushThickness,
                disableEvents: this.disableEvents,
                svg: this.svg,
            }
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
