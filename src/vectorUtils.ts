export interface Point {
    x: number
    y: number
}

export function distance(a: Point, b: Point): number {
    return Math.sqrt((b.y - a.y) * (b.y - a.y) + (b.x - a.x) * (b.x - a.x))
}

export function normal_vector(a: Point, b: Point): Point {
    const n: Point = { x: -(b.y - a.y), y: b.x - a.x }
    const dn = distance(n, { x: 0, y: 0 })
    return vectorScalarMul(1 / dn, n)
}

export function vectorAdd(a: Point, b: Point): Point {
    return { x: a.x + b.x, y: a.y + b.y }
}

export function vectorScalarMul(c: number, a: Point): Point {
    return { x: a.x * c, y: a.y * c }
}

export function midpoint(p1: Point, p2: Point): Point {
    return {
        x: p1.x + 0.5 * (p2.x - p1.x),
        y: p1.y + 0.5 * (p2.y - p1.y),
    }
}
