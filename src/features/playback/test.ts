/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ==========================================
// STEP 1: Beat Timeline Data Structure
// ==========================================

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
    
    // Starting timestamp for this measure - convert to Fraction if needed
    const measureStartData = measure.AbsoluteTimestamp;
    let measureStart: Fraction;
    
    if (measureStartData instanceof Fraction) {
      measureStart = measureStartData;
    } else {
      // Create Fraction from plain object
      measureStart = new Fraction(
        measureStartData.numerator || 0,
        measureStartData.denominator || 1
      );
    }
    
    for (let b = 0; b < beatsPerMeasure; b++) {
      // Calculate beat offset
      const beatOffset = new Fraction(b, 1);
      const beatTimeDelta = Fraction.multiply(beatDuration.clone(), beatOffset);
      const beatTimestamp = measureStart.clone().Add(beatTimeDelta);

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
  
  if (!graphicSheet) {
    console.error("No GraphicSheet available");
    return;
  }

  console.log("Enriching beats with visual data...");
  console.log("GraphicSheet MeasureList length:", graphicSheet.MeasureList?.length);

  // First pass: collect all staff entries with their positions
  const measureData: Map<number, any[]> = new Map();
  
  for (let m = 0; m < graphicSheet.MeasureList.length; m++) {
    const measureList = graphicSheet.MeasureList[m];
    if (!measureList || !measureList[0]) continue;
    
    const measure = measureList[0];
    const entries = measure.staffEntries || [];
    
    // DEBUG: Log first measure details
    if (m === 0) {
      console.log("=== MEASURE 0 DEBUG ===");
      console.log("Measure abs position:", measure.PositionAndShape?.AbsolutePosition);
      console.log("Measure bounding box:", measure.PositionAndShape?.BoundingRectangle);
      console.log("Border right:", measure.PositionAndShape?.BorderRight);
      console.log("Staff entries count:", entries.length);
      
      entries.forEach((entry: { timestamp: any; sourceNote: { Timestamp: any; }; parentStaffEntry: { timestamp: any; }; relInMeasureTimestamp: { realValue: any; }; PositionAndShape: { AbsolutePosition: { x: any; y: any; }; }; graphicalVoiceEntries: string | any[]; }, idx: any) => {
        const ts = entry.timestamp || entry.sourceNote?.Timestamp || entry.parentStaffEntry?.timestamp;
        console.log(`  Entry ${idx}:`, {
          timestamp: ts?.realValue ?? ts?.RealValue,
          relTimestamp: entry.relInMeasureTimestamp?.realValue,
          x: entry.PositionAndShape?.AbsolutePosition?.x,
          y: entry.PositionAndShape?.AbsolutePosition?.y,
          hasNotes: entry.graphicalVoiceEntries?.length > 0
        });
      });
    }
    
    measureData.set(m, entries);
  }

  // Second pass: assign positions to beats
  for (const beat of beats) {
    const entries = measureData.get(beat.measureIndex) || [];
    const measureList = graphicSheet.MeasureList[beat.measureIndex];
    const measure = measureList?.[0];
    
    if (!measure) {
      console.warn(`No measure ${beat.measureIndex}`);
      continue;
    }
    
    // Get measure info
    const measureX = measure.PositionAndShape?.AbsolutePosition?.x || 0;
    const measureEndX = measure.PositionAndShape?.BorderRight || (measureX + 100);
    const measureWidth = measureEndX - measureX;
    const ts = measure.parentSourceMeasure?.ActiveTimeSignature || { Numerator: 4 };
    const beatsInMeasure = ts.Numerator;
    
    // Try to find exact timestamp match
    let matchedEntry = null;
    const beatRealValue = typeof beat.timestamp.valueOf === 'function'
      ? beat.timestamp.valueOf()
      : beat.timestamp.RealValue;
    
    for (const entry of entries) {
      // Try multiple properties to get timestamp
      const entryTime = entry.timestamp || entry.relInMeasureTimestamp;
      if (!entryTime) continue;
      
      const entryRealValue = entryTime.realValue ?? entryTime.RealValue ?? 0;
      
      if (
        typeof entryRealValue === "number" &&
        typeof beatRealValue === "number" &&
        Math.abs(entryRealValue - beatRealValue) < 0.0001
      ) {
        matchedEntry = entry;
        break;
      }
    }
    
    if (matchedEntry) {
      // Found exact match - this beat lands ON a note
      beat.staffEntryX = matchedEntry.PositionAndShape?.AbsolutePosition?.x || 0;
      beat.staffEntryY = matchedEntry.PositionAndShape?.AbsolutePosition?.y || 0;
      beat.expectedNotes = extractNotesFromStaffEntry(matchedEntry);
      
      console.log(`Beat ${beat.index} (M${beat.measureIndex}:B${beat.beatInMeasure}): EXACT x=${beat.staffEntryX !== undefined ? beat.staffEntryX.toFixed(2) : 'undefined'}, notes=[${beat.expectedNotes.join(',')}]`);
    } else if (entries.length > 0 && beat.beatInMeasure === 0) {
      // Special case: First beat of measure should use first entry position
      const firstEntry = entries[0];
      beat.staffEntryX = firstEntry.PositionAndShape?.AbsolutePosition?.x || measureX;
      beat.staffEntryY = firstEntry.PositionAndShape?.AbsolutePosition?.y || 0;
      beat.expectedNotes = extractNotesFromStaffEntry(firstEntry);
      
      console.log(`Beat ${beat.index} (M${beat.measureIndex}:B${beat.beatInMeasure}): FIRST NOTE x=${beat.staffEntryX !== undefined ? beat.staffEntryX.toFixed(2) : 'undefined'}, notes=[${beat.expectedNotes.join(',')}]`);
    } else if (entries.length >= beatsInMeasure) {
      // Measure has multiple entries - interpolate between them
      let beforeEntry = null;
      let afterEntry = null;
      
      for (const entry of entries) {
        const entryTime = entry.timestamp;
        if (!entryTime) continue;
        
        const entryRealValue = entryTime.realValue ?? entryTime.RealValue;
        
        if (entryRealValue < beatRealValue) {
          beforeEntry = entry;
        } else if (entryRealValue > beatRealValue && !afterEntry) {
          afterEntry = entry;
          break;
        }
      }
      
      if (beforeEntry && afterEntry) {
        const beforeX = beforeEntry.PositionAndShape?.AbsolutePosition?.x || 0;
        const afterX = afterEntry.PositionAndShape?.AbsolutePosition?.x || 0;
        const beforeTime = beforeEntry.timestamp.realValue ?? beforeEntry.timestamp.RealValue;
        const afterTime = afterEntry.timestamp.realValue ?? afterEntry.timestamp.RealValue;
        
        const totalTimeDiff = afterTime - beforeTime;
        const beatTimeDiff = (typeof beatRealValue === "number" ? beatRealValue : Number(beatRealValue)) - (typeof beforeTime === "number" ? beforeTime : Number(beforeTime));
        const ratio = totalTimeDiff > 0 ? beatTimeDiff / totalTimeDiff : 0;
        
        beat.staffEntryX = beforeX + (afterX - beforeX) * ratio;
        beat.staffEntryY = beforeEntry.PositionAndShape?.AbsolutePosition?.y || 0;
        beat.expectedNotes = [];
        
        console.log(`Beat ${beat.index} (M${beat.measureIndex}:B${beat.beatInMeasure}): INTERPOLATED x=${beat.staffEntryX !== undefined ? beat.staffEntryX.toFixed(2) : 'undefined'}`);
      } else {
        // Fallback to calculated
        const beatOffset = (measureWidth / beatsInMeasure) * beat.beatInMeasure;
        beat.staffEntryX = measureX + beatOffset;
        beat.staffEntryY = measure.PositionAndShape?.AbsolutePosition?.y || 0;
        beat.expectedNotes = [];
        
        console.log(`Beat ${beat.index} (M${beat.measureIndex}:B${beat.beatInMeasure}): CALC-FB x=${beat.staffEntryX !== undefined ? beat.staffEntryX.toFixed(2) : 'undefined'} (mX=${measureX.toFixed(2)}, mW=${measureWidth.toFixed(2)}, offset=${beatOffset.toFixed(2)})`);
      }
    } else {
      // Few entries (whole notes, half notes, etc.) - calculate beat positions evenly
      const beatOffset = (measureWidth / beatsInMeasure) * beat.beatInMeasure;
      beat.staffEntryX = measureX + beatOffset;
      beat.staffEntryY = measure.PositionAndShape?.AbsolutePosition?.y || 0;
      
      // Check if this beat aligns with any note
      beat.expectedNotes = [];
      if (matchedEntry) {
        beat.expectedNotes = extractNotesFromStaffEntry(matchedEntry);
      } else {
        // Check if the first entry in measure aligns with this beat's timing
        if (entries.length > 0) {
          const firstEntry = entries[0];
          const firstEntryTime = firstEntry.timestamp?.realValue ?? firstEntry.timestamp?.RealValue;
          
          // If beat is at or after the first note, include its notes
          if (beatRealValue >= firstEntryTime) {
            beat.expectedNotes = extractNotesFromStaffEntry(firstEntry);
          }
        }
      }
      
      console.log(`Beat ${beat.index} (M${beat.measureIndex}:B${beat.beatInMeasure}): CALCULATED x=${beat.staffEntryX !== undefined ? beat.staffEntryX.toFixed(2) : 'undefined'} (mX=${measureX.toFixed(2)}, mW=${measureWidth.toFixed(2)}, beats=${beatsInMeasure}, offset=${beatOffset.toFixed(2)}), notes=[${beat.expectedNotes.join(',')}]`);
    }
  }

  console.log(`✅ Enriched ${beats.length} beats`);
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
    if (!svg) {
      console.error("No SVG element found");
      return;
    }

    // Remove any existing cursor
    const existing = document.getElementById("custom-beat-cursor");
    if (existing) existing.remove();

    // Create a vertical line cursor
    this.cursorElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    
    this.cursorElement.setAttribute("stroke", "#FF0000");
    this.cursorElement.setAttribute("stroke-width", "4");
    this.cursorElement.setAttribute("opacity", "1");
    this.cursorElement.setAttribute("id", "custom-beat-cursor");
    this.cursorElement.style.pointerEvents = "none";
    this.cursorElement.style.zIndex = "9999";
    
    // Append to end so it's on top
    svg.appendChild(this.cursorElement);
    
    console.log("Cursor element created and appended to SVG");
    this.updateCursorPosition();
  }

  private updateCursorPosition() {
    if (!this.cursorElement) {
      console.error("Cursor element not created");
      return;
    }

    if (!this.isVisible) {
      console.log("Cursor not visible");
      return;
    }

    const beat = this.beats[this.currentBeatIndex];
    if (!beat) {
      console.error("No beat at index", this.currentBeatIndex);
      return;
    }

    console.log(`Updating cursor for beat ${this.currentBeatIndex}:`, {
      measureIndex: beat.measureIndex,
      beatInMeasure: beat.beatInMeasure,
      staffEntryX: beat.staffEntryX,
      staffEntryY: beat.staffEntryY
    });

    if (typeof beat.staffEntryX === 'undefined' || beat.staffEntryX === null) {
      console.error("No X position for beat", beat);
      return;
    }

    const graphicSheet = this.osmd.GraphicSheet;
    if (!graphicSheet) {
      console.error("No GraphicSheet");
      return;
    }

    const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
    
    if (!measureList || !measureList[0]) {
      console.error("No measure found for beat", beat.measureIndex);
      return;
    }

    const measure = measureList[0];
    
    // Get the bounding box of the measure to find its actual position
    const boundingBox = measure.PositionAndShape?.BoundingRectangle;
    const absolutePos = measure.PositionAndShape?.AbsolutePosition;
    
    if (!absolutePos) {
      console.error("No position data for measure", beat.measureIndex);
      return;
    }

    // The X position should be relative to the SVG, not the measure
    // Use the beat's staffEntryX which is already in absolute coordinates
    const x = beat.staffEntryX;
    
    // Get Y position for the staff
    const staveY = absolutePos.y || 0;
    const staveHeight = measure.stave?.StaffHeight || 40;

    const y1 = staveY - 5; // Extend slightly above staff
    const y2 = staveY + staveHeight + 5; // Extend slightly below staff

    console.log(`Setting cursor position: x=${x}, y1=${y1}, y2=${y2}`);
    console.log(`  Measure absolute pos: x=${absolutePos.x}, y=${absolutePos.y}`);
    console.log(`  Beat staffEntryX: ${beat.staffEntryX}`);

    this.cursorElement.setAttribute("x1", x.toString());
    this.cursorElement.setAttribute("y1", y1.toString());
    this.cursorElement.setAttribute("x2", x.toString());
    this.cursorElement.setAttribute("y2", y2.toString());

    console.log("✅ Cursor positioned successfully");

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
      if (!entryTime) continue;
      
      // Check timestamp match (handle both Fraction and plain objects)
      const matches = entryTime.Equals 
        ? entryTime.Equals(beat.timestamp)
        : (entryTime.realValue === beat.timestamp.RealValue);
      
      if (!matches) continue;

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