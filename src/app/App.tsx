import { useCallback, useEffect, useState } from "react"
import { AppNavigation } from "@/app/AppNavigation"
import { CatalogScreen } from "@/app/CatalogScreen"
import { parseHash, routeHref } from "@/app/routing"
import { SettingsScreen } from "@/app/SettingsScreen"
import { ToolScreen } from "@/app/ToolScreen"
import { useNetworkState, useStoredStringArray, useThemePreference } from "@/app/useAppState"
import { usePlatform } from "@/platform/platform-context"
import { bookmarksStorageKey } from "@/tools/bookmark-manager/bookmarks"
import { currencyStorageKey } from "@/tools/currency-converter/currency"
import { notesStorageKey } from "@/tools/notes-scratchpad/notes"
import { pomodoroStorageKey } from "@/tools/pomodoro-timer/pomodoro"

const maximumRecentTools = 12

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function joinHumanly(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function catalogReturnHref(hash: unknown): string {
  if (typeof hash !== "string" || !hash.startsWith("#/")) return "#/"
  const route = parseHash(hash)
  return route.screen === "catalog" || route.screen === "favorites" || route.screen === "recent"
    ? routeHref(route)
    : "#/"
}

function historyParent(): unknown {
  const state: unknown = window.history.state
  return state && typeof state === "object" && "atlasParent" in state
    ? state.atlasParent
    : undefined
}

export function App() {
  const platform = usePlatform()
  const [route, setRoute] = useState(() => parseHash())
  const [toolBackHref, setToolBackHref] = useState(() => catalogReturnHref(historyParent()))
  // Search text belongs to a list in this session and survives a trip into a tool.
  const [queries, setQueries] = useState<Record<string, string>>({})
  const listHref = routeHref(route)
  const searchProps = {
    query: queries[listHref] ?? "",
    onQueryChange: (query: string) =>
      setQueries((previous) => ({ ...previous, [listHref]: query })),
  }
  const [favorites, setFavorites] = useStoredStringArray("favorites")
  const [recents, setRecents, recentsLoaded] = useStoredStringArray("recents")
  const [theme, setTheme] = useThemePreference()
  const network = useNetworkState()
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    const updateRoute = (event: HashChangeEvent) => {
      const next = parseHash()
      if (next.screen === "tool") {
        const parent = catalogReturnHref(
          historyParent() ?? (event.oldURL ? new URL(event.oldURL).hash : ""),
        )
        window.history.replaceState({ ...window.history.state, atlasParent: parent }, "")
        setToolBackHref(parent)
      }
      setRoute(next)
    }
    window.addEventListener("hashchange", updateRoute)
    return () => window.removeEventListener("hashchange", updateRoute)
  }, [])

  const toggleFavorite = useCallback(
    (toolId: string) => {
      setFavorites((current) => {
        const exists = current.includes(toolId)
        setAnnouncement(exists ? "Removed from favorites." : "Added to favorites.")
        return exists ? current.filter((id) => id !== toolId) : [...current, toolId]
      })
    },
    [setFavorites],
  )

  const recordRecent = useCallback(
    (toolId: string) => {
      if (!recentsLoaded) return
      setRecents((current) =>
        [toolId, ...current.filter((id) => id !== toolId)].slice(0, maximumRecentTools),
      )
    },
    [recentsLoaded, setRecents],
  )

  const clearRecents = useCallback(() => {
    setRecents([])
    setAnnouncement("Recent tool history cleared.")
  }, [setRecents])

  async function clearPreferences() {
    const [note, timerState, cachedRates, storedBookmarks, packing, parking] = await Promise.all([
      platform.preferences.get(notesStorageKey),
      platform.preferences.get(pomodoroStorageKey),
      platform.preferences.get(currencyStorageKey),
      platform.preferences.get<{ bookmarks?: unknown }>(bookmarksStorageKey),
      platform.preferences.get<unknown>("packing-items-v1"),
      platform.preferences.get<unknown>("parking-spot-v1"),
    ])
    const removedClasses = [
      pluralize(favorites.length, "favorite", "favorites"),
      pluralize(recents.length, "recent tool", "recent tools"),
      "your theme preference",
    ]
    if (Array.isArray(packing) && packing.length)
      removedClasses.push(pluralize(packing.length, "packing item", "packing items"))
    if (parking) removedClasses.push("your saved parking spot")
    if (note) removedClasses.push("your saved scratchpad note")
    if (storedBookmarks) {
      const bookmarkCount = Array.isArray(storedBookmarks.bookmarks)
        ? storedBookmarks.bookmarks.length
        : 0
      removedClasses.push(pluralize(bookmarkCount, "saved bookmark", "saved bookmarks"))
    }
    if (timerState) removedClasses.push("your saved Pomodoro timer state")
    if (cachedRates) removedClasses.push("cached exchange rates")

    const confirmed = window.confirm(
      `Clear local data from this installation? This removes ${joinHumanly(removedClasses)}. This cannot be undone.`,
    )
    if (!confirmed) return
    await platform.preferences.clear()
    setFavorites([])
    setRecents([])
    setTheme("system")
    setAnnouncement("Local preferences cleared.")
  }

  return (
    <div className="app-frame">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById("main-content")?.focus()
        }}
      >
        Skip to content
      </a>
      <AppNavigation favoriteCount={favorites.length} route={route} />
      <main
        tabIndex={-1}
        id="main-content"
        data-back-href={route.screen === "tool" ? toolBackHref : "#/"}
      >
        {route.screen === "catalog" ? (
          <CatalogScreen
            key={listHref}
            groupId={route.groupId}
            {...searchProps}
            favorites={favorites}
            network={network}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
        {route.screen === "favorites" ? (
          <CatalogScreen
            {...searchProps}
            favorites={favorites}
            mode="favorites"
            network={network}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
        {route.screen === "recent" ? (
          <CatalogScreen
            {...searchProps}
            favorites={favorites}
            mode="recent"
            network={network}
            onClearRecents={clearRecents}
            onToggleFavorite={toggleFavorite}
            recents={recents}
          />
        ) : null}
        {route.screen === "settings" ? (
          <SettingsScreen
            onClearPreferences={clearPreferences}
            onThemeChange={setTheme}
            platform={platform.kind}
            theme={theme}
          />
        ) : null}
        {route.screen === "tool" ? (
          <ToolScreen
            onOpened={recordRecent}
            toolId={route.toolId}
            backHref={toolBackHref}
            favorite={favorites.includes(route.toolId)}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
      </main>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
