import { useState } from "react"
import { usePlatform } from "@/platform/platform-context"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { Button } from "@/components/ui/Button"
import { lookupAddress } from "./ip"
export default function IpLookup() {
  const [text, setText] = useState(""),
    [error, setError] = useState("")
  const { browser } = usePlatform()
  const addr = lookupAddress(text)
  return (
    <ToolPanel title="Address lookup">
      <div className="grid gap-3">
        <label>
          IPv4 or IPv6 address
          <input
            className="app-input"
            placeholder="192.168.1.1"
            spellCheck={false}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError("")
            }}
          />
        </label>
        <p role="status">
          {addr
            ? addr.version + " · " + addr.scope
            : text
              ? "Enter a single valid IP address."
              : "Address type is checked on this device."}
        </p>
        {addr && ["Public address range", "Global unicast range"].includes(addr.scope) && (
          <>
            <p>
              Open RIPEstat in your browser to view registration and routing information. The
              selected address will be sent to RIPE NCC.
            </p>
            <Button
              onClick={() =>
                void browser
                  .open(new URL("https://stat.ripe.net/resource/" + encodeURIComponent(addr.value)))
                  .catch(() => setError("Could not open the browser."))
              }
            >
              View address on RIPEstat
            </Button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    </ToolPanel>
  )
}
