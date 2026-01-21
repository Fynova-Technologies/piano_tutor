/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fraction } from "opensheetmusicdisplay";
import React from "react";

interface Beat {
  index: number;
  measureIndex: number;
  beatInMeasure: number;
  timestamp: Fraction;
  staffEntryX?: number; // Visual X position
  staffEntryY?: number; // Visual Y position
  expectedNotes: number[]; // OSMD halfTones at this beat
}

// ==========================================
// STEP 2: Build Beat Timeline from OSMD
// ==========================================

export function buildBeatTimeline(osmd: any): Beat[] {
  const beats: Beat[] = [];
  const sheet = osmd.Sheet;
  
  if (!sheet?.SourceMeasures) {
    console.error("No source measures found");
    return beats;
  }

  const measures = sheet.SourceMeasures;
  let beatIndex = 0;

  for (let m = 0; m < measures.length; m++) {
    const measure = measures[m];
    const ts = measure.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };
    const beatsPerMeasure = ts.Numerator;
    const beatUnit = ts.Denominator;

    // Each beat's duration as a fraction
    const beatDuration = new Fraction(1, beatUnit);
    
    // Starting timestamp for this measure
    const measureStart = measure.AbsoluteTimestamp;
    
    for (let b = 0; b < beatsPerMeasure; b++) {
      const beatTimestamp = measureStart.clone().add(
        Fraction.multiply(beatDuration.clone(), new Fraction(b, 1))
      );

      beats.push({
        index: beatIndex++,
        measureIndex: m,
        beatInMeasure: b,
        timestamp: beatTimestamp,
        expectedNotes: []
      });
    }
  }

  // Enrich with visual positions and expected notes
  enrichBeatsWithVisualData(osmd, beats);

  return beats;
}

// ==========================================
// STEP 3: Enrich Beats with Visual Data
// ==========================================

function enrichBeatsWithVisualData(osmd: any, beats: Beat[]) {
  const graphicSheet = osmd.GraphicSheet;
  
  if (!graphicSheet) return;

  for (const beat of beats) {
    // Find the graphical staff entry at this timestamp
    const gse = findStaffEntryAtTimestamp(
      graphicSheet,
      beat.timestamp,
      beat.measureIndex,
      0 // staffIndex
    );

    if (gse) {
      beat.staffEntryX = gse.PositionAndShape?.AbsolutePosition?.x || 0;
      beat.staffEntryY = gse.PositionAndShape?.AbsolutePosition?.y || 0;
      
      // Extract notes at this beat
      beat.expectedNotes = extractNotesFromStaffEntry(gse);
    } else {
      // If no staff entry at exact beat, interpolate position
      interpolateBeatPosition(graphicSheet, beat);
    }
  }
}

function findStaffEntryAtTimestamp(
  graphicSheet: any,
  timestamp: Fraction,
  measureIndex: number,
  staffIndex: number
): any {
  const measureList = graphicSheet.MeasureList?.[measureIndex]?.[staffIndex];
  
  if (!measureList?.staffEntries) return null;

  // Find exact match or closest entry
  for (const staffEntry of measureList.staffEntries) {
    const entryTime = staffEntry.timestamp;
    if (entryTime && entryTime.Equals(timestamp)) {
      return staffEntry;
    }
  }

  return null;
}

function extractNotesFromStaffEntry(staffEntry: any): number[] {
  const notes: number[] = [];
  
  for (const gve of staffEntry.graphicalVoiceEntries || []) {
    for (const gn of gve.notes || []) {
      const halfTone = gn.sourceNote?.halfTone;
      const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
      
      if (typeof halfTone === 'number' && !isRest && !notes.includes(halfTone)) {
        notes.push(halfTone);
      }
    }
  }
  
  return notes;
}

function interpolateBeatPosition(graphicSheet: any, beat: Beat) {
  // If no exact staff entry, interpolate between surrounding entries
  const measureList = graphicSheet.MeasureList?.[beat.measureIndex]?.[0];
  
  if (!measureList?.staffEntries || measureList.staffEntries.length === 0) return;

  const entries = measureList.staffEntries;
  
  // Find entries before and after this beat
  let beforeEntry = null;
  let afterEntry = null;

  for (const entry of entries) {
    const entryTime = entry.timestamp;
    if (!entryTime) continue;

    if (entryTime.lt(beat.timestamp)) {
      beforeEntry = entry;
    } else if (entryTime.gt(beat.timestamp) && !afterEntry) {
      afterEntry = entry;
      break;
    }
  }

  if (beforeEntry && afterEntry) {
    // Interpolate X position
    const beforeX = beforeEntry.PositionAndShape?.AbsolutePosition?.x || 0;
    const afterX = afterEntry.PositionAndShape?.AbsolutePosition?.x || 0;
    const beforeTime = beforeEntry.timestamp;
    const afterTime = afterEntry.timestamp;

    const totalTimeDiff = afterTime.RealValue - beforeTime.RealValue;
    const beatTimeDiff = beat.timestamp.RealValue - beforeTime.RealValue;
    const ratio = beatTimeDiff / totalTimeDiff;

    beat.staffEntryX = beforeX + (afterX - beforeX) * ratio;
    beat.staffEntryY = beforeEntry.PositionAndShape?.AbsolutePosition?.y || 0;
  } else if (beforeEntry) {
    beat.staffEntryX = beforeEntry.PositionAndShape?.AbsolutePosition?.x || 0;
    beat.staffEntryY = beforeEntry.PositionAndShape?.AbsolutePosition?.y || 0;
  }
}

// ==========================================
// STEP 4: Custom Cursor Manager
// ==========================================

export class BeatCursor {
  private osmd: any;
  private beats: Beat[];
  private currentBeatIndex: number = 0;
  private cursorElement: SVGLineElement | null = null;
  private isVisible: boolean = true;

  constructor(osmd: any) {
    this.osmd = osmd;
    this.beats = buildBeatTimeline(osmd);
    this.createCursorElement();
    console.log(`Built beat timeline with ${this.beats.length} beats`);
  }

  private createCursorElement() {
    const svg = this.osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) return;

    // Create a vertical line cursor
    this.cursorElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    
    this.cursorElement.setAttribute("stroke", "#FF0000");
    this.cursorElement.setAttribute("stroke-width", "3");
    this.cursorElement.setAttribute("opacity", "0.8");
    this.cursorElement.setAttribute("id", "custom-beat-cursor");
    
    svg.appendChild(this.cursorElement);
    this.updateCursorPosition();
  }

  private updateCursorPosition() {
    if (!this.cursorElement || !this.isVisible) return;

    const beat = this.beats[this.currentBeatIndex];
    if (!beat || typeof beat.staffEntryX === 'undefined') return;

    const graphicSheet = this.osmd.GraphicSheet;
    const measure = graphicSheet.MeasureList?.[beat.measureIndex]?.[0];
    
    if (!measure?.stave) return;

    const x = beat.staffEntryX;
    const staveY = measure.PositionAndShape?.AbsolutePosition?.y || 0;
    const staveHeight = measure.stave.StaffHeight || 40;

    this.cursorElement.setAttribute("x1", x.toString());
    this.cursorElement.setAttribute("y1", staveY.toString());
    this.cursorElement.setAttribute("x2", x.toString());
    this.cursorElement.setAttribute("y2", (staveY + staveHeight).toString());

    // Scroll into view if needed
    this.scrollIntoView(x);
  }

  private scrollIntoView(x: number) {
    const container = this.osmd.container;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;

    const padding = 100; // pixels of padding

    if (x < scrollLeft + padding) {
      container.scrollLeft = Math.max(0, x - padding);
    } else if (x > scrollRight - padding) {
      container.scrollLeft = x - containerWidth + padding;
    }
  }

  // ==========================================
  // Public API
  // ==========================================

  next(): boolean {
    if (this.currentBeatIndex >= this.beats.length - 1) {
      return false; // End of piece
    }
    this.currentBeatIndex++;
    this.updateCursorPosition();
    return true;
  }

  previous(): boolean {
    if (this.currentBeatIndex <= 0) {
      return false;
    }
    this.currentBeatIndex--;
    this.updateCursorPosition();
    return true;
  }

  reset() {
    this.currentBeatIndex = 0;
    this.updateCursorPosition();
  }

  getCurrentBeat(): Beat | null {
    return this.beats[this.currentBeatIndex] || null;
  }

  getBeatAt(index: number): Beat | null {
    return this.beats[index] || null;
  }

  getTotalBeats(): number {
    return this.beats.length;
  }

  getCurrentIndex(): number {
    return this.currentBeatIndex;
  }

  setPosition(beatIndex: number) {
    if (beatIndex >= 0 && beatIndex < this.beats.length) {
      this.currentBeatIndex = beatIndex;
      this.updateCursorPosition();
    }
  }

  show() {
    this.isVisible = true;
    if (this.cursorElement) {
      this.cursorElement.setAttribute("display", "block");
    }
  }

  hide() {
    this.isVisible = false;
    if (this.cursorElement) {
      this.cursorElement.setAttribute("display", "none");
    }
  }

  destroy() {
    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }
  }

  // ==========================================
  // Note Reading Functions
  // ==========================================

  getCurrentExpectedNotes(): number[] {
    const beat = this.getCurrentBeat();
    return beat?.expectedNotes || [];
  }

  // Get expected notes as MIDI numbers (add 12 to OSMD halfTones)
  getCurrentExpectedMIDI(): number[] {
    return this.getCurrentExpectedNotes().map(ht => ht + 12);
  }

  // Find graphical notes at current beat for highlighting
  findGraphicalNotesAtCurrentBeat(midiNote: number): any[] {
    const beat = this.getCurrentBeat();
    if (!beat) return [];

    const osmdHalfTone = midiNote - 12;
    
    const graphicSheet = this.osmd.GraphicSheet;
    const measureList = graphicSheet.MeasureList?.[beat.measureIndex]?.[0];
    
    if (!measureList?.staffEntries) return [];

    const matchingNotes: any[] = [];

    for (const staffEntry of measureList.staffEntries) {
      const entryTime = staffEntry.timestamp;
      if (!entryTime || !entryTime.Equals(beat.timestamp)) continue;

      for (const gve of staffEntry.graphicalVoiceEntries || []) {
        for (const gn of gve.notes || []) {
          const halfTone = gn.sourceNote?.halfTone;
          if (halfTone === osmdHalfTone) {
            matchingNotes.push(gn);
          }
        }
      }
    }

    return matchingNotes;
  }
}

// ==========================================
// STEP 5: Integration Hook for React
// ==========================================

export function useBeatCursor(osmdRef: React.MutableRefObject<any>) {
  const [beatCursor, setBeatCursor] = React.useState<BeatCursor | null>(null);
  const [currentBeatIndex, setCurrentBeatIndex] = React.useState(0);
  const [totalBeats, setTotalBeats] = React.useState(0);

  React.useEffect(() => {
    if (!osmdRef.current) return;

    const cursor = new BeatCursor(osmdRef.current);
    setBeatCursor(cursor);
    setTotalBeats(cursor.getTotalBeats());

    return () => {
      cursor.destroy();
    };
  }, [osmdRef.current]);

  const next = () => {
    if (beatCursor?.next()) {
      setCurrentBeatIndex(beatCursor.getCurrentIndex());
    }
  };

  const previous = () => {
    if (beatCursor?.previous()) {
      setCurrentBeatIndex(beatCursor.getCurrentIndex());
    }
  };

  const reset = () => {
    beatCursor?.reset();
    setCurrentBeatIndex(0);
  };

  return {
    beatCursor,
    currentBeatIndex,
    totalBeats,
    next,
    previous,
    reset
  };
}