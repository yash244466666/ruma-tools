import { expect, test, type Page } from "@playwright/test"
import { readFile } from "node:fs/promises"
import JSZip from "jszip"
import QRCode from "qrcode"
import { PDFDocument } from "pdf-lib"

async function pick(page: Page, label: string, name: string, mimeType: string, buffer: Buffer) {
  const chooser = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: label, exact: true }).click()
  await (await chooser).setFiles({ name, mimeType, buffer })
}
test("creates and reopens a ZIP and saves the original bytes", async ({ page }) => {
  await page.goto("/#/tool/archive-manager")
  const download = page.waitForEvent("download")
  await pick(
    page,
    "Choose files and create ZIP",
    "example.txt",
    "text/plain",
    Buffer.from("atlas sample"),
  )
  const bytes = await readFile(await (await download).path())
  expect(await (await JSZip.loadAsync(bytes)).file("example.txt")?.async("text")).toBe(
    "atlas sample",
  )
  await pick(page, "Open ZIP or RAR", "files.zip", "application/zip", bytes)
  await expect(page.getByText("example.txt", { exact: true })).toBeVisible()
  const output = page.waitForEvent("download")
  await page.getByRole("button", { name: /^Save file/ }).click()
  expect((await readFile(await (await output).path())).toString()).toBe("atlas sample")
})
test("lists a synthetic RAR4 and extracts its stored file", async ({ page }) => {
  await page.goto("/#/tool/archive-manager")
  const bytes = Buffer.from(
    "UmFyIRoHAM+QcwAADQAAAAAAAABY9XQAgCsADAAAAAwAAAAD786xqwAAAAAUMAsApIEAAGV4YW1wbGUudHh0YXRsYXMgc2FtcGxlBLB7AAAHAA==",
    "base64",
  )
  await pick(page, "Open ZIP or RAR", "sample.rar", "application/vnd.rar", bytes)
  await expect(page.getByText("example.txt", { exact: true })).toBeVisible()
  const output = page.waitForEvent("download")
  await page.getByRole("button", { name: /^Save file/ }).click()
  expect((await readFile(await (await output).path())).toString()).toBe("atlas sample")
})
test("reads a photo QR and generates a corrected PDF and print sheet", async ({ page }) => {
  const bytes = await QRCode.toBuffer("offline test text")
  await page.goto("/#/tool/qr-photo-reader")
  await pick(page, "Choose photo", "code.png", "image/png", bytes)
  await expect(page.getByText("offline test text", { exact: true })).toBeVisible()
  for (const [id, button] of [
    ["scan-to-pdf", "Save scanned PDF"],
    ["id-photo", "Save A4 print sheet"],
  ] as const) {
    await page.goto("/#/tool/" + id)
    await pick(page, "Choose photo", "page.png", "image/png", bytes)
    const output = page.waitForEvent("download")
    await page.getByRole("button", { name: button }).click()
    const doc = await PDFDocument.load(await readFile(await (await output).path()))
    expect(doc.getPageCount()).toBe(1)
    if (id === "id-photo") expect(doc.getPage(0).getWidth()).toBeCloseTo(595.28, 1)
  }
})
test("restores a packing list and removes it through settings", async ({ page }) => {
  await page.goto("/#/tool/packing-checklist")
  await page.getByLabel("Item to pack").fill("Charger")
  await page.getByRole("button", { name: "Add item" }).click()
  await expect(page.getByRole("checkbox", { name: "Charger" })).toBeVisible()
  await page.reload()
  await page.getByRole("checkbox", { name: "Charger" }).check()
  await expect(page.getByText("1 of 1 packed")).toBeVisible()
  await page.goto("/#/settings")
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("1 packing item")
    await dialog.accept()
  })
  await page.getByRole("button", { name: "Clear local preferences" }).click()
  await page.goto("/#/tool/packing-checklist")
  await expect(page.getByText("0 of 0 packed")).toBeVisible()
})
test("photo ruler measures a box and the live tool links to its fallback", async ({ page }) => {
  await page.goto("/#/tool/live-ar-measure")
  await page.getByRole("link", { name: "Measure from a photo instead" }).click()
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 400, 400)
    ctx.strokeRect(50, 100, 300, 200)
    return canvas.toDataURL("image/png").split(",")[1] ?? ""
  })
  await pick(page, "Choose photo", "test-box.png", "image/png", Buffer.from(png, "base64"))
  await page.getByText("Position a point with controls").click()
  for (const [x, y] of [
    [0, 0],
    [25, 0],
    [12.5, 25],
    [87.5, 25],
    [87.5, 75],
    [12.5, 75],
  ] as const) {
    await page.getByLabel("Horizontal position (%)").fill(String(x))
    await page.getByLabel("Vertical position (%)").fill(String(y))
    await page.getByRole("button", { name: "Mark point", exact: true }).click()
  }
  await expect(page.getByText("600 cm²", { exact: true })).toBeVisible()
  await page.getByLabel("Height (cm)").fill("10")
  await expect(page.getByText(/6,000 cm³ · 6 L/)).toBeVisible()
  await page.getByRole("button", { name: "Undo", exact: true }).click()
  await expect(page.getByText("Mark the last corner.")).toBeVisible()
})
