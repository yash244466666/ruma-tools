export type Point = { x: number; y: number }
export const corners: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]
// Map a destination unit square to the four selected source corners.
export function projection(points: readonly Point[]) {
  if (
    points.length !== 4 ||
    points.some((p) => ![p.x, p.y].every((n) => Number.isFinite(n) && n >= 0 && n <= 1))
  )
    return null
  for (let i = 0; i < 4; i++) {
    const a = points[i]!,
      b = points[(i + 1) % 4]!,
      c = points[(i + 2) % 4]!
    if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) < 0.0005) return null
  }
  const [a, b, c, d] = points as [Point, Point, Point, Point]
  const dx1 = b.x - c.x,
    dx2 = d.x - c.x,
    dy1 = b.y - c.y,
    dy2 = d.y - c.y
  const sx = a.x - b.x + c.x - d.x,
    sy = a.y - b.y + c.y - d.y,
    det = dx1 * dy2 - dx2 * dy1
  const g = (sx * dy2 - dx2 * sy) / det,
    h = (dx1 * sy - sx * dy1) / det
  return (u: number, v: number) => ({
    x: ((b.x - a.x + g * b.x) * u + (d.x - a.x + h * d.x) * v + a.x) / (g * u + h * v + 1),
    y: ((b.y - a.y + g * b.y) * u + (d.y - a.y + h * d.y) * v + a.y) / (g * u + h * v + 1),
  })
}
export function paperCanvas(image: HTMLCanvasElement, points: Point[]) {
  const transform = projection(points)
  if (!transform) throw Error("Select four corners clockwise from the top left.")
  const w = image.width,
    h = image.height
  const length = (a: Point, b: Point) => Math.hypot((a.x - b.x) * w, (a.y - b.y) * h)
  const out = document.createElement("canvas")
  out.width = Math.max(
    1,
    Math.round(Math.max(length(points[0]!, points[1]!), length(points[2]!, points[3]!))),
  )
  out.height = Math.max(
    1,
    Math.round(Math.max(length(points[1]!, points[2]!), length(points[3]!, points[0]!))),
  )
  const source = image.getContext("2d")!.getImageData(0, 0, w, h).data
  const ctx = out.getContext("2d")!,
    target = ctx.createImageData(out.width, out.height)
  for (let y = 0; y < out.height; y++)
    for (let x = 0; x < out.width; x++) {
      const p = transform((x + 0.5) / out.width, (y + 0.5) / out.height)
      const pos =
        (Math.min(h - 1, Math.max(0, Math.floor(p.y * h))) * w +
          Math.min(w - 1, Math.max(0, Math.floor(p.x * w)))) *
        4
      const at = (y * out.width + x) * 4
      target.data[at] = source[pos]!
      target.data[at + 1] = source[pos + 1]!
      target.data[at + 2] = source[pos + 2]!
      target.data[at + 3] = 255
    }
  ctx.putImageData(target, 0, 0)
  return out
}
export async function jpeg(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.91),
  )
  if (!blob) throw Error("Image export failed.")
  return new Uint8Array(await blob.arrayBuffer())
}
export function photoCanvas(source: CanvasImageSource, w: number, h: number) {
  if (!(w > 0 && h > 0 && w * h <= 24000000)) throw Error("Choose an image of up to 24 megapixels.")
  const scale = Math.min(1, 1600 / Math.max(w, h))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}
export function portraitCrop(source: HTMLCanvasElement, ratio: number, x: number, y: number) {
  const w = Math.min(source.width, source.height * ratio),
    h = w / ratio
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  canvas
    .getContext("2d")!
    .drawImage(
      source,
      (source.width - w) * x,
      (source.height - h) * y,
      w,
      h,
      0,
      0,
      canvas.width,
      canvas.height,
    )
  return canvas
}
