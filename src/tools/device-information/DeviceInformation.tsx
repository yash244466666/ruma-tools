import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { diagnostics, isAndroidTester } from "@/platform/preview-services"

function Information({ kind }: { kind: "battery" | "device" }) {
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    if (!isAndroidTester) return
    let current = true
    void diagnostics[kind]()
      .then((rows) => {
        if (current) {
          setData(rows)
          setError("")
        }
      })
      .catch(() => {
        if (current) setError("Details are temporarily unavailable. Try refreshing.")
      })
    return () => {
      current = false
    }
  }, [revision, kind])
  return (
    <ToolPanel title={kind === "battery" ? "Battery readings" : "Device and cameras"}>
      {isAndroidTester ? (
        <div className="grid gap-3">
          <Button variant="secondary" onClick={() => setRevision((v) => v + 1)}>
            Refresh readings
          </Button>
          {error && <p role="alert">{error}</p>}
          {data ? (
            <dl className="grid gap-3">
              {Object.entries(data).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
                  <dd className="break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            !error && <p role="status">Reading device…</p>
          )}
          <p className="text-sm">Available fields depend on what your phone reports.</p>
        </div>
      ) : (
        <p>Open this tool in the Android test APK to read your phone’s hardware.</p>
      )}
    </ToolPanel>
  )
}
export function BatteryInfo() {
  return <Information kind="battery" />
}
export function DeviceInfo() {
  return <Information kind="device" />
}
