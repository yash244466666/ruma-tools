import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { MeasurementPhoto } from "@/tools/photo-studio/PhotoStudio"
import { distance, measure, type Point, type Shape } from "./geometry"
import Results from "./Results"

function Editor({ image }: { image: HTMLCanvasElement }) {
  const [shape, setShape] = useState<Shape>("rectangle"),
    [marks, setMarks] = useState<Point[]>([])
  const [reference, setReference] = useState("10"),
    [closed, setClosed] = useState(false)
  const [cursor, setCursor] = useState({ x: 50, y: 50 }),
    [message, setMessage] = useState("")
  const view = useRef<HTMLCanvasElement>(null)
  const base = marks.slice(2),
    refPixels = marks.length >= 2 ? distance(marks[0]!, marks[1]!) : 0
  const scale = Number(reference) / refPixels
  const result = closed ? measure(base, scale, shape) : null
  const prompt =
    marks.length === 0
      ? "Mark the first ruler tick."
      : marks.length === 1
        ? "Mark the second ruler tick."
        : closed
          ? "Outline complete."
          : shape === "rectangle"
            ? [
                "Mark the first corner.",
                "Mark the end of the length.",
                "Mark the next corner along the width.",
                "Mark the last corner.",
              ][base.length]
            : "Mark corners around the outline in order."
  function add(p: Point) {
    if (closed) return
    if (marks.length === 1 && distance(marks[0]!, p) < 4) {
      setMessage("Choose ruler ticks farther apart.")
      return
    }
    if (marks.length >= 2 && !(Number(reference) > 0 && Number.isFinite(scale))) {
      setMessage("Enter a positive distance between ruler ticks.")
      return
    }
    const next = [...marks, p]
    if (shape === "rectangle" && next.length === 6) {
      if (!measure(next.slice(2), scale, shape)) {
        setMessage("Mark corners around the edge without crossing lines.")
        return
      }
      setClosed(true)
    }
    if (next.length > 34) {
      setMessage("Close the outline after up to 32 corners.")
      return
    }
    setMarks(next)
    setMessage("")
  }
  useEffect(() => {
    const canvas = view.current,
      ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)
    const unit = Math.max(1, image.width / 430)
    ctx.lineWidth = 3 * unit
    ctx.shadowColor = "black"
    ctx.shadowBlur = 2 * unit
    for (const [i, p] of marks.entries()) {
      ctx.strokeStyle = ctx.fillStyle = i < 2 ? "#ffce58" : "#79f6f0"
      if (i === 1 || i >= 3) {
        const last = marks[i - 1]!
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4 * unit, 0, Math.PI * 2)
      ctx.fill()
    }
    if (closed) {
      const last = marks.at(-1)!,
        first = marks[2]!
      ctx.beginPath()
      ctx.moveTo(last.x, last.y)
      ctx.lineTo(first.x, first.y)
      ctx.stroke()
    }
  }, [image, marks, closed])
  return (
    <div className="grid gap-3">
      <label>
        Base shape
        <select
          className="app-input"
          value={shape}
          onChange={(e) => {
            setShape(e.target.value as Shape)
            setMarks(marks.slice(0, 2))
            setClosed(false)
            setMessage("")
          }}
        >
          <option value="rectangle">Rectangle</option>
          <option value="outline">Custom outline</option>
        </select>
      </label>
      <label>
        Distance between ruler ticks (cm)
        <input
          className="app-input"
          type="number"
          min="0"
          step="any"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </label>
      <p aria-live="polite">{prompt}</p>
      <canvas
        ref={view}
        aria-label="Mark points on the photo"
        className="max-w-full h-auto justify-self-start rounded-lg"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          add({
            x: ((e.clientX - r.left) * image.width) / r.width,
            y: ((e.clientY - r.top) * image.height) / r.height,
          })
        }}
      />
      {!closed && (
        <details>
          <summary className="min-h-12 cursor-pointer">Position a point with controls</summary>
          {(["x", "y"] as const).map((axis) => (
            <label key={axis}>
              {axis === "x" ? "Horizontal" : "Vertical"} position (%)
              <input
                className="app-input"
                type="number"
                min="0"
                max="100"
                step=".1"
                value={cursor[axis]}
                onChange={(e) =>
                  setCursor({
                    ...cursor,
                    [axis]: Math.min(100, Math.max(0, Number(e.target.value))),
                  })
                }
              />
            </label>
          ))}
          <Button
            onClick={() =>
              add({ x: (cursor.x * image.width) / 100, y: (cursor.y * image.height) / 100 })
            }
          >
            Mark point
          </Button>
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        {shape === "outline" && !closed && base.length >= 3 && (
          <Button
            onClick={() => {
              if (measure(base, scale, shape)) {
                setClosed(true)
                setMessage("")
              } else
                setMessage(
                  "Use a positive reference and mark a simple outline without crossing lines.",
                )
            }}
          >
            Close outline
          </Button>
        )}
        {marks.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              if (!closed || shape === "rectangle") setMarks(marks.slice(0, -1))
              setClosed(false)
              setMessage("")
            }}
          >
            Undo
          </Button>
        )}
        {marks.length > 0 && (
          <Button
            variant="quiet"
            onClick={() => {
              setMarks([])
              setClosed(false)
              setMessage("")
            }}
          >
            Start over
          </Button>
        )}
      </div>
      {message && <p role="alert">{message}</p>}
      {closed && !result && <p role="alert">Enter a positive ruler distance to see the result.</p>}
      {result && <Results value={result} />}
    </div>
  )
}
export default function PhotoMeasure() {
  return (
    <div className="grid gap-3">
      <p>
        Place a ruler beside the object on the same flat surface. Take a photo from directly above,
        or choose one taken straight on.
      </p>
      <MeasurementPhoto render={(image) => <Editor image={image} />} />
    </div>
  )
}
