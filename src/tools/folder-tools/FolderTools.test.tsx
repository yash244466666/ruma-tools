import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import type { FolderEntry } from "@/platform/preview-services"
import { StorageAnalysis, StorageCleaner } from "./FolderTools"

const service = vi.hoisted(() => ({
  choose: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  storage: vi.fn(),
}))
vi.mock("@/platform/preview-services", () => ({
  isAndroidTester: true,
  scopedFolders: service,
  diagnostics: { storage: service.storage },
}))

function file(key: string, bytes: number): FolderEntry {
  return {
    key,
    name: key,
    directory: false,
    mime: "text/plain",
    size: bytes,
    deletable: true,
    renameable: true,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  service.choose.mockResolvedValue({ key: "root", name: "Test documents" })
  service.close.mockResolvedValue(undefined)
  service.storage.mockResolvedValue({ total: 2048, available: 800, free: 1024 })
})

it("requires a second confirmation and reports partial deletion after a provider failure", async () => {
  const first = file("one.txt", 12),
    second = file("two.txt", 8)
  service.list
    .mockResolvedValueOnce({ entries: [first, second], limited: false })
    .mockResolvedValueOnce({ entries: [second], limited: false })
  service.remove.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("unavailable"))
  render(<StorageCleaner />)
  fireEvent.click(screen.getByRole("button", { name: "Choose folder" }))
  fireEvent.click(await screen.findByRole("checkbox", { name: first.name }))
  fireEvent.click(screen.getByRole("checkbox", { name: second.name }))
  fireEvent.click(screen.getByRole("button", { name: /Review 2 files/ }))
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
  expect(service.remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button", { name: /Review 2 files/ }))
  fireEvent.click(screen.getByRole("button", { name: "Confirm permanent deletion" }))
  expect(await screen.findByText("Deleted 1 of 2 selected files.")).toBeVisible()
  expect(service.remove.mock.calls).toEqual([[{ key: first.key }], [{ key: second.key }]])
  expect(screen.queryByRole("checkbox", { name: first.name })).toBeNull()
  expect(screen.getByRole("checkbox", { name: second.name })).not.toBeChecked()
})

it("counts nested files once and exposes an incomplete provider listing", async () => {
  const child = { ...file("nested", 0), directory: true }
  service.list.mockImplementation(({ parent }: { parent: string }) =>
    Promise.resolve(
      parent === "root"
        ? { entries: [child, file("one.txt", 12)], limited: false }
        : { entries: [file("two.txt", 8)], limited: true },
    ),
  )
  render(<StorageAnalysis />)
  fireEvent.click(screen.getByRole("button", { name: "Choose folder" }))
  fireEvent.click(await screen.findByRole("button", { name: "Include subfolders" }))
  await waitFor(() => expect(screen.getByText("text · 20 B")).toBeVisible())
  expect(screen.getByText(/Partial scan · 2 files/)).toBeVisible()
  expect(screen.getByText(/800 B available/)).toBeVisible()
})
