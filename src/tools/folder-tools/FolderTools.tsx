import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { scopedFolders, isAndroidTester, type FolderEntry } from "@/platform/preview-services"
import { formatBytes } from "@/tools/image-compressor/image"

type PathItem = { key: string; name: string }
export function summarizeFolder(rows: readonly FolderEntry[]) {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (row.directory || row.size === null) continue
    const type = row.mime?.split("/")[0] || "Other"
    totals.set(type, (totals.get(type) ?? 0) + row.size)
  }
  return [...totals].sort((a, b) => b[1] - a[1])
}
function Workspace({ mode }: { mode: "manage" | "analyze" | "clean" }) {
  const [path, setPath] = useState<PathItem[]>([]),
    [rows, setRows] = useState<FolderEntry[]>([])
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [limited, setLimited] = useState(false)
  const [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false),
    [editing, setEditing] = useState(""),
    [name, setName] = useState("")
  const session = useRef(""),
    mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (session.current) void scopedFolders.close({ key: session.current }).catch(() => undefined)
    }
  }, [])
  async function load(next: PathItem[]) {
    const folder = next.at(-1)
    if (!folder) return
    const listing = await scopedFolders.list({ parent: folder.key })
    if (!mounted.current) return
    setPath(next)
    setRows(
      listing.entries.sort(
        (a, b) =>
          Number(b.directory) - Number(a.directory) ||
          (mode === "analyze" ? (b.size ?? 0) - (a.size ?? 0) : 0) ||
          a.name.localeCompare(b.name),
      ),
    )
    setLimited(listing.limited)
    setSelected([])
    setConfirm(false)
    setEditing("")
  }
  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setStatus("")
    try {
      await fn()
    } catch (e) {
      if (mounted.current)
        setStatus(
          typeof e === "object" && e !== null && "code" in e && e.code === "CANCELLED"
            ? "Folder selection cancelled."
            : "Operation could not finish. Refresh or reopen the folder.",
        )
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  async function choose() {
    const root = await scopedFolders.choose()
    if (!mounted.current) {
      await scopedFolders.close({ key: root.key })
      return
    }
    session.current = root.key
    setPath([root])
    setRows([])
    setSelected([])
    setConfirm(false)
    await load([root])
  }
  const chosen = rows.filter((r) => selected.includes(r.key))
  const sizeSummary =
    formatBytes(chosen.reduce((n, r) => n + (r.size ?? 0), 0)) +
    (chosen.some((r) => r.size === null) ? " plus files of unknown size" : "")
  return (
    <ToolPanel
      title={
        mode === "analyze"
          ? "Folder storage"
          : mode === "clean"
            ? "Review files to remove"
            : "Browse documents"
      }
    >
      {!isAndroidTester ? (
        <p>Use the Android test APK to select a folder with the system picker.</p>
      ) : (
        <div className="grid gap-3">
          <Button disabled={busy} onClick={() => void run(choose)}>
            Choose folder
          </Button>
          {path.length > 0 && (
            <>
              <p className="break-words font-semibold">{path.map((n) => n.name).join(" / ")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void run(() => load(path))}
                >
                  Refresh
                </Button>
                {path.length > 1 && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void run(() => load(path.slice(0, -1)))}
                  >
                    Up one folder
                  </Button>
                )}
              </div>
              {limited && (
                <p>Showing a limited listing. Choose a smaller folder for a complete inventory.</p>
              )}
              {mode === "analyze" && (
                <div>
                  <p>
                    Direct files in this folder, grouped by type. Open a subfolder to inspect its
                    contents.
                  </p>
                  <ul>
                    {summarizeFolder(rows).map(([type, bytes]) => (
                      <li key={type}>
                        {type} · {formatBytes(bytes)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {mode === "clean" && <p>Select individual files to review for permanent deletion.</p>}
              {rows.length === 0 && !busy && <p>No files to show.</p>}
              <ul className="grid gap-3">
                {rows.map((row) => (
                  <li key={row.key} className="grid gap-1 border-b border-[var(--border)] pb-2">
                    {row.directory ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void run(() => load([...path, row]))}
                      >
                        Open {row.name}
                      </Button>
                    ) : mode === "clean" ? (
                      <label className="flex min-h-12 items-center gap-2 break-all">
                        <input
                          type="checkbox"
                          disabled={!row.deletable || busy || confirm}
                          checked={selected.includes(row.key)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, row.key]
                                : selected.filter((k) => k !== row.key),
                            )
                          }
                        />
                        {row.name}
                      </label>
                    ) : mode === "manage" ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void run(() => scopedFolders.open({ key: row.key }))}
                      >
                        {row.name}
                      </Button>
                    ) : (
                      <strong className="break-all">{row.name}</strong>
                    )}
                    {!row.directory && (
                      <small>{row.size === null ? "Unknown size" : formatBytes(row.size)}</small>
                    )}
                    {mode === "manage" &&
                      row.renameable &&
                      (editing === row.key ? (
                        <>
                          <label>
                            New name
                            <input
                              className="app-input"
                              maxLength={120}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </label>
                          <Button
                            disabled={!name.trim() || busy}
                            onClick={() =>
                              void run(async () => {
                                await scopedFolders.rename({ key: row.key, name: name.trim() })
                                await load(path)
                                setStatus("Renamed.")
                              })
                            }
                          >
                            Save name
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setEditing(row.key)
                            setName(row.name)
                          }}
                        >
                          Rename {row.name}
                        </Button>
                      ))}
                  </li>
                ))}
              </ul>
              {mode === "clean" &&
                chosen.length > 0 &&
                (confirm ? (
                  <section className="grid gap-2">
                    <strong>
                      Permanently delete {chosen.length} files ({sizeSummary})?
                    </strong>
                    <ul>
                      {chosen.map((r) => (
                        <li className="break-all" key={r.key}>
                          {r.name}
                        </li>
                      ))}
                    </ul>
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          let removed = 0
                          for (const r of chosen) {
                            try {
                              await scopedFolders.remove({ key: r.key })
                              removed++
                            } catch {
                              break
                            }
                          }
                          setConfirm(false)
                          await load(path)
                          setStatus(
                            "Deleted " + removed + " of " + chosen.length + " selected files.",
                          )
                        })
                      }
                    >
                      Confirm permanent deletion
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
                      Cancel
                    </Button>
                  </section>
                ) : (
                  <Button disabled={busy} onClick={() => setConfirm(true)}>
                    Review {chosen.length} files · {sizeSummary}
                  </Button>
                ))}
            </>
          )}
          <p role="status">{busy ? "Working…" : status}</p>
        </div>
      )}
    </ToolPanel>
  )
}
export function FileManager() {
  return <Workspace mode="manage" />
}
export function StorageAnalysis() {
  return <Workspace mode="analyze" />
}
export function StorageCleaner() {
  return <Workspace mode="clean" />
}
