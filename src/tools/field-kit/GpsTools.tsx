import { useState, useEffect, useRef } from "react"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { Button } from "@/components/ui/Button"
import { usePlatform } from "@/platform/platform-context"
import { gps, isAndroidTester, type GpsFix } from "@/platform/preview-services"
import { distanceBearing } from "./geodesy"

function valid(f: Partial<GpsFix> | null): f is GpsFix {
  return (
    !!f &&
    typeof f.latitude === "number" &&
    Math.abs(f.latitude) <= 90 &&
    typeof f.longitude === "number" &&
    Math.abs(f.longitude) <= 180 &&
    typeof f.at === "number" &&
    Number.isFinite(f.at)
  )
}
function GpsTool({ mode }: { mode: "speed" | "location" | "parking" }) {
  const { preferences } = usePlatform()
  const [fix, setFix] = useState<GpsFix | null>(null),
    [saved, setSaved] = useState<GpsFix | null>(null),
    [ready, setReady] = useState(false)
  const [status, setStatus] = useState(""),
    [key, setKey] = useState(""),
    [asking, setAsking] = useState(false),
    [now, setNow] = useState(Date.now)
  const alive = useRef(true)
  const pref = "parking-spot-v1"
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    if (mode !== "parking") return
    let current = true
    void preferences
      .get<GpsFix>(pref)
      .then((v) => {
        if (current && valid(v)) setSaved(v)
      })
      .catch(() => {})
      .finally(() => {
        if (current) setReady(true)
      })
    return () => {
      current = false
    }
  }, [preferences, mode])
  useEffect(() => {
    if (!key) return
    let current = true
    async function poll() {
      try {
        const v = await gps.read({ key })
        if (current) {
          setNow(Date.now())
          if (valid(v)) setFix(v)
        }
      } catch {
        if (current) {
          setKey("")
          setStatus("GPS stopped. Start again when outdoors.")
        }
      }
    }
    void poll()
    const timer = setInterval(() => void poll(), 1000)
    return () => {
      current = false
      clearInterval(timer)
      void gps.stop({ key }).catch(() => undefined)
    }
  }, [key])
  async function start() {
    setAsking(true)
    setFix(null)
    try {
      const result = await gps.access()
      if (!alive.current) return
      if (!result.precise) {
        setStatus(
          "GPS needs precise location while this tool is open. You can enable it in app permissions.",
        )
        return
      }
      const v = await gps.start()
      if (!alive.current) {
        await gps.stop(v)
        return
      }
      setKey(v.key)
      setStatus("Waiting for satellites. Try outdoors with a clear view of the sky.")
    } catch {
      if (alive.current) setStatus("Check that location is enabled and this phone supports GPS.")
    } finally {
      if (alive.current) setAsking(false)
    }
  }
  const live = key && fix && Math.abs(now - fix.at) < 15000
  const target = fix && saved ? distanceBearing(fix, saved) : null
  return (
    <ToolPanel
      title={
        mode === "speed"
          ? "Satellite speed"
          : mode === "parking"
            ? "Find your parked car"
            : "Satellite position"
      }
    >
      <div className="grid gap-3">
        {!isAndroidTester ? (
          <p>Use the Android test APK to receive satellite fixes without a map or internet.</p>
        ) : (
          <>
            <Button
              disabled={asking}
              onClick={() => {
                if (key) {
                  setKey("")
                  setStatus("GPS stopped.")
                } else void start()
              }}
            >
              {key ? "Stop GPS" : asking ? "Checking permission…" : "Start GPS"}
            </Button>
            <p role="status">
              {key && fix
                ? live
                  ? "Live GPS fix"
                  : "Waiting for a fresh fix."
                : status || "Location is requested when you start GPS."}
            </p>
            {fix && (
              <>
                <strong className="text-2xl">
                  {mode === "speed"
                    ? live && fix.speed !== undefined
                      ? (fix.speed * 3.6).toFixed(1) + " km/h"
                      : "Speed unavailable"
                    : fix.latitude.toFixed(6) + ", " + fix.longitude.toFixed(6)}
                </strong>
                <p>
                  {fix.accuracy === undefined
                    ? "Accuracy unavailable"
                    : "Estimated accuracy ±" + Math.round(fix.accuracy) + " m"}{" "}
                  · {new Date(fix.at).toLocaleTimeString()}
                </p>
              </>
            )}
            {mode === "parking" && (
              <>
                <Button
                  disabled={!live || !ready}
                  onClick={() => {
                    if (fix)
                      void preferences
                        .set(pref, fix)
                        .then(() => setSaved(fix))
                        .catch(() => setStatus("Could not save this spot."))
                  }}
                >
                  {saved ? "Replace saved parking spot" : "Save current parking spot"}
                </Button>
                {saved && (
                  <>
                    <p>
                      Saved {saved.latitude.toFixed(5)}, {saved.longitude.toFixed(5)} ·{" "}
                      {new Date(saved.at).toLocaleString()}
                    </p>
                    {live && target && (
                      <strong>
                        {Math.round(target.distance)} m away
                        {target.distance > Math.max(5, fix?.accuracy ?? 0, saved.accuracy ?? 0)
                          ? " · Bearing " + Math.round(target.bearing) + "° from north"
                          : " · Within location accuracy"}
                      </strong>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void preferences
                          .remove(pref)
                          .then(() => setSaved(null))
                          .catch(() => setStatus("Could not remove the spot."))
                      }
                    >
                      Forget parking spot
                    </Button>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ToolPanel>
  )
}
export function Speedometer() {
  return <GpsTool mode="speed" />
}
export function Coordinates() {
  return <GpsTool mode="location" />
}
export function ParkingFinder() {
  return <GpsTool mode="parking" />
}
