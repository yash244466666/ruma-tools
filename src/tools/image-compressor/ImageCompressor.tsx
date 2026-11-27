import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { BeforeAfter, Meter, ResultReveal } from "@/components/motion/primitives"
import { usePlatform } from "@/platform/platform-context"
import { PlatformError, toSafeErrorMessage } from "@/platform/errors"
import { bytesToBase64, maximumBridgeGeneratedFileBytes } from "@/platform/shared/files"
import type { PickedFile } from "@/platform/contracts"
import { blobBytes, base64ToBytes, decodeImage, encodeImage } from "./image-io"
import {
  clampQuality,
  compressedFileName,
  defaultMaxWidth,
  defaultQuality,
  formatBytes,
  imageWidthOptions,
  isSupportedImageMimeType,
  isValidDecodedPixels,
  isValidInputSize,
  maximumDecodedPixels,
  maximumInputBytes,
  planOutputFormat,
  planResize,
  savingsPercent,
  supportedImageMimeTypes,
  type ImageWidthOption,
} from "./image"

interface CompressResult {
  originalUrl: string
  url: string
  bytes: Uint8Array
  size: number
  mimeType: string
  name: string
  width: number
  height: number
}

export default function ImageCompressor() {
  const { files } = usePlatform()
  const [picked, setPicked] = useState<PickedFile | null>(null)
  const [quality, setQuality] = useState(defaultQuality)
  const [maxWidth, setMaxWidth] = useState<ImageWidthOption>(defaultMaxWidth)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  const [jpegCopy, setJpegCopy] = useState(false)
  const active = useRef(true)
  const resultPanel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  useEffect(() => {
    if (result) resultPanel.current?.focus()
  }, [result])

  // The preview URL is disposable; every replacement and the unmount revoke it.
  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url)
      if (result?.originalUrl) URL.revokeObjectURL(result.originalUrl)
    }
  }, [result])

  const pickImage = useCallback(async () => {
    if (busy) return
    setError("")
    setStatus("")
    setBusy(true)
    try {
      const selected = await files.pick({
        accept: [...supportedImageMimeTypes],
        maximumBytes: maximumInputBytes,
      })
      const first = selected[0]
      if (!first) {
        setStatus("No image selected.")
        return
      }
      if (!isValidInputSize(first.size)) {
        setError(`The image is larger than the ${formatBytes(maximumInputBytes)} limit.`)
        return
      }
      if (!isSupportedImageMimeType(first.mimeType)) {
        setError("Only PNG, JPEG, and WebP images are supported.")
        return
      }
      setJpegCopy(false)
      setPicked(first)
      setResult(null)
      setStatus(
        `Selected a ${formatBytes(first.size)} ${first.mimeType.replace("image/", "").toUpperCase()} image.`,
      )
    } catch (pickError) {
      setStatus(toSafeErrorMessage(pickError))
    } finally {
      if (active.current) setBusy(false)
    }
  }, [busy, files])

  const compress = useCallback(async () => {
    if (!picked || busy) return
    setBusy(true)
    setError("")
    setResult(null)
    setStatus("Reading the selected image…")
    try {
      const content = await files.readContent(picked, { maximumBytes: maximumInputBytes })
      const bytes = base64ToBytes(content.data)
      if (!active.current) return
      setStatus("Preparing the image…")
      const bitmap = await decodeImage(bytes, picked.mimeType)
      try {
        if (!isValidDecodedPixels(bitmap.width, bitmap.height)) {
          setStatus("")
          setError(
            `The image decodes to ${bitmap.width} by ${bitmap.height} pixels, above the ${maximumDecodedPixels / 1_000_000} megapixel limit. Choose a smaller image.`,
          )
          return
        }
        const plan = planResize(bitmap.width, bitmap.height, maxWidth)
        if (!isSupportedImageMimeType(picked.mimeType)) {
          setError("Only PNG, JPEG, and WebP images are supported.")
          return
        }
        const format = planOutputFormat(jpegCopy ? "image/jpeg" : picked.mimeType)
        setStatus("Compressing the image…")
        const blob = await encodeImage(
          bitmap,
          plan,
          format.mimeType,
          format.useQuality ? quality : undefined,
        )
        if (blob.size > maximumBridgeGeneratedFileBytes) {
          setStatus("")
          setError(
            "This output exceeds 5 MiB. Choose a smaller width or use JPEG at lower quality, then compress again.",
          )
          return
        }
        const output = await blobBytes(blob)
        if (!active.current) return
        const savings = savingsPercent(picked.size, output.length)
        setResult({
          originalUrl: URL.createObjectURL(
            new Blob([bytes.buffer as ArrayBuffer], { type: picked.mimeType }),
          ),
          url: URL.createObjectURL(blob),
          bytes: output,
          size: output.length,
          mimeType: format.mimeType,
          name: compressedFileName(picked.name, format.extension),
          width: plan.width,
          height: plan.height,
        })
        setStatus(
          savings > 0
            ? `Compressed to ${formatBytes(output.length)} — ${savings}% smaller than the original.`
            : `Re-encoded at ${formatBytes(output.length)}; the original was already efficient.`,
        )
      } finally {
        bitmap.close()
      }
    } catch (cause) {
      setStatus("")
      setError(
        cause instanceof PlatformError
          ? toSafeErrorMessage(cause)
          : "The image could not be processed. Choose another JPEG, PNG or WebP image and try again.",
      )
    } finally {
      setBusy(false)
    }
  }, [picked, busy, files, maxWidth, quality, jpegCopy])

  async function exportImage(action: "share" | "save") {
    if (!result || busy) return
    setBusy(true)
    try {
      const file = {
        name: result.name,
        mimeType: result.mimeType,
        data: bytesToBase64(result.bytes),
        encoding: "base64",
      } as const
      if (action === "share") {
        await files.share(file)
        setStatus("Compressed image shared.")
      } else {
        await files.saveAs(file)
        setStatus("Compressed image saved.")
      }
    } catch (exportError) {
      setStatus(toSafeErrorMessage(exportError))
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setPicked(null)
    setResult(null)
    setError("")
    setStatus("Image tool reset.")
  }

  return (
    <div className="grid gap-4">
      <ToolPanel title="Source image">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button disabled={busy} onClick={() => void pickImage()}>
              {picked ? "Choose another image" : "Choose image"}
            </Button>
            <Button disabled={!picked || busy} onClick={reset} variant="secondary">
              Reset
            </Button>
          </div>
          {picked ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Selected: {formatBytes(picked.size)}{" "}
              {picked.mimeType.replace("image/", "").toUpperCase()} image. PNG, JPEG, and WebP up to{" "}
              {formatBytes(maximumInputBytes)}.
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              Pick a PNG, JPEG, or WebP image up to {formatBytes(maximumInputBytes)}. Decoding is
              capped at {maximumDecodedPixels / 1_000_000} megapixels. The file never leaves this
              device.
            </p>
          )}
          {picked?.mimeType === "image/png" && (
            <label className="flex min-h-12 items-center gap-2">
              <input
                type="checkbox"
                checked={jpegCopy}
                disabled={busy}
                onChange={(e) => {
                  setJpegCopy(e.target.checked)
                  setResult(null)
                  setStatus("")
                }}
              />
              Save a smaller JPEG copy (white background)
            </label>
          )}
          <Field
            hint={`JPEG quality: ${Math.round(quality * 100)}%. PNG output stays lossless.`}
            htmlFor="image-quality"
            label="Quality"
          >
            <input
              aria-describedby="image-quality-hint"
              className="app-input"
              id="image-quality"
              disabled={busy || (picked?.mimeType === "image/png" && !jpegCopy)}
              max={1}
              min={0.1}
              onChange={(event) => {
                setQuality(clampQuality(Number(event.target.value)))
                setResult(null)
                setStatus("")
              }}
              step={0.05}
              type="range"
              value={quality}
            />
          </Field>
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-[var(--text)]" id="image-width-label">
              Maximum width
            </p>
            <div
              aria-labelledby="image-width-label"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="group"
            >
              {imageWidthOptions.map((value) => (
                <Button
                  aria-pressed={maxWidth === value}
                  key={value}
                  disabled={busy}
                  onClick={() => {
                    setMaxWidth(value)
                    setResult(null)
                    setStatus("")
                  }}
                  variant={maxWidth === value ? "primary" : "secondary"}
                >
                  {value}px
                </Button>
              ))}
            </div>
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              Images are only downscaled, never enlarged.
            </p>
          </div>
          <Button disabled={!picked || busy} onClick={() => void compress()}>
            {busy ? "Working…" : "Compress image"}
          </Button>
          {error ? (
            <p className="text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {status ? (
            <p aria-live="polite" className="text-sm text-[var(--text-secondary)]" role="status">
              {status}
            </p>
          ) : null}
        </div>
      </ToolPanel>

      <div tabIndex={-1} ref={resultPanel} aria-label="Compression result">
        <ToolPanel title="Result">
          {result ? (
            <ResultReveal token={result.url}>
              <div className="grid gap-3">
                <strong>
                  Original {formatBytes(picked?.size ?? 0)} → Output {formatBytes(result.size)}
                </strong>
                <Meter
                  label="Size change"
                  maximum={100}
                  tone={savingsPercent(picked?.size ?? 0, result.size) >= 0 ? "success" : "danger"}
                  value={Math.max(0, savingsPercent(picked?.size ?? 0, result.size))}
                  valueLabel={
                    result.size > (picked?.size ?? 0)
                      ? "Larger than the original"
                      : `${savingsPercent(picked?.size ?? 0, result.size)}% smaller`
                  }
                />
                <p className="text-sm text-[var(--text-secondary)]">
                  {result.width} by {result.height} pixels · {formatBytes(result.size)} ·{" "}
                  {result.mimeType.replace("image/", "").toUpperCase()}
                </p>
                <BeforeAfter
                  after={result.url}
                  alt={`Compressed image preview, ${result.width} by ${result.height} pixels`}
                  before={result.originalUrl}
                />
                <p className="text-xs leading-5 text-[var(--text-secondary)]">
                  Re-encoding strips camera and location metadata. The shared or saved file uses the
                  exact bytes shown here.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button disabled={busy} onClick={() => void exportImage("share")}>
                    Share image
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void exportImage("save")}
                    variant="secondary"
                  >
                    Save image
                  </Button>
                </div>
              </div>
            </ResultReveal>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              The compressed preview appears here after compressing an image.
            </p>
          )}
        </ToolPanel>
      </div>
    </div>
  )
}
