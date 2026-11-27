export type Point = { x: number; y: number }
export type Shape = "rectangle" | "outline"
export interface Measurement {
  area: number
  length?: number
  width?: number
}
export function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}
function inBox(a: Point, b: Point, p: Point) {
  return (p.x - a.x) * (p.x - b.x) <= 0 && (p.y - a.y) * (p.y - b.y) <= 0
}
function intersects(a: Point, b: Point, c: Point, d: Point) {
  const x = cross(a, b, c),
    y = cross(a, b, d),
    z = cross(c, d, a),
    w = cross(c, d, b)
  return (
    (x * y < 0 && z * w < 0) ||
    (x === 0 && inBox(a, b, c)) ||
    (y === 0 && inBox(a, b, d)) ||
    (z === 0 && inBox(c, d, a)) ||
    (w === 0 && inBox(c, d, b))
  )
}
// Input coordinates share one Euclidean plane. The calibration converts each pixel to cm.
export function measure(points: readonly Point[], scale: number, shape: Shape): Measurement | null {
  const n = points.length
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    n < 3 ||
    n > 32 ||
    (shape === "rectangle" && n !== 4)
  )
    return null
  let twiceArea = 0
  for (let i = 0; i < n; i++) {
    const a = points[i]!,
      b = points[(i + 1) % n]!
    if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || distance(a, b) < 1e-6) return null
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (intersects(a, b, points[j]!, points[(j + 1) % n]!)) return null
    }
    twiceArea += a.x * b.y - b.x * a.y
  }
  const area = (Math.abs(twiceArea) * scale * scale) / 2
  if (!(area > 0) || !Number.isFinite(area)) return null
  if (shape === "outline") return { area }
  const [a, b, c, d] = points as [Point, Point, Point, Point]
  // Reject a folded-in corner in rectangle mode. In a straight-on photo opposite edges agree.
  const turns = [cross(a, b, c), cross(b, c, d), cross(c, d, a), cross(d, a, b)]
  if (!turns.every((v) => v > 0) && !turns.every((v) => v < 0)) return null
  return {
    length: ((distance(a, b) + distance(c, d)) * scale) / 2,
    width: ((distance(b, c) + distance(d, a)) * scale) / 2,
    area,
  }
}
export function volumeLitres(areaCm2: number, heightCm: number) {
  const litres = (areaCm2 * heightCm) / 1000
  return areaCm2 > 0 && heightCm > 0 && Number.isFinite(litres) ? litres : null
}
