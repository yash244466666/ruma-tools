import { useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { formatCents } from "@/tools/_shared/money"
import { maximumPrice, parsePrice, priceClamped } from "./unit-price"

interface BasketItem {
  id: number
  name: string
  cents: number
  quantity: number
}

function centsOf(value: string) {
  const price = parsePrice(value)
  return price === null || priceClamped(value) ? null : Math.round(price * 100)
}

export function ShoppingBasket() {
  const [items, setItems] = useState<BasketItem[]>([])
  const [budget, setBudget] = useState("")
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [error, setError] = useState("")
  const nextId = useRef(1)
  const total = items.reduce((sum, item) => sum + item.cents * item.quantity, 0)
  const budgetCents = centsOf(budget)
  const priceHint = `Enter an amount from 0 to ${maximumPrice.toLocaleString("en-US")} with up to two decimal places.`

  function add() {
    const cents = centsOf(price)
    const count = Number(quantity)
    if (cents === null) {
      setError(priceHint)
      return
    }
    if (!/^\d+$/.test(quantity.trim()) || count < 1 || count > 999) {
      setError("Enter a quantity from 1 to 999.")
      return
    }
    const id = nextId.current++
    setItems((current) => [
      ...current,
      { id, name: name.trim() || `Item ${id}`, cents, quantity: count },
    ])
    setName("")
    setPrice("")
    setQuantity("1")
    setError("")
  }

  function adjust(id: number, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(999, item.quantity + delta)) }
          : item,
      ),
    )
  }

  return (
    <div className="grid gap-4">
      <ToolPanel title="Shopping basket">
        <Field
          label="Budget (optional)"
          htmlFor="basket-budget"
          error={budget.trim() && budgetCents === null ? priceHint : undefined}
        >
          <input
            className="app-input"
            id="basket-budget"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </Field>
        <div className="mt-4 rounded-xl bg-[var(--atlas-feature)] p-4" role="status">
          <p>
            Total <strong>{formatCents(total)}</strong>
          </p>
          {budgetCents !== null && (
            <p>
              {budgetCents >= total ? "Budget left" : "Over budget"}{" "}
              <strong>{formatCents(Math.abs(budgetCents - total))}</strong>
            </p>
          )}
        </div>
      </ToolPanel>
      <ToolPanel title="Add a purchase">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Field label="Item name (optional)" htmlFor="basket-item">
            <input
              className="app-input"
              id="basket-item"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price per item" htmlFor="basket-price">
              <input
                className="app-input"
                inputMode="decimal"
                id="basket-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="Quantity" htmlFor="basket-quantity">
              <input
                className="app-input"
                inputMode="numeric"
                id="basket-quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
          </div>
          {error && (
            <p className="text-sm text-[var(--danger-text)]" role="alert">
              {error}
            </p>
          )}
          <Button type="submit">Add to basket</Button>
        </form>
      </ToolPanel>
      {items.length > 0 && (
        <ToolPanel title="In your basket">
          <ul className="grid gap-3">
            {items.map((item) => (
              <li key={item.id} className="border-b border-[var(--border)] py-2">
                <strong className="wrap-anywhere">{item.name}</strong>
                <p>
                  {formatCents(item.cents)} × {item.quantity} ={" "}
                  {formatCents(item.cents * item.quantity)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    aria-label={`One fewer ${item.name}`}
                    disabled={item.quantity === 1}
                    onClick={() => adjust(item.id, -1)}
                  >
                    −
                  </Button>
                  <Button
                    variant="secondary"
                    aria-label={`One more ${item.name}`}
                    disabled={item.quantity === 999}
                    onClick={() => adjust(item.id, 1)}
                  >
                    +
                  </Button>
                  <Button
                    variant="quiet"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      setItems((current) => current.filter((entry) => entry.id !== item.id))
                    }
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ToolPanel>
      )}
    </div>
  )
}
