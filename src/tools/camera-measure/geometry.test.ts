import { expect, it } from "vitest"
import { measure, volumeLitres } from "./geometry"
const points = (a: number[][]) => a.map(([x, y]) => ({ x: x!, y: y! }))
it("scales both pixel axes and volume for a 30 by 20 by 10 cm box", () => {
  const measured = measure(
    points([
      [20, 10],
      [320, 10],
      [320, 210],
      [20, 210],
    ]),
    0.1,
    "rectangle",
  )
  expect(measured).toEqual({ area: 600, length: 30, width: 20 })
  expect(volumeLitres(measured!.area, 10)).toBe(6)
})
it("measures concave outlines and rejects crossed or degenerate outlines", () => {
  const outline = points([
    [0, 0],
    [4, 0],
    [4, 2],
    [2, 2],
    [2, 4],
    [0, 4],
  ])
  expect(measure(outline, 1, "outline")?.area).toBe(12)
  expect(measure(outline.reverse(), 1, "outline")?.area).toBe(12)
  expect(
    measure(
      points([
        [0, 0],
        [4, 4],
        [0, 4],
        [4, 0],
      ]),
      1,
      "outline",
    ),
  ).toBeNull()
  expect(
    measure(
      points([
        [0, 0],
        [1, 0],
        [2, 0],
      ]),
      1,
      "outline",
    ),
  ).toBeNull()
  expect(measure(outline, Infinity, "outline")).toBeNull()
  expect(volumeLitres(600, -1)).toBeNull()
})
