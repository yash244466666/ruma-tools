import { useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/Button"
import { usePlatform } from "@/platform/platform-context"
import { useSensorStream } from "@/tools/_sensor/use-sensor-stream"
import { rollDie } from "./dice-roller"
import "./ludo.css"

const layouts = [[5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]]
const rotations = [
  [0, 0],
  [-90, 0],
  [0, -90],
  [0, 90],
  [90, 0],
  [0, 180],
]

function ShakeControl({ onRoll }: { onRoll: () => void }) {
  const last = useRef(-Infinity)
  const ready = useRef(false)
  const sensor = useSensorStream(["linear-acceleration"], ({ values, timestampMs }) => {
    const force = Math.hypot(...values)
    if (force < 3) ready.current = true
    if (force > 12 && ready.current && timestampMs - last.current > 850) {
      last.current = timestampMs
      ready.current = false
      onRoll()
    }
  })
  return (
    <p className="text-sm">
      {sensor.error ||
        (sensor.streaming ? "Shake the phone once to roll." : "Checking motion sensor…")}
    </p>
  )
}

export function LudoDie() {
  const { random, haptics } = usePlatform()
  const [shake, setShake] = useState(false)
  const [result, setResult] = useState({ face: 1, turn: 0 })
  function roll() {
    const face = rollDie(6, () => random.bytes(1)[0] ?? 0)
    setResult((prev) => ({ face, turn: prev.turn + 1 }))
    void haptics.confirm()
  }
  const [x, y] = rotations[result.face - 1]!
  return (
    <div className="grid gap-3">
      <button className="ludo-board" aria-label="Roll die" onClick={roll}>
        <span
          aria-hidden="true"
          className="ludo-cube"
          data-face={result.face}
          style={
            {
              "--die-x": x! + result.turn * 360 + "deg",
              "--die-y": y! + result.turn * 360 + "deg",
            } as CSSProperties
          }
        >
          {layouts.map((pips, i) => (
            <span className="ludo-side" key={i}>
              {pips.map((p) => (
                <i key={p} style={{ gridColumn: ((p - 1) % 3) + 1, gridRow: Math.ceil(p / 3) }} />
              ))}
            </span>
          ))}
        </span>
        <strong>{result.turn ? "Roll again" : "Tap to roll"}</strong>
      </button>
      <p aria-live="polite" className="text-center font-semibold">
        {result.turn
          ? "Roll " + result.turn + " · You rolled " + result.face + "."
          : "One six-sided die"}
      </p>
      <Button variant="secondary" aria-pressed={shake} onClick={() => setShake(!shake)}>
        Shake to roll {shake ? "on" : "off"}
      </Button>
      {shake && <ShakeControl onRoll={roll} />}
    </div>
  )
}
