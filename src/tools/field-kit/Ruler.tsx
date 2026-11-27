import { useState } from "react"
import { ToolPanel } from "@/components/ui/ToolPanel"
export default function Ruler() {
  const [pixels, setPixels] = useState(190),
    [confirmed, setConfirmed] = useState(false)
  return (
    <ToolPanel title="Calibrated centimetres">
      <div className="grid gap-4">
        <p>
          Place a real ruler against the screen. Adjust the line until its two ends are exactly 5 cm
          apart.
        </p>
        <div
          style={{
            width: pixels,
            height: 14,
            borderInline: "2px solid var(--text)",
            borderBottom: "2px solid var(--text)",
          }}
        />
        <label>
          Calibration line width
          <input
            className="app-input"
            type="range"
            min="100"
            max="250"
            value={pixels}
            onChange={(e) => {
              setPixels(Number(e.target.value))
              setConfirmed(false)
            }}
          />
        </label>
        <label className="flex min-h-12 items-center gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I checked the 5 cm reference
        </label>
        {confirmed && (
          <div className="overflow-hidden">
            <div
              aria-label="Centimetre ruler with millimetre ticks"
              style={{ position: "relative", height: pixels * 2 + 5 }}
            >
              {Array.from({ length: 101 }, (_, i) => (
                <span
                  aria-hidden="true"
                  key={i}
                  style={{
                    position: "absolute",
                    top: (i * pixels) / 50,
                    width: i % 10 === 0 ? 48 : i % 5 === 0 ? 32 : 20,
                    borderTop: "1px solid var(--text)",
                  }}
                >
                  {i % 10 === 0 && (
                    <b style={{ position: "absolute", left: 54, top: -9, whiteSpace: "nowrap" }}>
                      {i / 10} cm
                    </b>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPanel>
  )
}
