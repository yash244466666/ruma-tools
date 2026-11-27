import { displayVector } from "@/tools/_sensor/display-vector"
import { useSignalTone } from "@/tools/_sensor/use-signal-tone"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { LevelBubble } from "@/components/motion/primitives"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { usePlatform } from "@/platform/platform-context"
import { useSensorStream } from "@/tools/_sensor/use-sensor-stream"
import {
  calibratedTilt,
  formatAngle,
  isLevel,
  levelLabel,
  tiltFromAcceleration,
  type CalibratedTilt,
  type TiltReading,
} from "./level"

const kinds = ["accelerometer"] as const

export default function LevelTool() {
  const { haptics } = usePlatform()
  const [tilt, setTilt] = useState<TiltReading | null>(null)
  const [zero, setZero] = useState<{ x: number; y: number; z: number } | null>(null)
  const wasLevel = useRef(false)

  const history = useRef<{ at: number; reading: TiltReading }[]>([])
  const [stable, setStable] = useState(false)
  const [target, setTarget] = useState("30")
  const [armed, setArmed] = useState(false)
  const [cueStatus, setCueStatus] = useState("")
  const latched = useRef(false)
  const { enable, signal } = useSignalTone()
  const onSample = useCallback((sample: { values: readonly number[]; timestampMs: number }) => {
    const next = tiltFromAcceleration(sample.values)
    if (!next || Math.abs(next.magnitude - 9.81) > 2) {
      history.current = []
      setStable(false)
      setTilt(null)
      return
    }
    const window = history.current.filter((entry) => sample.timestampMs - entry.at <= 800)
    window.push({ at: sample.timestampMs, reading: next })
    history.current = window
    const steady =
      window.length >= 5 &&
      sample.timestampMs - window[0]!.at >= 450 &&
      window.every(({ reading: r }) => Math.hypot(r.x - next.x, r.y - next.y, r.z - next.z) < 0.25)
    setStable(steady)
    if (!steady) {
      setTilt(next)
      return
    }
    const avg = (axis: "x" | "y" | "z") =>
      window.reduce((sum, entry) => sum + entry.reading[axis], 0) / window.length
    setTilt(tiltFromAcceleration([avg("x"), avg("y"), avg("z")]))
  }, [])
  const { error, streaming } = useSensorStream(kinds, onSample)

  const relative: CalibratedTilt | null = useMemo(() => {
    if (!tilt) return null
    const angle = screen.orientation?.angle ?? 0
    const current = tiltFromAcceleration(displayVector([tilt.x, tilt.y, tilt.z], angle))
    if (!current) return null
    if (!zero) return current
    const reference = tiltFromAcceleration(displayVector([zero.x, zero.y, zero.z], angle))
    return reference ? calibratedTilt(current, reference) : null
  }, [tilt, zero])

  const level = relative !== null && isLevel(relative)
  useEffect(() => {
    if (level && !wasLevel.current) void haptics.confirm()
    wasLevel.current = level
  }, [haptics, level])

  const degrees = target.trim() === "" ? NaN : Number(target)
  const validTarget = Number.isFinite(degrees) && degrees >= 0 && degrees <= 90
  useEffect(() => {
    if (!armed || !relative || !streaming) return
    const distance = Math.abs(relative.tiltDeg - degrees)
    if (distance <= 1 && !latched.current) {
      latched.current = true
      signal()
      void haptics.confirm()
    } else if (distance > 2) latched.current = false
  }, [armed, degrees, haptics, relative, signal, streaming])
  const lowEdge =
    relative &&
    (Math.abs(relative.rollDeg) >= Math.abs(relative.pitchDeg)
      ? relative.rollDeg > 0
        ? "left"
        : "right"
      : relative.pitchDeg > 0
        ? "bottom"
        : "top")
  async function toggleCue() {
    if (armed) {
      setArmed(false)
      setCueStatus("")
      return
    }
    const audible = await enable()
    latched.current = false
    setArmed(true)
    setCueStatus(audible ? "Sound enabled." : "Sound unavailable; watch the angle indicator.")
  }
  return (
    <div className="grid gap-4">
      <ToolPanel title="Level">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          {relative && (
            <LevelBubble
              level={level}
              pitch={relative?.pitchDeg ?? 0}
              roll={relative?.rollDeg ?? 0}
            />
          )}
          <div className="grid gap-3">
            <p className="text-2xl font-semibold" data-testid="level-state">
              {relative ? levelLabel(relative) : "Waiting for level data"}
            </p>
            {relative && !level && (
              <p>
                Raise the {lowEdge} edge. Tilt: {formatAngle(relative.tiltDeg)}.
              </p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)]">Roll</dt>
                <dd className="font-mono">{relative ? formatAngle(relative.rollDeg) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Pitch</dt>
                <dd className="font-mono">{relative ? formatAngle(relative.pitchDeg) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Tilt from zero</dt>
                <dd className="font-mono">{relative ? formatAngle(relative.tiltDeg) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Gravity</dt>
                <dd className="font-mono">{tilt ? `${tilt.magnitude.toFixed(2)} m/s²` : "—"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!tilt || !streaming || !stable}
                onClick={() => tilt && setZero({ x: tilt.x, y: tilt.y, z: tilt.z })}
                variant="secondary"
              >
                Set zero
              </Button>
              <Button disabled={!zero} onClick={() => setZero(null)} variant="quiet">
                Reset zero
              </Button>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {streaming ? "Reading the accelerometer." : "Waiting for the accelerometer."}
              {zero
                ? " Zero is calibrated for this session only."
                : " Lay the phone on the reference surface. Hold still until Set zero is available."}
            </p>
          </div>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger-text)]" role="alert">
            {error} A phone with an accelerometer is required.
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[var(--text-secondary)]" aria-live="polite">
          {relative
            ? `${levelLabel(relative)}. Roll ${formatAngle(relative.rollDeg)}, pitch ${formatAngle(relative.pitchDeg)}, tilt ${formatAngle(relative.tiltDeg)}.${level ? " The level state is within one degree." : ""}`
            : "No level data yet."}
        </p>
      </ToolPanel>
      <ToolPanel title="Target angle">
        <label className="grid gap-2">
          Target in degrees (0–90)
          <input
            className="app-input"
            inputMode="decimal"
            value={target}
            disabled={armed}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <Button
          className="mt-3"
          disabled={!armed && (!validTarget || !streaming)}
          onClick={() => void toggleCue()}
        >
          {armed ? "Stop cue" : "Enable angle cue"}
        </Button>
        <p role="status">
          {armed && relative && Math.abs(relative.tiltDeg - degrees) <= 1
            ? "Target reached."
            : cueStatus}
        </p>
      </ToolPanel>
      <p className="text-xs leading-5 text-[var(--text-secondary)]">
        The accelerometer measures gravity; this is an indicative level, not a calibrated
        instrument. Samples stay on this device, stop when the app leaves the foreground, and are
        never saved.
      </p>
    </div>
  )
}
