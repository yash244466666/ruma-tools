import { ArrowLeft, Wrench } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"

interface AtlasHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  action?: ReactNode
  children?: ReactNode
}

export function AtlasHeader({
  title,
  backHref,
  backLabel = "Back",
  action,
  children,
}: AtlasHeaderProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [title])

  return (
    <header className="atlas-header">
      <div className="atlas-header-inner">
        <div className="atlas-topline">
          {backHref ? (
            <a className="back-link" data-atlas-back href={backHref}>
              <ArrowLeft aria-hidden="true" size={20} /> {backLabel}
            </a>
          ) : (
            <span className="atlas-masthead">
              <Wrench aria-hidden="true" size={21} /> Ruma Tools
            </span>
          )}
          {action}
        </div>
        <h1 className="screen-title" ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {children}
      </div>
    </header>
  )
}
