import { displayVector } from "./display-vector"
import { computeCompass } from "@/tools/compass/compass"
it.each([
  [0, "N"],
  [90, "E"],
  [180, "S"],
  [270, "W"],
])("maps portrait sensor axes at display rotation %s", (a, dir) => {
  const angle = Number(a)
  const result = computeCompass(
    displayVector([0, 45, 0], angle),
    displayVector([0, 0, 9.81], angle),
    3,
  )
  expect(result?.cardinal).toBe(dir)
})
