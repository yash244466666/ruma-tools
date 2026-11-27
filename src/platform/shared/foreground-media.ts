import type { LifecycleService } from "@/platform/contracts"
/** Stop capture on deactivation, navigation or cancellation while permission is pending. */
export async function foregroundMedia(
  constraints: MediaStreamConstraints,
  lifecycle: LifecycleService,
  signal: AbortSignal,
  onStop: () => void,
) {
  if (!navigator.mediaDevices?.getUserMedia) throw Error("Media capture unavailable.")
  if (signal.aborted || !lifecycle.current().active) throw Error("Open the tool to start capture.")
  let stream: MediaStream | undefined
  let stopped = false
  let unsubscribe: (() => void | Promise<void>) | undefined
  function stop() {
    if (stopped) return
    stopped = true
    signal.removeEventListener("abort", stop)
    stream?.getTracks().forEach((t) => t.stop())
    void unsubscribe?.()
    onStop()
  }
  signal.addEventListener("abort", stop, { once: true })
  try {
    unsubscribe = await lifecycle.subscribe((s) => {
      if (!s.active) stop()
    })
    if (stopped) {
      void unsubscribe()
      throw Error("Capture stopped.")
    }
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    if (stopped) {
      stream.getTracks().forEach((t) => t.stop())
      throw Error("Capture stopped.")
    }
    stream.getTracks().forEach((t) => t.addEventListener("ended", stop, { once: true }))
    return stream
  } catch (e) {
    stop()
    throw e
  }
}
