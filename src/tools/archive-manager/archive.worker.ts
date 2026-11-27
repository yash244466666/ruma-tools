import { maximumBridgeGeneratedFileBytes as limit } from "@/platform/shared/files"
export interface ArchiveEntry {
  path: string
  size: number
}
export interface ArchiveReply {
  entries?: ArchiveEntry[]
  data?: Uint8Array
  error?: string
}
interface Request {
  bytes: Uint8Array
  entry?: ArchiveEntry
}
interface Core {
  FS: {
    init(input: () => null, output: (byte: number) => void, error: (byte: number) => void): void
    writeFile(name: string, data: Uint8Array): void
  }
  callMain(args: string[]): number
}
interface CoreModule {
  default: (options: {
    wasmBinary: Uint8Array
    noFSInit: boolean
    print: () => void
    printErr: () => void
  }) => Promise<Core>
}
const safePath = (name: string) =>
  name.length > 0 &&
  name.length <= 1024 &&
  !name.startsWith("/") &&
  !/^[a-z]:/i.test(name) &&
  !name.includes("\\") &&
  !name.split("/").some((p) => p === "" || p === "." || p === "..")

function listEntries(text: string): ArchiveEntry[] {
  const lines = text.trimEnd().split("\n").filter(Boolean)
  if (lines.length > 200) throw Error("Choose an archive with at most 200 entries.")
  const seen = new Set<string>()
  const entries: ArchiveEntry[] = []
  for (const line of lines) {
    // bsdtar's verbose C-locale listing includes mode, link count, numeric owner/group, size and date.
    if (!line.startsWith("-")) continue
    const match = /^\S+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+\S+\s+\d+\s+\S+ (.+)$/.exec(line)
    if (!match || !safePath(match[2]!) || seen.has(match[2]!))
      throw Error("Archive contains unsupported or ambiguous names.")
    seen.add(match[2]!)
    entries.push({ path: match[2]!, size: Number(match[1]) })
  }
  return entries
}
self.onmessage = async ({ data }: { data: Request }) => {
  const { bytes, entry } = data
  try {
    const zip = bytes[0] === 0x50 && bytes[1] === 0x4b
    const rar = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07].every((v, i) => bytes[i] === v)
    if (!zip && !rar) throw Error("Select a ZIP or RAR archive.")
    if (
      entry &&
      (!safePath(entry.path) ||
        !Number.isSafeInteger(entry.size) ||
        entry.size < 0 ||
        entry.size > limit)
    )
      throw Error("This file exceeds the save limit.")
    const base = new URL(import.meta.env.BASE_URL + "archive-codec/", self.location.origin)
    const url = new URL("core.mjs", base).href
    const [module, binary] = await Promise.all([
      import(/* @vite-ignore */ url) as Promise<CoreModule>,
      fetch(new URL("core.wasm", base)).then((r) => r.arrayBuffer()),
    ])
    const core = await module.default({
      wasmBinary: new Uint8Array(binary),
      noFSInit: true,
      print: () => {},
      printErr: () => {},
    })
    const out = new Uint8Array(entry ? entry.size : 256 * 1024)
    let count = 0,
      over = false
    core.FS.init(
      () => null,
      (byte) => {
        if (count >= out.length) {
          over = true
          throw Error("Output limit reached.")
        }
        out[count++] = byte
      },
      () => {},
    )
    core.FS.writeFile("/input", bytes)
    const args = entry
      ? ["-xOf", "/input", "--no-recursion", "--", entry.path.replace(/[[*?]/g, "\\$&")]
      : ["--numeric-owner", "-tvf", "/input"]
    let code: number
    try {
      code = core.callMain(args)
    } catch (e) {
      if (e && typeof e === "object" && "status" in e && typeof e.status === "number")
        code = e.status
      else throw e
    }
    if (code !== 0 || over || (entry && count !== entry.size)) throw Error("Unreadable archive.")
    if (entry) self.postMessage({ data: out } satisfies ArchiveReply)
    else
      self.postMessage({
        entries: listEntries(new TextDecoder().decode(out.subarray(0, count))),
      } satisfies ArchiveReply)
  } catch (e) {
    const safe = [
      "Select a ZIP or RAR archive.",
      "Choose an archive with at most 200 entries.",
      "This file exceeds the save limit.",
      "Archive contains unsupported or ambiguous names.",
    ]
    self.postMessage({
      error:
        e instanceof Error && safe.includes(e.message)
          ? e.message
          : "Could not open this archive. Choose a complete, unencrypted ZIP or RAR file.",
    } satisfies ArchiveReply)
  }
}
