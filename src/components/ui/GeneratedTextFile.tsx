import { useState } from "react"
import { Download } from "lucide-react"
import { ResultReveal } from "@/components/motion/primitives"
import { Button } from "@/components/ui/Button"
import { CopyButton } from "@/components/ui/CopyButton"
import { ToolPanel } from "@/components/ui/ToolPanel"
import { toSafeErrorMessage } from "@/platform/errors"
import { usePlatform } from "@/platform/platform-context"

interface GeneratedTextFileProps {
  name: string
  mimeType: string
  content: string
  copyLabel: string
}

export function GeneratedTextFile({ name, mimeType, content, copyLabel }: GeneratedTextFileProps) {
  const { files, kind } = usePlatform()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState("")
  const extension = name.slice(name.lastIndexOf("."))

  async function save() {
    if (saving) return
    setSaving(true)
    setStatus("")
    try {
      await files.saveAs({ name, mimeType, data: content, encoding: "utf8" })
      setStatus(kind === "android" ? "File saved." : "Download started.")
    } catch (error) {
      setStatus(toSafeErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ToolPanel title={name}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button disabled={saving} onClick={() => void save()}>
          <Download aria-hidden="true" size={18} />
          {saving ? "Saving…" : `Save ${extension} file`}
        </Button>
        <CopyButton label={copyLabel} onStatus={setStatus} value={content} />
      </div>
      <p className="text-sm text-[var(--text-secondary)]" role="status">
        {status}
      </p>
      <ResultReveal token={content}>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl bg-[var(--surface-muted)] p-3 font-mono text-xs leading-5">
          {content}
        </pre>
      </ResultReveal>
    </ToolPanel>
  )
}
