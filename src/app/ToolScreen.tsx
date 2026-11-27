import { CircleSlash, CloudOff, Construction, Heart, Home, Wifi } from "lucide-react"
import { Suspense, useEffect } from "react"
import { AtlasHeader } from "@/app/AtlasHeader"
import { routeHref } from "@/app/routing"
import { getTool, isEnabledTool } from "@/tools/registry"

interface ToolScreenProps {
  toolId: string
  onOpened: (id: string) => void
  backHref: string
  favorite: boolean
  onToggleFavorite: (id: string) => void
}

export function ToolScreen({
  toolId,
  onOpened,
  backHref,
  favorite,
  onToggleFavorite,
}: ToolScreenProps) {
  const tool = getTool(toolId)

  useEffect(() => {
    if (tool && isEnabledTool(tool)) onOpened(tool.id)
  }, [onOpened, tool])

  if (!tool || !isEnabledTool(tool) || !tool.component) {
    const removed = tool?.status === "removed"
    const Icon = !tool ? Home : removed ? CircleSlash : Construction
    return (
      <>
        <AtlasHeader title={tool?.label ?? "Tool not found"} backHref={backHref} />
        <div className="screen-content">
          <section className="empty-state">
            <Icon aria-hidden="true" size={30} />
            <p>
              {!tool
                ? "This link does not match a tool in the current release manifest."
                : removed
                  ? "This tool is not part of the released tool set, so it is not available in this build."
                  : "This tool is part of the vertical-slice backlog and is not enabled in this build yet."}
            </p>
            <a className="text-link" href={routeHref({ screen: "catalog" })}>
              {tool ? "Browse ready tools" : "Return to tools"}
            </a>
          </section>
        </div>
      </>
    )
  }

  const ToolComponent = tool.component
  const StatusIcon = tool.network ? Wifi : CloudOff
  return (
    <div className="tool-screen">
      <AtlasHeader
        title={tool.label}
        backHref={backHref}
        action={
          <button
            className="icon-button atlas-header-heart"
            type="button"
            aria-label={
              favorite ? `Remove ${tool.label} from favorites` : `Add ${tool.label} to favorites`
            }
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(tool.id)}
          >
            <Heart aria-hidden="true" size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
        }
      >
        <p className="atlas-tool-meta">
          <StatusIcon aria-hidden="true" size={15} />{" "}
          {tool.network ? "Network · Frankfurter" : "Works offline"}{" "}
          <span>· {tool.status === "experimental" ? "Tester preview" : tool.risk + " risk"}</span>
        </p>
      </AtlasHeader>
      <div className="screen-content atlas-tool-content">
        <Suspense
          fallback={
            <div className="loading-panel" role="status">
              Loading tool…
            </div>
          }
        >
          <div className="tool-enter" key={tool.id}>
            <ToolComponent />
          </div>
        </Suspense>
        <p className="atlas-tool-description">{tool.description}</p>
      </div>
    </div>
  )
}
