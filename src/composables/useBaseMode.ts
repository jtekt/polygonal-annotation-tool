import { ref, computed, inject, type Ref } from 'vue'

export interface Point {
    x: number
    y: number
}

export interface Polygon {
    points: Point[]
    open: boolean
    label?: string
}

export interface SvgSize {
    width: number
    height: number
}

export interface BaseModeProps {
    width: number
    height: number
    mode: string
    selectedPolygonIndex: number
    modelValue: Polygon[]
    brushThickness: number
    disableEvents: boolean
    svg: SvgSize
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmitFn = (event: string, ...args: any[]) => void

export function useBaseMode(props: BaseModeProps, emit: EmitFn) {
    const svgEl = inject<Ref<SVGElement | null>>('svgEl')!

    const selected_point_index = ref(-1)
    const grabbed_point_index = ref(-1)
    const mousePosition = ref<Point>({ x: 0, y: 0 })

    const polygons = computed({
        get: (): Polygon[] =>
            (Array.isArray(props.modelValue) ? props.modelValue : []).map((p) =>
                Array.isArray(p?.points) ? p : { ...p, points: [] }
            ),
        set: (value: Polygon[]) => emit('update:modelValue', value),
    })

    const selectedPolygon = computed<Polygon | null>(() => {
        if (props.selectedPolygonIndex < 0) return null
        return polygons.value[props.selectedPolygonIndex] ?? null
    })

    function denormalize_point(point: Point): Point {
        return {
            x: (props.svg.width * point.x) / props.width,
            y: (props.svg.height * point.y) / props.height,
        }
    }

    function denormalize_points(points: Point[] | undefined): Point[] {
        if (!Array.isArray(points)) return []
        return points.map(denormalize_point)
    }

    function normalize_point(point: Point): Point {
        return {
            x: (props.width * point.x) / props.svg.width,
            y: (props.height * point.y) / props.svg.height,
        }
    }

    function getNormalizedMousePos(event: MouseEvent): Point {
        const { offsetX: x, offsetY: y } = event
        return normalize_point({ x, y })
    }

    function polygon_svg_points(points: Point[] | undefined): string {
        return denormalize_points(points).reduce(
            (output, point) => `${output} ${point.x},${point.y}`,
            ''
        )
    }

    function select_polygon(index: number) {
        emit('update:selectedPolygonIndex', index)
    }

    function create_polygon(initialPoints: Point[] = []): Polygon {
        const new_polygon: Polygon = {
            points: initialPoints,
            open: props.mode === 'polygon' || props.mode === 'polyline',
        }
        const newPolygons = [...polygons.value, new_polygon]
        polygons.value = newPolygons
        emit('polygonCreated')
        // Use newPolygons.length — polygons.value is stale until parent re-renders
        select_polygon(newPolygons.length - 1)
        selected_point_index.value = -1
        return new_polygon
    }

    function delete_selected_item() {
        if (!selectedPolygon.value) return
        if (selected_point_index.value !== -1) {
            const newPoints = [...selectedPolygon.value.points]
            newPoints.splice(selected_point_index.value, 1)
            selectedPolygon.value.points = newPoints
            selected_point_index.value = -1
        } else if (props.selectedPolygonIndex !== -1) {
            const newPolygons = [...polygons.value]
            newPolygons.splice(props.selectedPolygonIndex, 1)
            polygons.value = newPolygons
            select_polygon(-1)
        }
    }

    function point_mouseup() {
        grabbed_point_index.value = -1
    }

    function polygon_classes(polygon_index: number) {
        return { selected: polygon_index === props.selectedPolygonIndex }
    }

    function polyline_class(polygon_index: number) {
        return { selected: polygon_index === props.selectedPolygonIndex }
    }

    return {
        svgEl,
        selected_point_index,
        grabbed_point_index,
        mousePosition,
        polygons,
        selectedPolygon,
        denormalize_point,
        denormalize_points,
        normalize_point,
        getNormalizedMousePos,
        polygon_svg_points,
        create_polygon,
        select_polygon,
        delete_selected_item,
        point_mouseup,
        polygon_classes,
        polyline_class,
    }
}
