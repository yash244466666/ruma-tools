import { useState } from "react"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { Button } from "@/components/ui/Button"
import { electricity, frameMarks, settleExpenses } from "./calculations"

interface NumericFormProps {
  fields: readonly (readonly [label: string, initial: string])[]
  calculate: (values: number[]) => string | null
}
function NumericForm({ fields, calculate }: NumericFormProps) {
  const [values, setValues] = useState(() => fields.map((f) => f[1]))
  const numbers = values.map((s) => (s.trim() === "" ? NaN : Number(s)))
  const result = numbers.every((n) => Number.isFinite(n) && n >= 0 && n <= 1e9)
    ? calculate(numbers)
    : null
  return (
    <ToolPanel>
      <div className="grid gap-4">
        {fields.map(([label], i) => (
          <label key={label}>
            {label}
            <input
              className="app-input"
              inputMode="decimal"
              value={values[i]}
              onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
            />
          </label>
        ))}
        <p role="status" className="text-lg font-semibold">
          {result ?? "Check the measurements and enter a valid value for every field."}
        </p>
      </div>
    </ToolPanel>
  )
}
const format = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })
export function Electricity() {
  return (
    <NumericForm
      fields={[
        ["Appliance power (W)", "100"],
        ["Hours per day", "4"],
        ["Days", "30"],
        ["Your price per kWh", "8"],
      ]}
      calculate={([w, h, d, r]) => {
        const v = electricity(w!, h!, d!, r!)
        return v
          ? format(v.kwh) + " kWh · Estimated cost " + format(v.cost) + " at your rate"
          : null
      }}
    />
  )
}
export function FrameSpacing() {
  return (
    <NumericForm
      fields={[
        ["Wall width (cm)", "180"],
        ["Width of each frame (cm)", "30"],
        ["Number of identical frames", "3"],
      ]}
      calculate={([w, f, c]) => {
        const marks = frameMarks(w!, f!, c!)
        return marks
          ? "Measure each frame’s centre from the left edge (cm): " + marks.map(format).join(", ")
          : null
      }}
    />
  )
}
export function Savings() {
  return (
    <NumericForm
      fields={[
        ["Savings goal", "12000"],
        ["Already saved", "2000"],
        ["Weeks to save", "20"],
      ]}
      calculate={([goal, saved, weeks]) =>
        goal! > 0 && weeks! >= 1 && Number.isInteger(weeks)
          ? format(Math.ceil((Math.max(0, goal! - saved!) * 100) / weeks!) / 100) +
            " per week to reach your goal."
          : null
      }
    />
  )
}
export function Materials() {
  const [mode, setMode] = useState("Tiles")
  return (
    <div className="grid gap-3">
      <label>
        Material
        <select className="app-input" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>Tiles</option>
          <option>Paint</option>
        </select>
      </label>
      {mode === "Tiles" ? (
        <NumericForm
          key="tiles"
          fields={[
            ["Floor length (m)", "4"],
            ["Floor width (m)", "3"],
            ["Tile length (cm)", "30"],
            ["Tile width (cm)", "30"],
            ["Extra allowance (%)", "10"],
          ]}
          calculate={([l, w, a, b, p]) =>
            l! > 0 && w! > 0 && a! > 0 && b! > 0 && p! <= 100
              ? Math.ceil(((l! * w! * 10000) / (a! * b!)) * (1 + p! / 100)) +
                " tiles including allowance"
              : null
          }
        />
      ) : (
        <NumericForm
          key="paint"
          fields={[
            ["Wall area after subtracting openings (m²)", "12"],
            ["Number of coats", "2"],
            ["Coverage from paint tin (m² per litre)", "10"],
          ]}
          calculate={([a, c, r]) =>
            a! > 0 && Number.isInteger(c) && c! >= 1 && r! > 0
              ? format(Math.ceil(((a! * c!) / r!) * 100) / 100) + " litres of paint"
              : null
          }
        />
      )}
    </div>
  )
}
export function ExpenseSplit() {
  const [rows, setRows] = useState([
    { name: "", paid: "" },
    { name: "", paid: "" },
  ])
  const amounts = rows.map((r) =>
    /^\d{1,9}(\.\d{1,2})?$/.test(r.paid) ? Math.round(Number(r.paid) * 100) : NaN,
  )
  const transfers = settleExpenses(amounts)
  const label = (i: number) => rows[i]?.name.trim() || "Person " + (i + 1)
  return (
    <ToolPanel title="Split equally">
      <div className="grid gap-3">
        {rows.map((row, i) => (
          <fieldset key={i} className="grid gap-2 sm:grid-cols-2">
            <legend>Person {i + 1}</legend>
            {(["name", "paid"] as const).map((key) => (
              <label key={key}>
                {key === "name" ? "Name" : "Amount paid"}
                <input
                  className="app-input"
                  value={row[key]}
                  inputMode={key === "paid" ? "decimal" : "text"}
                  onChange={(e) =>
                    setRows(
                      rows.map((item, j) => (i === j ? { ...item, [key]: e.target.value } : item)),
                    )
                  }
                />
              </label>
            ))}
          </fieldset>
        ))}
        <Button
          disabled={rows.length >= 50}
          onClick={() => setRows([...rows, { name: "", paid: "" }])}
        >
          Add person
        </Button>
        <p role="status">
          {transfers
            ? transfers.length
              ? "Payments to settle"
              : "Everyone is settled."
            : "Enter the amount each person paid, including zero."}
        </p>
        {transfers && (
          <ul>
            {transfers.map((t) => (
              <li key={t.from + "-" + t.to}>
                {label(t.from)} pays {label(t.to)} {(t.amount / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ToolPanel>
  )
}
