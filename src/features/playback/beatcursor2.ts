/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"

interface TimelineEntry {
  time: number
  notes: number[]
  measureIndex: number
  graphicalNotes: any[]
}

class PracticeCursor {
  private osmd: any
  private timeline: TimelineEntry[]
  private index = 0
  private cursorElement: SVGRectElement | null = null

  constructor(osmd: any) {
    this.osmd = osmd
    this.timeline = buildTimeline(osmd)

    this.createCursor()
    this.moveCursor()
  }

  private createCursor() {
    const svg = this.osmd.drawer.backend.getSvgElement()

    this.cursorElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    )

    this.cursorElement.setAttribute("fill", "rgba(255,0,0,0.15)")
    this.cursorElement.setAttribute("stroke", "red")
    this.cursorElement.setAttribute("width", "25")

    svg.appendChild(this.cursorElement)
  }

  private moveCursor() {
    const entry = this.timeline[this.index]
    if (!entry) return

    const gn = entry.graphicalNotes[0]
    if (!gn) return

    const pos = gn.PositionAndShape.AbsolutePosition
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const svg = this.osmd.drawer.backend.getSvgElement()

    const x = pos.x
    const y = pos.y

    this.cursorElement?.setAttribute("x", (x - 12).toString())
    this.cursorElement?.setAttribute("y", (y - 40).toString())
    this.cursorElement?.setAttribute("height", "120")
  }

  next() {
    if (this.index >= this.timeline.length - 1) return false
    this.index++
    this.moveCursor()
    return true
  }

  previous() {
    if (this.index <= 0) return false
    this.index--
    this.moveCursor()
    return true
  }

  reset() {
    this.index = 0
    this.moveCursor()
  }

  getExpectedMIDI() {
    return this.timeline[this.index].notes.map(n => n + 12)
  }

  findGraphicalNotes(midi: number) {
    const ht = midi - 12
    const entry = this.timeline[this.index]

    return entry.graphicalNotes.filter(
      g => g.sourceNote.halfTone === ht
    )
  }

  getTotalNotes() {
    return this.timeline.length
  }

  getIndex() {
    return this.index
  }
}

export function usePracticeCursor(osmdRef: React.MutableRefObject<any>) {

  const [cursor, setCursor] = React.useState<PracticeCursor | null>(null)

  React.useEffect(() => {

    if (!osmdRef.current) return

    const c = new PracticeCursor(osmdRef.current)

    setCursor(c)

    return () => {}
  }, [osmdRef.current])

  return cursor
}

function buildTimeline(osmd: any): TimelineEntry[] {
  const timeline: TimelineEntry[] = []

  osmd.cursor.reset()
  const iterator = osmd.cursor.Iterator

  while (!iterator.EndReached) {
    const voiceEntries = iterator.CurrentVoiceEntries
    const measureIndex = iterator.CurrentMeasureIndex

    const notes: number[] = []
    const graphicalNotes: any[] = []

    for (const ve of voiceEntries) {
      for (const note of ve.Notes) {
        const isRest = note.isRest?.() || note.IsRest
        if (isRest) continue

        notes.push(note.halfTone)
      }
    }

    const graphical = iterator.CurrentStaffEntries

    for (const se of graphical || []) {
      for (const gve of se.graphicalVoiceEntries || []) {
        for (const gn of gve.notes || []) {
          graphicalNotes.push(gn)
        }
      }
    }

    if (notes.length > 0) {
      timeline.push({
        time: voiceEntries[0].Timestamp.RealValue,
        notes,
        measureIndex,
        graphicalNotes
      })
    }

    iterator.moveToNext()
  }

  osmd.cursor.hide()

  return timeline
}