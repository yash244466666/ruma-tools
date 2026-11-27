import { useState } from "react"
import { type Measurement, volumeLitres } from "./geometry"
const number = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
  maximumSignificantDigits: 5,
})
export default function Results({
  value,
  measuredHeight,
}: {
  value: Measurement
  measuredHeight?: number
}) {
  const [height, setHeight] = useState(measuredHeight?.toString() ?? "")
  const litres = volumeLitres(value.area, Number(height))
  return (
    <section
      className="grid gap-3 rounded-2xl bg-[var(--surface-raised)] p-4"
      aria-label="Measurement results"
    >
      <h3 className="text-lg font-semibold">Estimated measurements</h3>
      <dl className="grid grid-cols-2 gap-2">
        {value.length !== undefined && (
          <>
            <dt>Length</dt>
            <dd>{number.format(value.length)} cm</dd>
          </>
        )}
        {value.width !== undefined && (
          <>
            <dt>Width</dt>
            <dd>{number.format(value.width)} cm</dd>
          </>
        )}
        <dt>Base area</dt>
        <dd>{number.format(value.area)} cm²</dd>
      </dl>
      <label>
        Height (cm)
        <input
          className="app-input"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="Optional"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </label>
      <p className="text-sm">
        For a box or a shape with the same cross-section from bottom to top.
      </p>
      {litres !== null && (
        <p role="status">
          <strong>Volume</strong> {number.format(litres * 1000)} cm³ · {number.format(litres)} L
        </p>
      )}
    </section>
  )
}
