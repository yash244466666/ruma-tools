import { detectPitch, stringTuning } from "./pitch"
it.each([82.4069, 110, 146.8324, 195.9977, 246.9417, 329.6276])(
  "recognizes a guitar fundamental at %f Hz",
  (hz) => {
    const wave = Float32Array.from(
      { length: 4096 },
      (_, i) => 0.5 * Math.sin((2 * Math.PI * i * hz) / 48000),
    )
    expect(detectPitch(wave, 48000)).toBeCloseTo(hz, 0)
    expect(stringTuning(hz).cents).toBe(0)
  },
)
it("ignores silence", () => expect(detectPitch(new Float32Array(4096), 44100)).toBeNull())
