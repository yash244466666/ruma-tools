import type { PropsWithChildren, ReactNode } from "react"

interface ToolPanelProps extends PropsWithChildren {
  title?: string
  action?: ReactNode
  muted?: boolean
}

export function ToolPanel({ title, action, children, muted = false }: ToolPanelProps) {
  return (
    <section
      className={`min-w-0 rounded-xl border p-4 sm:p-5 ${muted ? "border-[var(--border)] bg-[var(--surface-muted)]" : "border-[var(--border)] bg-[var(--surface-raised)]"}`}
    >
      {title || action ? (
        <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
          {title ? <h2 className="text-base font-bold text-[var(--text)]">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
