import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { useSensorStream } from "@/tools/_sensor/use-sensor-stream"
import { useSignalTone } from "@/tools/_sensor/use-signal-tone"

function Armed({ signal }: { signal: () => void }) {
  const start = useRef<number | null>(null)
  const [ready, setReady] = useState(false),
    [triggered, setTriggered] = useState(false)
  const { error, streaming } = useSensorStream(["linear-acceleration"], (sample) => {
    start.current ??= sample.timestampMs
    if (sample.timestampMs - start.current < 3000) return
    setReady(true)
    if (Math.hypot(...sample.values) > 2) setTriggered(true)
  })
  useEffect(() => {
    if (!triggered || !streaming) return
    signal()
    const id = setInterval(signal, 600)
    return () => clearInterval(id)
  }, [triggered, streaming, signal])
  return (
    <p role="status">
      {error ||
        (!streaming
          ? "Waiting for the sensor…"
          : triggered
            ? "Movement detected"
            : ready
              ? "Armed · Monitoring movement"
              : "Place the phone down. Arming in three seconds…")}
    </p>
  )
}
export default function MovementAlarm() {
  const [armed, setArmed] = useState(false)
  const { enable, signal } = useSignalTone()
  return (
    <ToolPanel title="Movement alarm">
      <div className="grid gap-4">
        <p>
          Arm the alarm, then place your phone on a table. Keep this tool open to hear it when the
          phone moves.
        </p>
        <Button
          onClick={() => {
            if (!armed) void enable()
            setArmed(!armed)
          }}
        >
          {armed ? "Disarm alarm" : "Arm alarm"}
        </Button>
        {armed && <Armed signal={signal} />}
      </div>
    </ToolPanel>
  )
}
