import { previewBuild } from "@/tools/preview-catalog"
import {
  CircleHelp,
  Database,
  ExternalLink,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react"
import { AtlasHeader } from "@/app/AtlasHeader"
import type { ThemePreference } from "@/app/useAppState"
import { Button } from "@/components/ui/Button"
import { ToolPanel } from "@/components/ui/ToolPanel"
import type { PlatformKind } from "@/platform/contracts"
import { usePlatform } from "@/platform/platform-context"
import { isEnabledTool, tools } from "@/tools/registry"

const enabledToolCount = tools.filter(isEnabledTool).length

interface SettingsScreenProps {
  platform: PlatformKind
  theme: ThemePreference
  onThemeChange: (value: ThemePreference) => void
  onClearPreferences: () => Promise<void>
}

export function SettingsScreen({
  platform,
  theme,
  onThemeChange,
  onClearPreferences,
}: SettingsScreenProps) {
  const { browser } = usePlatform()

  function openSupportSite() {
    void browser.open(new URL("https://yashsikdar.com"))
  }

  return (
    <>
      <AtlasHeader title="Settings" />
      <div className="screen-content atlas-settings">
        <div className="grid gap-4 md:grid-cols-2">
          <ToolPanel title="Appearance">
            <fieldset className="min-w-0">
              <legend className="sr-only">Color theme</legend>
              <div className="segmented-control three">
                {(
                  [
                    ["system", Smartphone, "System"],
                    ["light", Sun, "Light"],
                    ["dark", Moon, "Dark"],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <button
                    aria-pressed={theme === value}
                    className="segment"
                    key={value}
                    onClick={() => onThemeChange(value)}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={18} /> {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </ToolPanel>

          <ToolPanel title="Local data">
            <p className="mb-4 leading-7 text-[var(--text-secondary)]">
              This device can store your theme, favorites, recent-tool IDs, the scratchpad note,
              Pomodoro timer state, and cached exchange rates. Every other tool keeps its input in
              memory only unless you choose to save it.{" "}
              {previewBuild &&
                "The test build also stores your packing list and any parking spot you explicitly save."}
            </p>
            <div className="flex items-start gap-3">
              <Database
                aria-hidden="true"
                className="mt-1 shrink-0 text-[var(--primary)]"
                size={22}
              />
              <div className="min-w-0">
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  Clear local data from this installation. This removes favorites, recents, theme,
                  your saved scratchpad note, your saved Pomodoro timer state, and cached exchange
                  rates. {previewBuild && "It also clears the packing list and parking spot."} The
                  confirmation states exactly how many of each will be removed. The scratchpad note
                  is stored unencrypted and is not recoverable after clearing.
                </p>
                <Button className="mt-4" onClick={() => void onClearPreferences()} variant="danger">
                  Clear local preferences
                </Button>
              </div>
            </div>
          </ToolPanel>

          <ToolPanel title="Privacy foundation">
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-1 shrink-0 text-[var(--success-text)]"
                size={22}
              />
              <ul className="grid min-w-0 gap-2 text-sm leading-6 text-[var(--text-secondary)]">
                <li>No account, ads, analytics, or automatic crash uploads.</li>
                <li>
                  Currency Converter needs an internet connection to refresh exchange rates. Cached
                  rates can be used offline.
                </li>
                <li>
                  Currency Converter sends only the selected base currency code to Frankfurter
                  (api.frankfurter.dev). The amount is calculated on this device.
                </li>
                {previewBuild && (
                  <li>
                    The test APK requests camera, precise GPS or microphone access when you start
                    the corresponding feature. IP Lookup classifies addresses offline. Opening its
                    RIPEstat link sends the selected public address to RIPEstat in your browser.
                  </li>
                )}
                <li>Android backup exclusions are configured for app-private data.</li>
              </ul>
            </div>
          </ToolPanel>

          <ToolPanel title="Build information">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Version</dt>
              <dd className="font-mono">0.1.0</dd>
              <dt className="text-[var(--text-secondary)]">Platform</dt>
              <dd className="capitalize">{platform}</dd>
              <dt className="text-[var(--text-secondary)]">Manifest</dt>
              <dd>Foundation v1</dd>
              <dt className="text-[var(--text-secondary)]">Enabled tools</dt>
              <dd>{enabledToolCount}</dd>
            </dl>
          </ToolPanel>

          <ToolPanel title="Help and project status">
            <div className="flex items-start gap-3">
              <CircleHelp
                aria-hidden="true"
                className="mt-1 shrink-0 text-[var(--primary)]"
                size={22}
              />
              <div className="grid min-w-0 gap-3 text-sm leading-6 text-[var(--text-secondary)]">
                <p>
                  Implementation progress, known limitations, physical-device checks, and release
                  gates are maintained in the repository documentation.
                </p>
                <button
                  className="text-link gap-1 text-left"
                  onClick={openSupportSite}
                  type="button"
                >
                  Portfolio and support site <ExternalLink aria-hidden="true" size={15} />
                </button>
              </div>
            </div>
          </ToolPanel>
        </div>
      </div>
    </>
  )
}
