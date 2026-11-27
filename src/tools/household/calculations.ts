export function electricity(watts: number, hours: number, days: number, rate: number) {
  if (
    ![watts, hours, days, rate].every((n) => Number.isFinite(n) && n >= 0) ||
    hours > 24 ||
    !Number.isInteger(days) ||
    days < 1
  )
    return null
  const kwh = (watts / 1000) * hours * days
  return { kwh, cost: kwh * rate }
}
export function frameMarks(wall: number, width: number, count: number) {
  if (
    ![wall, width].every((n) => Number.isFinite(n) && n > 0) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 50 ||
    count * width > wall
  )
    return null
  const gap = (wall - count * width) / (count + 1)
  return Array.from({ length: count }, (_, i) => gap + width / 2 + i * (gap + width))
}
export function settleExpenses(payments: readonly number[]) {
  if (
    payments.length < 2 ||
    payments.length > 50 ||
    payments.some((n) => !Number.isSafeInteger(n) || n < 0)
  )
    return null
  const sum = payments.reduce((a, b) => a + b, 0)
  if (!Number.isSafeInteger(sum)) return null
  const base = Math.floor(sum / payments.length)
  const balance = payments.map((p, i) => p - base - (i < sum % payments.length ? 1 : 0))
  const transfers: { from: number; to: number; amount: number }[] = []
  let from = 0,
    to = 0
  while (from < balance.length && to < balance.length) {
    if (balance[from]! >= 0) {
      from++
      continue
    }
    if (balance[to]! <= 0) {
      to++
      continue
    }
    const amount = Math.min(-balance[from]!, balance[to]!)
    balance[from]! += amount
    balance[to]! -= amount
    transfers.push({ from, to, amount })
  }
  return transfers
}
