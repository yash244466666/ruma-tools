import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"

interface Props {
  title: string
  hint: string
  labels: readonly string[]
  value: number | null
  format: (value: number) => string
}

export function CaptureComparison({ title, hint, labels, value, format }: Props) {
  const [captures, setCaptures] = useState<Record<string, number>>({})
  const measured = labels.filter((label) => captures[label] !== undefined)
  const values = measured.map((label) => captures[label]!)
  const lowest = Math.min(...values)
  const complete = measured.length === labels.length
  return (
    <ToolPanel title={title}>
      <p className="text-sm text-[var(--text-secondary)]">{hint}</p>
      <div className="mt-3 grid gap-2">
        {labels.map((label) => (
          <div className="flex flex-wrap items-center justify-between gap-2" key={label}>
            <Button
              variant="secondary"
              disabled={value === null}
              onClick={() => {
                if (value !== null) setCaptures((current) => ({ ...current, [label]: value }))
              }}
            >
              Capture {label}
            </Button>
            <span>{captures[label] === undefined ? "—" : format(captures[label])}</span>
          </div>
        ))}
      </div>
      {complete && (
        <p role="status" className="mt-3">
          Difference {format(Math.max(...values) - lowest)} · Lowest:{" "}
          {measured.filter((label) => captures[label] === lowest).join(", ")}
        </p>
      )}
      {measured.length > 0 && (
        <Button variant="quiet" onClick={() => setCaptures({})}>
          Clear comparison
        </Button>
      )}
    </ToolPanel>
  )
}
