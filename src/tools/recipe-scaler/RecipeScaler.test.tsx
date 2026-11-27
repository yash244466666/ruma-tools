import { fireEvent, render, screen, within } from "@testing-library/react"
import { PlatformProvider } from "@/platform/platform-context"
import RecipeScaler from "./RecipeScaler"

function renderTool() {
  render(
    <PlatformProvider>
      <RecipeScaler />
    </PlatformProvider>,
  )
}

describe("RecipeScaler interactions", () => {
  it("scales the typed ingredient list for the requested servings", () => {
    renderTool()
    fireEvent.change(screen.getByLabelText("I want to serve"), { target: { value: "8" } })
    fireEvent.change(screen.getByLabelText("Ingredients"), {
      target: { value: "2 cups flour\n1 1/2 tsp salt\nsalt to taste" },
    })

    const list = screen.getByRole("list", { name: "Scaled list" })
    expect(within(list).getByText("4 cups flour")).toBeInTheDocument()
    expect(within(list).getByText("3 tsp salt")).toBeInTheDocument()
    expect(within(list).getByText("salt to taste")).toBeInTheDocument()
    expect(screen.getByText("×2")).toBeInTheDocument()
    expect(screen.getByText(/1 line without a quantity left unchanged/)).toBeInTheDocument()
  })

  it("walks through doubling a two-serving recipe without typing", () => {
    renderTool()
    fireEvent.click(screen.getByRole("button", { name: /Try a rice recipe/ }))
    expect(screen.getByRole("heading", { name: "Ingredients for 4 servings" })).toBeVisible()
    expect(
      within(screen.getByRole("list", { name: "Scaled list" })).getByText("200 g rice"),
    ).toBeVisible()
  })

  it("keeps fractional text unchanged when the serving count is unchanged", () => {
    renderTool()
    fireEvent.change(screen.getByLabelText("Ingredients"), {
      target: { value: "1 1/2 cups milk" },
    })
    expect(
      within(screen.getByRole("list", { name: "Scaled list" })).getByText("1 1/2 cups milk"),
    ).toBeInTheDocument()
    expect(screen.getByText("×1")).toBeInTheDocument()
  })

  it("reports a malformed line and keeps no stale scaled list", () => {
    renderTool()
    fireEvent.change(screen.getByLabelText("Ingredients"), {
      target: { value: "2 cups flour\n2..5 cups sugar" },
    })
    expect(screen.getByRole("alert")).toHaveTextContent("Line 2")
    expect(screen.queryByRole("list", { name: "Scaled list" })).toBeNull()
  })
})
