import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { useSignalTone } from "@/tools/_sensor/use-signal-tone"

export default function CookingTimers() {
  const [timers, setTimers] = useState<{ id: number; name: string; end: number }[]>([])
  const [name, setName] = useState("")
  const [minutes, setMinutes] = useState("5")
  const [now, setNow] = useState(Date.now)
  const nextId = useRef(0)
  const notified = useRef(new Set<number>())
  const { enable, signal } = useSignalTone()
  const running = timers.some((t) => t.end > now)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])
  useEffect(() => {
    for (const t of timers) {
      if (t.end <= now && !notified.current.has(t.id)) {
        notified.current.add(t.id)
        signal()
      }
    }
  }, [timers, now, signal])
  const duration = Number(minutes)
  return (
    <ToolPanel title="Kitchen timers">
      <div className="grid gap-3">
        <label>
          Dish name
          <input
            className="app-input"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Eggs"
          />
        </label>
        <label>
          Minutes
          <input
            className="app-input"
            inputMode="decimal"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <Button
          disabled={
            !name.trim() || !(duration >= 1 / 60 && duration <= 1440) || timers.length >= 12
          }
          onClick={() => {
            void enable()
            const start = Date.now()
            setNow(start)
            setTimers([
              ...timers,
              {
                id: ++nextId.current,
                name: name.trim(),
                end: start + Math.round(duration * 60000),
              },
            ])
            setName("")
          }}
        >
          Start timer
        </Button>
        <p className="text-sm">Keep this tool open for sound. Up to 12 dishes can run together.</p>
        {timers.map((t) => {
          const seconds = Math.max(0, Math.ceil((t.end - now) / 1000))
          return (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2">
              <strong>{t.name}</strong>
              <span role={seconds ? "timer" : "status"}>
                {seconds
                  ? Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0")
                  : "Ready"}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  setTimers(timers.filter((v) => v.id !== t.id))
                  notified.current.delete(t.id)
                }}
              >
                Remove {t.name}
              </Button>
            </div>
          )
        })}
      </div>
    </ToolPanel>
  )
}
