import { electricity, frameMarks, settleExpenses } from "./calculations"
it("preserves minor units when a bill cannot divide evenly", () => {
  expect(settleExpenses([100, 0, 0])).toEqual([
    { from: 1, to: 0, amount: 33 },
    { from: 2, to: 0, amount: 33 },
  ])
  expect(settleExpenses([1, -1])).toBeNull()
})
it("centres frames between equal outside and inside gaps", () => {
  expect(frameMarks(180, 30, 3)).toEqual([37.5, 90, 142.5])
  expect(frameMarks(10, 12, 2)).toBeNull()
})
it("scales watts to kWh and rejects impossible duty cycles", () => {
  expect(electricity(100, 4, 30, 8)).toEqual({ kwh: 12, cost: 96 })
  expect(electricity(100, 25, 1, 1)).toBeNull()
})
