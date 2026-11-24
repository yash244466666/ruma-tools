import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "dev.ruma.tools",
  appName: "Ruma Tools",
  webDir: "dist",
  server: {
    androidScheme: "https",
    hostname: "app.ruma.tools",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0d1117",
    loggingBehavior: "none",
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 350,
      backgroundColor: "#0d1117",
      showSpinner: false,
    },
    Keyboard: {
      resize: "native",
    },
  },
}

export default config
