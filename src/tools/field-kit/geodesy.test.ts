import { distanceBearing } from "./geodesy"
it("finds a nearby point across the date line", () => {
  const result = distanceBearing(
    { latitude: 0, longitude: 179.99 },
    { latitude: 0, longitude: -179.99 },
  )
  expect(result.distance).toBeCloseTo(2223.9, 0)
  expect(result.bearing).toBeCloseTo(90)
})
