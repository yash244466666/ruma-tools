import { ChevronRight, CloudOff, Heart, History, Search, Trash2, Wifi, X } from "lucide-react"
import { useRef } from "react"
import { AtlasHeader } from "@/app/AtlasHeader"
import { routeHref } from "@/app/routing"
import { Button } from "@/components/ui/Button"
import type { NetworkState } from "@/platform/contracts"
import { atlasGroups, getAtlasGroup } from "@/tools/atlas"
import { getTool, isEnabledTool, tools } from "@/tools/registry"
import type { ToolDefinition } from "@/tools/types"

interface CatalogScreenProps {
  favorites: string[]
  mode?: "catalog" | "favorites" | "recent"
  groupId?: string
  query: string
  onQueryChange: (query: string) => void
  network: NetworkState
  recents?: string[]
  onClearRecents?: () => void
  onToggleFavorite: (toolId: string) => void
}

const enabledTools = tools.filter(isEnabledTool)
const atlasLabels = new Map(
  atlasGroups.flatMap((group) => group.toolIds.map((id) => [id, group.label] as const)),
)
const catalogHref = routeHref({ screen: "catalog" })
const allToolsHref = routeHref({ screen: "catalog", groupId: "all" })

function enabledById(ids: readonly string[]) {
  return ids
    .map(getTool)
    .filter((tool): tool is ToolDefinition => Boolean(tool && isEnabledTool(tool)))
}

function ToolRow({
  tool,
  favorite,
  onToggleFavorite,
}: {
  tool: ToolDefinition
  favorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  const Icon = tool.icon
  const StatusIcon = tool.network ? Wifi : CloudOff
  return (
    <li className="tool-card">
      <span className="tool-icon">
        <Icon aria-hidden="true" size={20} />
      </span>
      <div className="min-w-0">
        <a className="card-link" href={routeHref({ screen: "tool", toolId: tool.id })}>
          {tool.label}
        </a>
        <span className="atlas-tool-status">
          <StatusIcon aria-hidden="true" size={14} />{" "}
          {tool.network ? "Network · Frankfurter" : "Works offline"}
          {tool.status === "experimental" && " · Preview"}
        </span>
      </div>
      <button
        aria-label={
          favorite ? `Remove ${tool.label} from favorites` : `Add ${tool.label} to favorites`
        }
        aria-pressed={favorite}
        className="icon-button"
        onClick={() => onToggleFavorite(tool.id)}
        type="button"
      >
        <Heart aria-hidden="true" fill={favorite ? "currentColor" : "none"} size={19} />
      </button>
    </li>
  )
}

function CategoryTiles() {
  return (
    <>
      <div className="atlas-section-line">
        <h2>Explore by category</h2>
        <a
          className="atlas-directory-link"
          href={allToolsHref}
          aria-label={`Browse all ${enabledTools.length} tools`}
        >
          {enabledTools.length} tools <ChevronRight size={15} aria-hidden="true" />
        </a>
      </div>
      <div className="atlas-grid">
        {atlasGroups.map(({ id, label, icon: Icon, toolIds }) => {
          const count = enabledById(toolIds).length
          const countLabel = `${count} ${count === 1 ? "tool" : "tools"}`
          return (
            <a
              className="atlas-tile"
              key={id}
              href={routeHref({ screen: "catalog", groupId: id })}
              aria-label={`${label}, ${countLabel}`}
            >
              <span className="atlas-tile-meta">
                <Icon size={23} aria-hidden="true" />
                <span>{countLabel}</span>
              </span>
              <strong>{label}</strong>
            </a>
          )
        })}
      </div>
    </>
  )
}

export function CatalogScreen({
  favorites,
  mode = "catalog",
  groupId,
  query,
  onQueryChange,
  network,
  recents = [],
  onClearRecents,
  onToggleFavorite,
}: CatalogScreenProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const group = getAtlasGroup(groupId)
  const isCatalog = mode === "catalog"
  const isFavorites = mode === "favorites"
  const normalized = query.trim().toLocaleLowerCase()
  const atlasHome = isCatalog && !groupId
  const showTiles = atlasHome && !normalized
  const title = isFavorites
    ? "Favorite tools"
    : mode === "recent"
      ? "Recent tools"
      : (group?.label ?? (groupId === "all" ? "All tools" : "Tool atlas"))
  const collection = isFavorites
    ? enabledTools.filter((tool) => favorites.includes(tool.id))
    : mode === "recent"
      ? enabledById(recents)
      : enabledTools
  const visibleTools = normalized
    ? collection.filter((tool) =>
        [tool.label, tool.description, atlasLabels.get(tool.id), tool.category, ...tool.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized),
      )
    : group
      ? enabledById(group.toolIds)
      : collection
  const emptyCollection = !isCatalog && collection.length === 0
  const EmptyIcon = emptyCollection ? (isFavorites ? Heart : History) : Search
  const listHeading = normalized
    ? "Search results"
    : isCatalog
      ? "Tools"
      : isFavorites
        ? "Saved on this device"
        : "Recently opened"
  const toolNoun = visibleTools.length === 1 ? "tool" : "tools"
  const count = `${visibleTools.length} ${toolNoun}`
  const countLabel = isFavorites
    ? `${visibleTools.length} favorite ${toolNoun} saved`
    : `${visibleTools.length} recent ${toolNoun} on this device`

  function clearQuery() {
    onQueryChange("")
    searchRef.current?.focus()
  }

  return (
    <>
      <AtlasHeader
        title={title}
        backHref={isCatalog && groupId ? catalogHref : undefined}
        backLabel="Categories"
      />
      <div className="screen-content">
        {!network.connected && (
          <div className="offline-banner" role="status">
            <CloudOff aria-hidden="true" size={18} /> You are offline. Local tools remain available.
          </div>
        )}
        <div className="sticky-controls">
          <div className="search-field">
            <Search aria-hidden="true" size={20} />
            <div className="atlas-search-input">
              <input
                id="tool-search"
                placeholder=" "
                ref={searchRef}
                autoCapitalize="none"
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && query) {
                    event.preventDefault()
                    clearQuery()
                  }
                }}
              />
              <label htmlFor="tool-search">Search tools</label>
            </div>
            {query && (
              <button
                aria-label="Clear search"
                className="icon-button search-clear"
                onClick={clearQuery}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            )}
          </div>
        </div>
        {showTiles ? (
          <CategoryTiles />
        ) : (
          <>
            <div className="atlas-section-line">
              <h2>{listHeading}</h2>
              <span
                aria-live="polite"
                className="atlas-count"
                aria-label={!isCatalog && !normalized ? countLabel : undefined}
              >
                {count}
              </span>
            </div>
            {visibleTools.length ? (
              <ul className="atlas-tool-list">
                {visibleTools.map((tool) => (
                  <ToolRow
                    favorite={favorites.includes(tool.id)}
                    key={tool.id}
                    tool={tool}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </ul>
            ) : (
              <section className="empty-state">
                <EmptyIcon aria-hidden="true" size={28} />
                <h3 className="font-bold">
                  {emptyCollection
                    ? isFavorites
                      ? "No favorites yet"
                      : "No recent tools yet"
                    : "No matching tools"}
                </h3>
                <p>
                  {emptyCollection
                    ? isFavorites
                      ? "Tap the heart beside a tool to save it here."
                      : "Open a tool to see it here."
                    : "Try a different tool name or keyword."}
                </p>
                {emptyCollection ? (
                  <a className="text-link" href={allToolsHref}>
                    Browse all tools
                  </a>
                ) : (
                  <button className="text-link" onClick={clearQuery} type="button">
                    Clear search and browse
                  </button>
                )}
              </section>
            )}
            {mode === "recent" && collection.length > 0 && onClearRecents && (
              <Button className="mt-4" onClick={onClearRecents} variant="quiet">
                <Trash2 aria-hidden="true" size={18} /> Clear recent history
              </Button>
            )}
          </>
        )}
      </div>
    </>
  )
}
