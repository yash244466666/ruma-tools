import { useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { useSensorStream } from "@/tools/_sensor/use-sensor-stream"
function Session({ update }: { update: (steps: number, cadence: number) => void }) {
  const last = useRef(0),
    count = useRef(0),
    armed = useRef(false),
    recent = useRef<number[]>([])
  const { error } = useSensorStream(["accelerometer"], (s) => {
    const delta = Math.hypot(...s.values) - 9.81
    recent.current = recent.current.filter((t) => s.timestampMs - t <= 10000)
    if (delta < 0.3) armed.current = true
    if (delta > 1.4 && armed.current && s.timestampMs - last.current >= 320) {
      count.current++
      last.current = s.timestampMs
      recent.current.push(s.timestampMs)
      armed.current = false
    }
    const times = recent.current
    const cadence =
      times.length >= 2 && s.timestampMs - last.current < 2400
        ? Math.round(((times.length - 1) * 60000) / (last.current - times[0]!))
        : 0
    update(count.current, cadence)
  })
  return (
    <p role="status">
      {error || "Walk with the phone in your pocket. Hand movement can affect the estimate."}
    </p>
  )
}
export default function Walking() {
  const [run, setRun] = useState(false),
    [steps, setSteps] = useState(0),
    [cadence, setCadence] = useState(0)
  return (
    <ToolPanel title="Walking session">
      <p className="text-2xl">
        {steps} steps · {cadence} steps/min
      </p>
      <Button
        onClick={() => {
          if (!run) setSteps(0)
          setCadence(0)
          setRun(!run)
        }}
      >
        {run ? "Finish walk" : "Start walk"}
      </Button>
      {run && (
        <Session
          update={(n, c) => {
            setSteps(n)
            setCadence(c)
          }}
        />
      )}
    </ToolPanel>
  )
}
