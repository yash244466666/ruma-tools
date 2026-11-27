import { projection, corners } from "./photo"
it("rectifies all four corners of a trapezoid and rejects crossing points", () => {
  const points = [
    { x: 0.1, y: 0.2 },
    { x: 0.85, y: 0.1 },
    { x: 0.95, y: 0.9 },
    { x: 0.03, y: 0.85 },
  ]
  const fn = projection(points)!
  corners.forEach((p, i) => {
    expect(fn(p.x, p.y).x).toBeCloseTo(points[i]!.x)
    expect(fn(p.x, p.y).y).toBeCloseTo(points[i]!.y)
  })
  expect(projection([points[0]!, points[2]!, points[1]!, points[3]!])).toBeNull()
})
