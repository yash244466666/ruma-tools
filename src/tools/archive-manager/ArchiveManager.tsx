import { useEffect, useRef, useState } from "react"
import JSZip from "jszip"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { Button } from "@/components/ui/Button"
import { usePlatform } from "@/platform/platform-context"
import { PlatformError, toSafeErrorMessage } from "@/platform/errors"
import {
  bytesToBase64,
  maximumBridgeGeneratedFileBytes as limit,
  sanitizeGeneratedFileName,
} from "@/platform/shared/files"
import { base64ToBytes } from "@/tools/image-compressor/image-io"
import { formatBytes } from "@/tools/image-compressor/image"
import type { ArchiveEntry, ArchiveReply } from "./archive.worker"

const maxInput = 16 * 1024 * 1024
export default function ArchiveManager() {
  const { files } = usePlatform()
  const active = useRef(true),
    cancel = useRef<() => void>(undefined)
  const [rows, setRows] = useState<ArchiveEntry[]>([]),
    [source, setSource] = useState<Uint8Array | null>(null)
  const [busy, setBusy] = useState(false),
    [state, setState] = useState("")
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      cancel.current?.()
    }
  }, [])
  async function run(action: () => Promise<string>) {
    setBusy(true)
    setState("Working…")
    try {
      const message = await action()
      if (active.current) setState(message)
    } catch (e) {
      if (active.current)
        setState(
          e instanceof PlatformError
            ? toSafeErrorMessage(e)
            : e instanceof Error
              ? e.message
              : "Archive operation failed.",
        )
    } finally {
      if (active.current) setBusy(false)
    }
  }
  function read(bytes: Uint8Array, entry?: ArchiveEntry) {
    return new Promise<ArchiveReply>((resolve, reject) => {
      const w = new Worker(new URL("./archive.worker.ts", import.meta.url), { type: "module" })
      const finish = () => {
        clearTimeout(timer)
        w.terminate()
        cancel.current = undefined
      }
      cancel.current = () => {
        finish()
        reject(Error("Reading cancelled."))
      }
      const timer = setTimeout(() => {
        finish()
        reject(Error("Reading took too long. Choose a smaller file."))
      }, 12000)
      w.onmessage = (event: MessageEvent<ArchiveReply>) => {
        finish()
        if (event.data.error) reject(Error(event.data.error))
        else resolve(event.data)
      }
      w.onerror = () => {
        finish()
        reject(Error("The archive decoder is unavailable."))
      }
      w.postMessage({ bytes, entry })
    })
  }
  async function createZip() {
    const picked = await files.pick({ accept: ["*/*"], multiple: true, maximumBytes: limit })
    if (!picked.length) return "No files selected."
    if (picked.length > 50 || picked.reduce((n, f) => n + f.size, 0) > limit)
      throw Error("Choose up to 50 files totalling at most 5 MiB.")
    const zip = new JSZip()
    let total = 0
    for (const f of picked) {
      if (!active.current) return ""
      const name = sanitizeGeneratedFileName(f.name)
      if (zip.file(name))
        throw Error("Two selected files have the same name. Rename one and try again.")
      const content = await files.readContent(f, { maximumBytes: limit - total })
      total += content.size
      if (total > limit) throw Error("Files exceed the 5 MiB limit.")
      zip.file(name, content.data, { base64: true })
    }
    const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" })
    if (bytes.length > limit) throw Error("The ZIP exceeds the 5 MiB save limit.")
    if (active.current)
      await files.saveAs({
        name: "files.zip",
        mimeType: "application/zip",
        encoding: "base64",
        data: bytesToBase64(bytes),
      })
    return "ZIP saved."
  }
  async function browse() {
    const picked = await files.pick({ accept: ["*/*"], maximumBytes: maxInput })
    if (!picked[0]) return "No archive selected."
    const bytes = base64ToBytes(
      (await files.readContent(picked[0], { maximumBytes: maxInput })).data,
    )
    if (!active.current) return ""
    const result = await read(bytes)
    setSource(bytes)
    setRows(result.entries ?? [])
    return (result.entries?.length ?? 0) + " files in the archive."
  }
  async function extract(entry: ArchiveEntry) {
    if (!source) return ""
    const result = await read(source, entry)
    if (!result.data || result.data.length !== entry.size)
      throw Error("Extracted length did not match the listed file.")
    if (active.current)
      await files.saveAs({
        name: sanitizeGeneratedFileName(entry.path.split("/").at(-1)!),
        mimeType: "application/octet-stream",
        encoding: "base64",
        data: bytesToBase64(result.data),
      })
    return "File saved."
  }
  return (
    <ToolPanel title="ZIP and RAR archives">
      <div className="grid gap-3">
        <Button disabled={busy} onClick={() => void run(createZip)}>
          Choose files and create ZIP
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => void run(browse)}>
          Open ZIP or RAR
        </Button>
        <p className="text-sm">Open archives up to 16 MiB. Save individual files up to 5 MiB.</p>
        <p role="status">{state}</p>
        <ul>
          {rows.map((r) => (
            <li className="grid gap-1 py-2" key={r.path}>
              <strong className="break-all">{r.path}</strong>
              <Button
                variant="secondary"
                disabled={busy || r.size > limit}
                onClick={() => void run(() => extract(r))}
              >
                Save file · {formatBytes(r.size)}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </ToolPanel>
  )
}
