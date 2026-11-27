const strings = [
  ["E2", 82.4069],
  ["A2", 110],
  ["D3", 146.8324],
  ["G3", 195.9977],
  ["B3", 246.9417],
  ["E4", 329.6276],
] as const
// Normalized autocorrelation, using the first strong local peak to avoid subharmonics.
export function detectPitch(samples: Float32Array, rate: number): number | null {
  const limit = Math.min(Math.ceil(rate / 65), Math.floor(samples.length / 2))
  const window = samples.length - limit
  let energy = 0
  for (let i = 0; i < window; i += 2) energy += samples[i]! ** 2
  if (energy / window < 0.00003) return null
  const corr = (lag: number) => {
    let dot = 0,
      a = 0,
      b = 0
    for (let i = 0; i < window; i += 3) {
      const x = samples[i]!,
        y = samples[i + lag]!
      dot += x * y
      a += x * x
      b += y * y
    }
    return dot / Math.sqrt(a * b || 1)
  }
  let left = -1,
    mid = -1
  for (let lag = Math.floor(rate / 385); lag <= limit; lag += 1) {
    const right = corr(lag)
    if (lag > Math.floor(rate / 385) + 1 && mid > 0.86 && mid >= right && mid > left) {
      const adjustment = (0.5 * (left - right)) / (left - 2 * mid + right)
      return rate / (lag - 1 + adjustment)
    }
    left = mid
    mid = right
  }
  return null
}
export function stringTuning(hz: number) {
  const target = strings.reduce((a, b) =>
    Math.abs(Math.log2(hz / a[1])) < Math.abs(Math.log2(hz / b[1])) ? a : b,
  )
  return { name: target[0], cents: Math.round(1200 * Math.log2(hz / target[1])) }
}
