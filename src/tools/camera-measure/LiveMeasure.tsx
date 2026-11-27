import { usePlatform } from "@/platform/platform-context"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { arMeasure, isAndroidTester, type ArMeasurement } from "@/platform/preview-services"
import Results from "./Results"
import type { Shape } from "./geometry"
export default function LiveMeasure() {
  const { browser } = usePlatform()
  const [shape, setShape] = useState<Shape>("rectangle"),
    [result, setResult] = useState<ArMeasurement | null>(null)
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("")
  async function start() {
    setBusy(true)
    setNotice("")
    try {
      const outcome = await arMeasure.start({ shape })
      if (outcome.status === "measured" && outcome.result) {
        setResult(outcome.result)
        setNotice("Measurement complete.")
      } else
        setNotice(
          outcome.status === "denied"
            ? "Allow camera access in Android settings to start."
            : outcome.status === "unavailable"
              ? "AR tracking is unavailable on this device. Try Photo Measure."
              : "Measurement cancelled.",
        )
    } catch {
      setNotice("Could not start the AR camera. Try again or open Photo Measure.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <ToolPanel title="Measure a surface">
      <div className="grid gap-3">
        <p>
          Move the camera slowly to find a flat surface. Mark three adjacent corners of a rectangle
          or trace an outline. To measure height, aim at the top directly above the first corner.
        </p>
        <label>
          Base shape
          <select
            className="app-input"
            disabled={busy}
            value={shape}
            onChange={(e) => {
              setShape(e.target.value as Shape)
              setResult(null)
            }}
          >
            <option value="rectangle">Rectangle</option>
            <option value="outline">Custom outline</option>
          </select>
        </label>
        {isAndroidTester ? (
          <>
            <p className="text-sm">
              Live tracking may require downloading Google Play Services for AR. Google processes
              device and usage information. Your measurements stay in this session.
            </p>
            <Button
              variant="quiet"
              onClick={() =>
                void browser
                  .open(new URL("https://policies.google.com/privacy"))
                  .catch(() => setNotice("Could not open the Google Privacy Policy."))
              }
            >
              Google Privacy Policy
            </Button>
            <Button disabled={busy} onClick={() => void start()}>
              {busy ? "Opening AR camera…" : "Open AR camera"}
            </Button>
          </>
        ) : (
          <p>Open the Android test APK on an ARCore-compatible phone to use the live camera.</p>
        )}
        {notice && <p role="status">{notice}</p>}
        {result && (
          <Results key={JSON.stringify(result)} value={result} measuredHeight={result.height} />
        )}
        <a className="text-link" href="#/tool/photo-measure">
          Measure from a photo instead
        </a>
      </div>
    </ToolPanel>
  )
}
