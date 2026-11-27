import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { CopyButton } from "@/components/ui/CopyButton"
import { Field } from "@/components/ui/Field"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { ResultReveal } from "@/components/motion/primitives"
import { formatScaleFactor, maximumIngredients, scaleRecipe } from "./recipe"

export default function RecipeScaler() {
  const [originalServings, setOriginalServings] = useState("4")
  const [desiredServings, setDesiredServings] = useState("4")
  const [text, setText] = useState("")
  const [status, setStatus] = useState("")

  const result = useMemo(() => {
    if (text.trim() === "") return null
    return scaleRecipe({ originalServings, desiredServings, text })
  }, [desiredServings, originalServings, text])

  const output = result?.status === "ok" ? result.lines.map((line) => line.scaled).join("\n") : ""
  const empty = text.trim() === ""

  return (
    <div className="grid gap-4">
      <ToolPanel title="How many people are you cooking for?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="recipe-original-servings" label="My recipe serves">
            <input
              autoComplete="off"
              className="app-input font-mono"
              id="recipe-original-servings"
              inputMode="decimal"
              onChange={(event) => setOriginalServings(event.target.value)}
              value={originalServings}
            />
          </Field>
          <Field htmlFor="recipe-desired-servings" label="I want to serve">
            <input
              autoComplete="off"
              className="app-input font-mono"
              id="recipe-desired-servings"
              inputMode="decimal"
              onChange={(event) => setDesiredServings(event.target.value)}
              value={desiredServings}
            />
          </Field>
        </div>
      </ToolPanel>
      <ToolPanel title="Original ingredients">
        <Field
          hint={`Start each line with the amount, such as “1 cup rice”. Enter up to ${maximumIngredients} lines.`}
          htmlFor="recipe-ingredients"
          label="Ingredients"
        >
          <textarea
            autoComplete="off"
            aria-describedby="recipe-ingredients-hint"
            className="app-input min-h-28 resize-y"
            id="recipe-ingredients"
            onChange={(event) => setText(event.target.value)}
            placeholder={"2 cups flour\n1 1/2 tsp salt\n1/2 cup sugar\nsalt to taste"}
            spellCheck={false}
            value={text}
          />
        </Field>

        {result?.status === "error" ? (
          <p className="mt-3 text-sm text-[var(--danger-text)]" role="alert">
            {result.message}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {empty ? (
            <Button
              variant="secondary"
              onClick={() => {
                setOriginalServings("2")
                setDesiredServings("4")
                setText("100 g rice\n250 ml water\nsalt to taste")
                setStatus("")
              }}
            >
              Try a rice recipe for 2 → 4
            </Button>
          ) : (
            <Button
              variant="quiet"
              onClick={() => {
                setText("")
                setStatus("")
              }}
            >
              Clear ingredients
            </Button>
          )}
        </div>
      </ToolPanel>

      <ToolPanel
        action={
          output ? (
            <CopyButton label="Copy scaled ingredients" onStatus={setStatus} value={output} />
          ) : undefined
        }
        title={
          result?.status === "ok"
            ? `Ingredients for ${desiredServings} servings`
            : "Adjusted ingredients"
        }
      >
        {empty ? (
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Your adjusted amounts appear as you type.
          </p>
        ) : result?.status === "ok" ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              {originalServings} → {desiredServings} servings ·{" "}
              <strong>×{formatScaleFactor(result.factor)}</strong>
              {result.unscaledCount > 0
                ? ` · ${result.unscaledCount} line${result.unscaledCount === 1 ? "" : "s"} without a quantity left unchanged`
                : ""}
            </p>
            <ResultReveal
              token={`${result.factor}-${result.lines.length}-${result.lines[0]?.scaled ?? ""}`}
            >
              <ul className="mt-3 grid gap-2 text-base leading-6" aria-label="Scaled list">
                {result.lines.map((line, index) => (
                  <li key={`${index}-${line.scaled}`}>{line.scaled}</li>
                ))}
              </ul>
            </ResultReveal>
            <p aria-live="polite" className="sr-only" role="status">
              Scaled {result.lines.length} ingredient line{result.lines.length === 1 ? "" : "s"} by
              ×{formatScaleFactor(result.factor)}.
            </p>
          </>
        ) : null}
      </ToolPanel>

      <p aria-live="polite" className="sr-only" role="status">
        {status}
      </p>
      <p className="text-xs leading-5 text-[var(--text-secondary)]">
        Quantities update automatically. Cooking times and temperatures stay with the original
        recipe.
      </p>
    </div>
  )
}
