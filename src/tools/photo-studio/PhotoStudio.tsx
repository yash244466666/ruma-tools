import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { usePlatform } from "@/platform/platform-context"
import { foregroundMedia } from "@/platform/shared/foreground-media"
import { bytesToBase64 } from "@/platform/shared/files"
import { PlatformError, toSafeErrorMessage } from "@/platform/errors"
import { base64ToBytes, decodeImage } from "@/tools/image-compressor/image-io"
import {
  corners,
  jpeg,
  paperCanvas,
  photoCanvas,
  portraitCrop,
  projection,
  type Point,
} from "./photo"

type Mode = "scan" | "id" | "redact" | "qr" | "overlay" | "magnify"
const names = ["Top left", "Top right", "Bottom right", "Bottom left"]
const sizes = [
  [35, 45],
  [51, 51],
  [30, 40],
] as const
function Studio({ mode }: { mode: Mode }) {
  const { files, lifecycle, clipboard } = usePlatform()
  const [first, setFirst] = useState<HTMLCanvasElement | null>(null),
    [second, setSecond] = useState<HTMLCanvasElement | null>(null)
  const [points, setPoints] = useState<Point[]>(corners),
    [index, setIndex] = useState(0)
  const [boxes, setBoxes] = useState<Point[][]>([]),
    [anchor, setAnchor] = useState<Point | null>(null)
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [qr, setQr] = useState("")
  const [size, setSize] = useState(0),
    [x, setX] = useState(0.5),
    [y, setY] = useState(0.5),
    [alpha, setAlpha] = useState(0.4),
    [zoom, setZoom] = useState(1)
  const [live, setLive] = useState(false),
    [pending, setPending] = useState(false)
  const video = useRef<HTMLVideoElement>(null),
    view = useRef<HTMLCanvasElement>(null),
    controller = useRef<AbortController | null>(null),
    mounted = useRef(true)
  const [width, height] = sizes[size]!
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])
  async function run(action: () => Promise<string>) {
    if (busy) return
    setBusy(true)
    setStatus("Working…")
    try {
      const msg = await action()
      if (mounted.current) setStatus(msg)
    } catch (e) {
      if (mounted.current)
        setStatus(
          e instanceof PlatformError
            ? toSafeErrorMessage(e)
            : "Could not finish. Check the image or try a smaller file.",
        )
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  async function pick(asSecond = false) {
    const [file] = await files.pick({
      accept: ["image/png", "image/jpeg", "image/webp"],
      maximumBytes: 16 * 1024 * 1024,
    })
    if (!file) return "No photo selected."
    const bytes = base64ToBytes(
      (await files.readContent(file, { maximumBytes: 16 * 1024 * 1024 })).data,
    )
    if (!mounted.current) return ""
    const img = await decodeImage(bytes, file.mimeType)
    let canvas: HTMLCanvasElement
    try {
      canvas = photoCanvas(img.source, img.width, img.height)
    } finally {
      img.close()
    }
    if (!mounted.current) return ""
    if (asSecond) {
      setSecond(canvas)
      return "Second photo ready."
    }
    setFirst(canvas)
    setSecond(null)
    setIndex(0)
    setPoints(corners)
    setAnchor(null)
    setBoxes([])
    setQr("")
    setZoom(1)
    if (mode === "qr") {
      const { default: jsQR } = await import("jsqr")
      const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(data.data, data.width, data.height)
      if (!code) return "No readable QR code found. Choose a clear, closer photo."
      setQr(code.data)
      return "QR code read."
    }
    return "Photo ready."
  }
  async function camera() {
    if (controller.current) return
    const abort = new AbortController()
    controller.current = abort
    setPending(true)
    setStatus("Opening camera…")
    try {
      const stream = await foregroundMedia(
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false },
        lifecycle,
        abort.signal,
        () => {
          if (video.current) video.current.srcObject = null
          controller.current = null
          if (mounted.current) {
            setLive(false)
            setPending(false)
          }
        },
      )
      if (!video.current) {
        abort.abort()
        return
      }
      video.current.srcObject = stream
      await video.current.play()
      if (!abort.signal.aborted) {
        setLive(true)
        setStatus("Camera live.")
      }
    } catch {
      abort.abort()
      if (mounted.current) setStatus("Camera unavailable. Check camera access or choose a photo.")
    } finally {
      if (mounted.current) setPending(false)
    }
  }
  function freeze() {
    const v = video.current
    if (!v?.videoWidth) return
    const shot = photoCanvas(v, v.videoWidth, v.videoHeight)
    if (mode === "overlay" && first) setSecond(shot)
    else setFirst(shot)
    controller.current?.abort()
    setStatus("View frozen.")
  }
  function draw(target: HTMLCanvasElement, guides: boolean) {
    if (!first) return
    if (mode === "id") {
      const crop = portraitCrop(first, width / height, x, y)
      target.width = crop.width
      target.height = crop.height
      target.getContext("2d")!.drawImage(crop, 0, 0)
      return
    }
    target.width = first.width
    target.height = first.height
    const ctx = target.getContext("2d")!,
      w = target.width,
      h = target.height
    ctx.drawImage(first, 0, 0)
    if (mode === "overlay" && second) {
      ctx.globalAlpha = 1 - alpha
      ctx.drawImage(second, 0, 0, w, h)
      ctx.globalAlpha = 1
    }
    if (mode === "magnify" && zoom > 1)
      ctx.drawImage(first, (w - w / zoom) * x, (h - h / zoom) * y, w / zoom, h / zoom, 0, 0, w, h)
    if (mode === "redact") {
      ctx.fillStyle = "black"
      for (const [a, b] of boxes) {
        ctx.fillRect(
          Math.min(a!.x, b!.x) * w,
          Math.min(a!.y, b!.y) * h,
          Math.abs(a!.x - b!.x) * w,
          Math.abs(a!.y - b!.y) * h,
        )
      }
      if (guides && anchor) {
        ctx.fillStyle = "white"
        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.arc(anchor.x * w, anchor.y * h, Math.max(4, w / 80), 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      }
    }
    if (mode === "scan" && guides) {
      ctx.lineWidth = Math.max(3, w / 200)
      ctx.strokeStyle = "white"
      ctx.shadowColor = "black"
      ctx.shadowBlur = 3
      ctx.beginPath()
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * w, p.y * h)
        else ctx.lineTo(p.x * w, p.y * h)
      })
      ctx.closePath()
      ctx.stroke()
      points.forEach((p, i) => {
        ctx.fillStyle = i === index ? "yellow" : "white"
        ctx.beginPath()
        ctx.arc(p.x * w, p.y * h, Math.max(6, w / 55), 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    }
  }
  useEffect(() => {
    if (view.current && first) draw(view.current, true)
  })
  function setPoint(p: Point) {
    if (mode === "scan") {
      setPoints(points.map((v, i) => (i === index ? p : v)))
      setIndex((index + 1) % 4)
    }
    if (mode === "redact") {
      if (!anchor) setAnchor(p)
      else {
        if (
          Math.abs(p.x - anchor.x) * first!.width >= 1 &&
          Math.abs(p.y - anchor.y) * first!.height >= 1
        )
          setBoxes([...boxes, [anchor, p]])
        setAnchor(null)
      }
    }
  }
  async function save() {
    if (!first) return ""
    let bytes: Uint8Array, name: string, mime: string
    if (mode === "id" || mode === "scan") {
      const { PDFDocument } = await import("pdf-lib"),
        pdf = await PDFDocument.create()
      const canvas =
        mode === "scan" ? paperCanvas(first, points) : portraitCrop(first, width / height, x, y)
      const image = await pdf.embedJpg(await jpeg(canvas))
      if (mode === "id") {
        const unit = 72 / 25.4,
          page = pdf.addPage([210 * unit, 297 * unit])
        for (let top = 10; top + height <= 287; top += height + 4)
          for (let left = 10; left + width <= 200; left += width + 4)
            page.drawImage(image, {
              x: left * unit,
              y: (297 - top - height) * unit,
              width: width * unit,
              height: height * unit,
            })
      } else {
        const page = pdf.addPage([canvas.width, canvas.height])
        page.drawImage(image, { x: 0, y: 0, width: canvas.width, height: canvas.height })
      }
      bytes = await pdf.save()
      name = mode === "scan" ? "scanned-page.pdf" : "id-print-sheet.pdf"
      mime = "application/pdf"
    } else {
      const canvas = document.createElement("canvas")
      draw(canvas, false)
      bytes = await jpeg(canvas)
      name =
        mode === "redact"
          ? "redacted-photo.jpg"
          : mode === "overlay"
            ? "photo-comparison.jpg"
            : "magnified.jpg"
      mime = "image/jpeg"
    }
    if (!mounted.current) return ""
    await files.saveAs({ encoding: "base64", mimeType: mime, name, data: bytesToBase64(bytes) })
    return "File saved."
  }
  const supportsCamera = mode === "overlay" || mode === "magnify"
  return (
    <ToolPanel>
      <div className="grid gap-3">
        <Button disabled={busy || live} onClick={() => void run(() => pick())}>
          {first ? "Choose another photo" : "Choose photo"}
        </Button>
        {supportsCamera && (
          <>
            <div className={live ? "relative overflow-hidden" : "hidden"}>
              <video
                ref={video}
                className="w-full"
                muted
                playsInline
                style={{ transform: mode === "magnify" ? "scale(" + zoom + ")" : undefined }}
              />
              {live && mode === "overlay" && first && <Reference canvas={first} opacity={alpha} />}
            </div>
            <Button disabled={pending || busy} onClick={() => (live ? freeze() : void camera())}>
              {live ? "Freeze view" : "Open camera"}
            </Button>
            {(live || pending) && (
              <Button variant="secondary" onClick={() => controller.current?.abort()}>
                Close camera
              </Button>
            )}
          </>
        )}
        {mode === "overlay" && first && (
          <Button
            disabled={busy || live}
            variant="secondary"
            onClick={() => void run(() => pick(true))}
          >
            Choose second photo
          </Button>
        )}
        {mode === "id" && (
          <label>
            Printed photo size
            <select
              className="app-input"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            >
              {sizes.map(([w, h], i) => (
                <option key={i} value={i}>
                  {w} × {h} mm
                </option>
              ))}
            </select>
          </label>
        )}
        {mode === "overlay" && first && (
          <Slider label="Reference opacity" value={alpha} change={setAlpha} />
        )}
        {mode === "magnify" && (first || live) && (
          <label>
            Magnification · {zoom}×
            <input
              className="app-input"
              type="range"
              min={1}
              max={5}
              step=".25"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
        )}
        {first && (
          <>
            <canvas
              ref={view}
              className="max-h-[55vh] max-w-full justify-self-start"
              style={{ width: "auto", height: "auto", display: live ? "none" : "block" }}
              aria-label="Selected photo preview"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setPoint({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
              }}
            />
            {mode === "scan" && (
              <>
                <label>
                  Corner to position
                  <select
                    className="app-input"
                    value={index}
                    onChange={(e) => setIndex(Number(e.target.value))}
                  >
                    {names.map((n, i) => (
                      <option key={n} value={i}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <p>Tap the photo for each corner, or adjust it below.</p>
                {(["x", "y"] as const).map((axis) => (
                  <Slider
                    key={axis}
                    label={axis === "x" ? "Horizontal corner position" : "Vertical corner position"}
                    value={points[index]![axis]}
                    change={(v) =>
                      setPoints(points.map((p, i) => (i === index ? { ...p, [axis]: v } : p)))
                    }
                  />
                ))}
                {!projection(points) && (
                  <p role="alert">Use clockwise corners, starting at the top left.</p>
                )}
              </>
            )}
            {mode === "redact" && (
              <>
                <p>
                  {anchor
                    ? "Select the opposite corner."
                    : "Select two opposite corners for each area to cover."}
                </p>
                <Slider label="Horizontal point" value={x} change={setX} />
                <Slider label="Vertical point" value={y} change={setY} />
                <Button variant="secondary" onClick={() => setPoint({ x, y })}>
                  {anchor ? "Finish rectangle" : "Mark first corner"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!anchor && !boxes.length}
                  onClick={() => (anchor ? setAnchor(null) : setBoxes(boxes.slice(0, -1)))}
                >
                  Undo last mark
                </Button>
              </>
            )}
            {(mode === "id" || (mode === "magnify" && zoom > 1)) && (
              <>
                <Slider label="Horizontal framing" value={x} change={setX} />
                <Slider label="Vertical framing" value={y} change={setY} />
              </>
            )}
            {mode === "id" && <p>Print the A4 sheet at actual size (100%).</p>}
            {mode === "qr" ? (
              qr && (
                <>
                  <p className="break-all">{qr}</p>
                  <Button
                    onClick={() =>
                      void run(async () => {
                        await clipboard.writeText(qr)
                        return "QR text copied."
                      })
                    }
                  >
                    Copy QR text
                  </Button>
                </>
              )
            ) : (
              <Button
                disabled={
                  busy ||
                  live ||
                  (mode === "redact" && (!boxes.length || !!anchor)) ||
                  (mode === "scan" && !projection(points)) ||
                  (mode === "overlay" && !second)
                }
                onClick={() => void run(save)}
              >
                {mode === "id"
                  ? "Save A4 print sheet"
                  : mode === "scan"
                    ? "Save scanned PDF"
                    : "Save image"}
              </Button>
            )}
          </>
        )}
        <p role="status">{status}</p>
      </div>
    </ToolPanel>
  )
}
function Reference({ canvas, opacity }: { canvas: HTMLCanvasElement; opacity: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.width = canvas.width
      ref.current.height = canvas.height
      ref.current.getContext("2d")?.drawImage(canvas, 0, 0)
    }
  }, [canvas])
  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      aria-label="Reference image overlay"
    />
  )
}
function Slider({
  label,
  value,
  change,
}: {
  label: string
  value: number
  change: (v: number) => void
}) {
  return (
    <label>
      {label} · {Math.round(value * 100)}%
      <input
        className="app-input"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => change(Number(e.target.value))}
      />
    </label>
  )
}
export function DocumentScanner() {
  return <Studio mode="scan" />
}
export function IdPhoto() {
  return <Studio mode="id" />
}
export function PhotoOverlay() {
  return <Studio mode="overlay" />
}
export function Redaction() {
  return <Studio mode="redact" />
}
export function QrReader() {
  return <Studio mode="qr" />
}
export function Magnifier() {
  return <Studio mode="magnify" />
}
