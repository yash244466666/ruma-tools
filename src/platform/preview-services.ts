import { Capacitor, registerPlugin } from "@capacitor/core"
export const isAndroidTester = Capacitor.getPlatform() === "android"
export const diagnostics = registerPlugin<{
  battery(): Promise<Record<string, string>>
  storage(): Promise<{ available: number; free: number; total: number }>
  device(): Promise<Record<string, string>>
}>("TesterDiagnostics")

export interface FolderEntry {
  key: string
  name: string
  mime: string
  size: number | null
  directory: boolean
  deletable: boolean
  renameable: boolean
}
export const scopedFolders = registerPlugin<{
  choose(): Promise<{ name: string; key: string }>
  list(input: { parent: string }): Promise<{ entries: FolderEntry[]; limited: boolean }>
  rename(input: { key: string; name: string }): Promise<void>
  remove(input: { key: string }): Promise<void>
  open(input: { key: string }): Promise<void>
  close(input: { key: string }): Promise<void>
}>("TesterFolders")
export interface GpsFix {
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  at: number
}
export const gps = registerPlugin<{
  access(): Promise<{ precise: boolean }>
  start(): Promise<{ key: string }>
  read(options: { key: string }): Promise<Partial<GpsFix>>
  stop(options: { key: string }): Promise<void>
}>("TesterGps")

export interface ArMeasurement {
  area: number
  length?: number
  width?: number
  height?: number
}
export const arMeasure = registerPlugin<{
  start(options: { shape: "rectangle" | "outline" }): Promise<{
    status: "measured" | "cancelled" | "unavailable" | "denied"
    result?: ArMeasurement
  }>
}>("ArMeasure")
