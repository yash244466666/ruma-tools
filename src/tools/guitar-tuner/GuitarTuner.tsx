import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { usePlatform } from "@/platform/platform-context"
import { foregroundMedia } from "@/platform/shared/foreground-media"
import { detectPitch, stringTuning } from "./pitch"

export default function GuitarTuner() {
  const { lifecycle } = usePlatform()
  const controller = useRef<AbortController | null>(null)
  const [active, setActive] = useState(false),
    [status, setStatus] = useState("Pluck one open guitar string at a time.")
  useEffect(() => () => controller.current?.abort(), [])
  async function start() {
    if (controller.current) return
    const abort = new AbortController()
    controller.current = abort
    setActive(true)
    let audio: AudioContext | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    function stop() {
      clearInterval(timer)
      void audio?.close().catch(() => undefined)
      if (controller.current === abort) {
        controller.current = null
        setActive(false)
        setStatus("Microphone stopped.")
      }
    }
    try {
      audio = new AudioContext()
      await audio.resume()
      const stream = await foregroundMedia(
        { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } },
        lifecycle,
        abort.signal,
        stop,
      )
      const analyser = audio.createAnalyser()
      analyser.fftSize = 4096
      audio.createMediaStreamSource(stream).connect(analyser)
      const buffer = new Float32Array(analyser.fftSize)
      const sampleRate = audio.sampleRate
      timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buffer)
        const hz = detectPitch(buffer, sampleRate)
        if (!hz) {
          setStatus("Listening · Pluck a single open string.")
          return
        }
        const t = stringTuning(hz)
        setStatus(
          t.name +
            " · " +
            hz.toFixed(1) +
            " Hz · " +
            (Math.abs(t.cents) <= 5 ? "In tune" : t.cents < 0 ? "Tune up" : "Tune down") +
            " (" +
            t.cents +
            " cents)",
        )
      }, 180)
    } catch {
      abort.abort()
      stop()
      setStatus("Microphone unavailable. Check access and try again.")
    }
  }
  return (
    <ToolPanel title="Standard guitar tuning">
      <p>E2 · A2 · D3 · G3 · B3 · E4</p>
      <p className="my-3 text-xl" role="status">
        {status}
      </p>
      <Button onClick={() => (active ? controller.current?.abort() : void start())}>
        {active ? "Stop listening" : "Start tuning"}
      </Button>
    </ToolPanel>
  )
}
