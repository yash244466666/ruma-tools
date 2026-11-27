import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { usePlatform } from "@/platform/platform-context"
type Item = { name: string; packed: boolean }
const key = "packing-items-v1"
export default function Packing() {
  const { preferences } = usePlatform()
  const [items, setItems] = useState<Item[]>([]),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(true),
    [status, setStatus] = useState("")
  useEffect(() => {
    let active = true
    void preferences
      .get<Item[]>(key)
      .then((list) => {
        if (active && Array.isArray(list))
          setItems(
            list
              .filter((i) => i && typeof i.name === "string" && typeof i.packed === "boolean")
              .slice(0, 200),
          )
      })
      .catch(() => {
        if (active) setStatus("Could not read the saved list.")
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [preferences])
  async function save(next: Item[]) {
    setBusy(true)
    try {
      await preferences.set(key, next)
      setItems(next)
      setName("")
      setStatus("List saved on this phone.")
    } catch {
      setStatus("Could not save. Try again.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <ToolPanel title="Packing list">
      <div className="grid gap-3">
        <label>
          Item to pack
          <input
            className="app-input"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button
          disabled={busy || !name.trim() || items.length >= 200}
          onClick={() => void save([...items, { name: name.trim(), packed: false }])}
        >
          Add item
        </Button>
        <p>
          {items.filter((i) => i.packed).length} of {items.length} packed
        </p>
        {items.map((item, i) => (
          <div className="flex flex-wrap justify-between gap-2" key={i}>
            <label className="flex min-h-12 items-center gap-2">
              <input
                type="checkbox"
                disabled={busy}
                checked={item.packed}
                onChange={() =>
                  void save(items.map((v, j) => (j === i ? { ...v, packed: !v.packed } : v)))
                }
              />
              {item.name}
            </label>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void save(items.filter((_, j) => i !== j))}
            >
              Remove {item.name}
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          disabled={busy || !items.some((i) => i.packed)}
          onClick={() => void save(items.map((i) => ({ ...i, packed: false })))}
        >
          Uncheck all for next trip
        </Button>
        <p role="status">{status}</p>
      </div>
    </ToolPanel>
  )
}
