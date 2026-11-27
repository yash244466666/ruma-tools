import { useCallback, useEffect, useRef } from "react"

export function useSignalTone() {
  const context = useRef<AudioContext | null>(null)
  useEffect(
    () => () => {
      void context.current?.close().catch(() => undefined)
    },
    [],
  )
  const enable = useCallback(async () => {
    try {
      context.current ??= new AudioContext()
      await context.current.resume()
      return context.current.state === "running"
    } catch {
      return false
    }
  }, [])
  const signal = useCallback(() => {
    const audio = context.current
    if (audio?.state !== "running") return
    const tone = audio.createOscillator()
    const gain = audio.createGain()
    tone.frequency.value = 720
    gain.gain.setValueAtTime(0.12, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22)
    tone.connect(gain).connect(audio.destination)
    tone.onended = () => {
      tone.disconnect()
      gain.disconnect()
    }
    tone.start()
    tone.stop(audio.currentTime + 0.23)
  }, [])
  return { enable, signal }
}
