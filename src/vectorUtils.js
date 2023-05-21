export function distance(a, b) {
  return Math.sqrt((b.y - a.y) * (b.y - a.y) + (b.x - a.x) * (b.x - a.x))
}
export function normal_vector(a, b) {
  const n = { x: -(b.y - a.y), y: b.x - a.x }
  const dn = distance(n, { x: 0, y: 0 })
  return vectorScalarMul(1 / dn, n)
}

export function vectorAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function vectorScalarMul(c, a) {
  return { x: a.x * c, y: a.y * c }
}

export function midpoint(p1, p2) {
  return {
    x: p1.x + 0.5 * (p2.x - p1.x),
    y: p1.y + 0.5 * (p2.y - p1.y),
  }
}
