import { previewTools } from "./preview-catalog"
import {
  Calculator,
  Clock3,
  Compass,
  Files,
  Share2,
  ShieldCheck,
  Type,
  type LucideIcon,
} from "lucide-react"

interface AtlasGroup {
  id: string
  label: string
  icon: LucideIcon
  toolIds: readonly string[]
}

// Display order follows the seven groups in the approved release scope (ADR 0026).
export const atlasGroups: readonly AtlasGroup[] = [
  {
    id: "money-math",
    label: "Money & math",
    icon: Calculator,
    toolIds: [
      "unit-converter",
      "currency-converter",
      "percentage-calculator",
      "tip-calculator",
      "discount-tax-calculator",
      "unit-price-comparer",
      "loan-emi-calculator",
      "fuel-trip-cost-calculator",
      "bmi-calculator",
      "calculator",
      "recipe-scaler",
    ],
  },
  {
    id: "time",
    label: "Time",
    icon: Clock3,
    toolIds: [
      "stopwatch",
      "countdown-timer",
      "pomodoro-timer",
      "time-zone-converter",
      "date-difference-calculator",
      "age-calculator",
      "date-calculator",
    ],
  },
  {
    id: "text-color",
    label: "Text & color",
    icon: Type,
    toolIds: [
      "notes-scratchpad",
      "character-counter",
      "word-counter",
      "case-converter",
      "color-picker",
    ],
  },
  {
    id: "files-media",
    label: "Files & media",
    icon: Files,
    toolIds: ["qr-generator", "image-compressor", "pdf-converter", "audio-recorder"],
  },
  {
    id: "passwords",
    label: "Passwords",
    icon: ShieldCheck,
    toolIds: ["password-generator", "password-strength-checker"],
  },
  {
    id: "sharing-utility",
    label: "Sharing & utility",
    icon: Share2,
    toolIds: ["vcard-generator", "ical-generator", "dice-roller", "random-picker"],
  },
  {
    id: "sensors",
    label: "Sensors",
    icon: Compass,
    toolIds: ["level", "compass", "barometer", "light-meter", "vibration-meter"],
  },
].map((group) => ({
  ...group,
  toolIds: [...group.toolIds, ...previewTools.filter((t) => t.group === group.id).map((t) => t.id)],
}))

export function getAtlasGroup(id?: string) {
  return atlasGroups.find((group) => group.id === id)
}
