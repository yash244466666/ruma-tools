import { ArrowLeftRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { ResultReveal } from "@/components/motion/primitives"
import {
  convertUnit,
  formatConvertedValue,
  unitCategories,
  units,
  type UnitCategoryId,
} from "@/tools/unit-converter/unit-data"

export default function UnitConverter() {
  const [category, setCategory] = useState<UnitCategoryId>("length")
  const [value, setValue] = useState("1")
  const [fromUnit, setFromUnit] = useState("meter")
  const [toUnit, setToUnit] = useState("kilometer")
  const [swapId, setSwapId] = useState(0)

  const categoryUnits = units[category]
  const numericValue = value.trim() ? Number(value) : NaN
  const result = useMemo(
    () => formatConvertedValue(convertUnit(numericValue, fromUnit, toUnit, category)),
    [category, fromUnit, numericValue, toUnit],
  )
  const unitOptions = categoryUnits.map((unit) => (
    <option key={unit.id} value={unit.id}>
      {unit.label} ({unit.symbol})
    </option>
  ))
  const destinationSymbol = categoryUnits.find((unit) => unit.id === toUnit)?.symbol

  function changeCategory(next: UnitCategoryId) {
    const nextUnits = units[next]
    setCategory(next)
    setFromUnit(nextUnits[0]?.id ?? "")
    setToUnit(nextUnits[1]?.id ?? "")
  }

  function swap() {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    setSwapId((previous) => previous + 1)
  }

  return (
    <div className="grid gap-4">
      <div className="atlas-converter-controls">
        <Field htmlFor="unit-category" label="Measurement type">
          <select
            className="app-input"
            id="unit-category"
            onChange={(event) => changeCategory(event.target.value as UnitCategoryId)}
            value={category}
          >
            {unitCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Button aria-label="Swap units" onClick={swap} variant="quiet">
          <ArrowLeftRight
            aria-hidden="true"
            className="transition-transform duration-[var(--motion-base)]"
            size={19}
            style={{ transform: `rotate(${swapId * 180}deg)` }}
          />
          Swap
        </Button>
      </div>
      <div className="atlas-conversion">
        <section className="atlas-conversion-panel" aria-label="Convert from">
          <Field htmlFor="from-unit" label="Source unit">
            <select
              className="app-input"
              id="from-unit"
              onChange={(event) => setFromUnit(event.target.value)}
              value={fromUnit}
            >
              {unitOptions}
            </select>
          </Field>
          <Field htmlFor="from-value" label="Value">
            <input
              className="app-input atlas-numeric-input"
              id="from-value"
              inputMode="decimal"
              onChange={(event) => setValue(event.target.value)}
              step="any"
              type="number"
              value={value}
            />
          </Field>
        </section>
        <section className="atlas-conversion-panel atlas-destination" aria-label="Convert to">
          <Field htmlFor="to-unit" label="Destination unit">
            <select
              className="app-input"
              id="to-unit"
              onChange={(event) => setToUnit(event.target.value)}
              value={toUnit}
            >
              {unitOptions}
            </select>
          </Field>
          <ResultReveal className="atlas-converted-value" token={result}>
            <output aria-label="Converted value" id="to-value">
              <span>{result || "—"}</span>
              {result && <span className="atlas-result-unit"> {destinationSymbol}</span>}
            </output>
          </ResultReveal>
        </section>
      </div>
      <p className="text-sm leading-6 text-[var(--text-secondary)]">
        Digital data uses binary multiples: 1 KB = 1,024 bytes. Months and years are intentionally
        excluded from duration conversion because their lengths vary.
      </p>
    </div>
  )
}
