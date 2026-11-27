import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { PlatformProvider } from "@/platform/platform-context"
import { platformServices } from "@/platform/services"
import AudioRecorder from "./AudioRecorder"

function renderTool() {
  render(
    <PlatformProvider>
      <AudioRecorder />
    </PlatformProvider>,
  )
}

describe("Audio Recorder interactions", () => {
  it("discloses the offline-only, in-memory-only behavior up front", () => {
    renderTool()
    expect(screen.getByRole("status")).toHaveTextContent(/offline-only/i)
    expect(screen.getByText(/never written to storage unless you export/i)).toBeVisible()
    expect(screen.getByText(/10 minutes or 32 MB/i)).toBeVisible()
    expect(screen.getByRole("button", { name: /start recording/i })).toBeEnabled()
  })

  it("surfaces the unsupported state when the environment has no capture stack", async () => {
    renderTool()
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }))
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/recording not supported/i)
    })
    expect(screen.getByRole("status")).toHaveTextContent(/unavailable right now/i)
    expect(screen.getByRole("button", { name: /start recording/i })).toBeEnabled()
  })

  it("exports an Opus recording using Android's WebM container MIME type", async () => {
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL() {
          return "blob:synthetic-audio"
        }
        static revokeObjectURL() {}
      },
    )
    const start = vi.spyOn(platformServices.microphone, "start").mockResolvedValue(undefined)
    const stop = vi.spyOn(platformServices.microphone, "stop").mockResolvedValue({
      data: new Uint8Array([1, 2, 3]).buffer,
      durationMs: 1000,
      finalReason: "user",
      mimeType: "audio/webm;codecs=opus",
    })
    const save = vi.spyOn(platformServices.files, "saveAs").mockResolvedValue(undefined)
    try {
      renderTool()
      fireEvent.click(screen.getByRole("button", { name: "Start recording" }))
      fireEvent.click(await screen.findByRole("button", { name: "Stop" }))
      fireEvent.click(await screen.findByRole("button", { name: "Save WebM" }))
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
      const exported = save.mock.calls[0]?.[0]
      expect(exported?.name).toMatch(/\.webm$/)
      expect(exported?.mimeType).toBe("audio/webm")
      expect(exported?.encoding).toBe("base64")
      expect(exported?.data).toBe("AQID")
    } finally {
      start.mockRestore()
      stop.mockRestore()
      save.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it("hides the export panel until a take exists", () => {
    renderTool()
    expect(screen.queryByRole("button", { name: /save webm/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save wav/i })).not.toBeInTheDocument()
  })
})
