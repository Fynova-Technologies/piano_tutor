/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// Beat-wise Cursor for OSMD - FIXED VERSION
// ==========================================

import { Fraction } from "opensheetmusicdisplay";
import React from "react";

interface Beat {
  index: number;
  measureIndex: number;
  beatInMeasure: number;
  timestamp: Fraction;
  staffEntryX?: number;
  staffEntryY?: number;
  systemHeight?: number;
  expectedNotes: number[];
}

export function buildBeatTimeline(osmd: any): Beat[] {
  const beats: Beat[] = [];
  const sheet = osmd.Sheet;
  
  if (!sheet?.SourceMeasures) {
    console.error("No source measures found");
    return beats;
  }

  const measures = sheet.SourceMeasures;
  let beatIndex = 0;
  let absoluteTimestamp = new Fraction(0, 1);

  for (let m = 0; m < measures.length; m++) {
    const measure = measures[m];
    const ts = measure.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };
    const beatsPerMeasure = ts.Numerator;
    const beatUnit = ts.Denominator;
    const beatDuration = new Fraction(1, beatUnit);
    
    for (let b = 0; b < beatsPerMeasure; b++) {
      beats.push({
        index: beatIndex++,
        measureIndex: m,
        beatInMeasure: b,
        timestamp: absoluteTimestamp.clone(),
        expectedNotes: []
      });
      
      absoluteTimestamp = absoluteTimestamp.Add(beatDuration);
    }
  }

  enrichBeatsWithCalculatedPositions(osmd, beats);
  return beats;
}

function enrichBeatsWithCalculatedPositions(osmd: any, beats: Beat[]) {
  const graphicSheet = osmd.GraphicSheet;
  
  if (!graphicSheet) {
    console.error("No GraphicSheet available");
    return;
  }

  console.log("=== ENRICHING WITH CALCULATED POSITIONS (FIXED) ===");

  const unitInPixels = osmd.drawer?.backend?.getInnerElement?.()?.offsetWidth 
    ? osmd.drawer.backend.getInnerElement().offsetWidth / graphicSheet.ParentMusicSheet.pageWidth
    : 10;

  console.log("Unit to pixel conversion:", unitInPixels);

  for (const beat of beats) {
    const measureIndex = beat.measureIndex;
    const measureList = graphicSheet.MeasureList?.[measureIndex];
    
    if (!measureList || !measureList[0]) continue;

    const measure = measureList[0];
    const staffEntries = measure.staffEntries || [];
    const beatAbsValue = beat.timestamp.RealValue;
    
    // Get system info - COVER ALL STAVES
    const musicSystem = measure.ParentMusicSystem;
    let systemHeight = 100;
    let systemTopY = 0;
    
    if (musicSystem?.StaffLines?.length > 0) {
      const firstStaff = musicSystem.StaffLines[0];
      const lastStaff = musicSystem.StaffLines[musicSystem.StaffLines.length - 1];
      
      const firstY = (firstStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastY = (lastStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastHeight = (lastStaff.PositionAndShape?.Size?.height ?? 40) * unitInPixels;
      
      systemTopY = firstY;
      systemHeight = (lastY + lastHeight) - firstY + 20;
    } else if (musicSystem?.PositionAndShape?.Size?.height) {
      systemHeight = musicSystem.PositionAndShape.Size.height * unitInPixels;
      systemTopY = (musicSystem.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
    } else {
      // Fallback: calculate from all measures
      let minY = Infinity;
      let maxY = -Infinity;
      
      for (const m of measureList) {
        const y = (m.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
        const h = (m.PositionAndShape?.Size?.height ?? 40) * unitInPixels;
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + h);
      }
      
      if (minY !== Infinity) {
        systemTopY = minY;
        systemHeight = maxY - minY + 20;
      }
    }
    
    beat.systemHeight = systemHeight;
    
    // ===== FIXED X POSITION CALCULATION =====
    const measurePos = measure.PositionAndShape?.AbsolutePosition;
    const measureX = (measurePos?.x ?? 0) * unitInPixels;
    const measureY = systemTopY;
    
    // Collect all note entries in this measure with their positions and durations
    const noteEntries: Array<{
      timestamp: number;
      duration: number;
      x: number;
      notes: number[];
    }> = [];
    
    for (const entry of staffEntries) {
      const entryTime = entry.timestamp?.RealValue ?? 0;
      const entryX = (entry.PositionAndShape?.AbsolutePosition?.x ?? 0) * unitInPixels;
      
      // Get duration and notes from this entry
      let duration = 0;
      const notes: number[] = [];
      
      for (const gve of entry.graphicalVoiceEntries || []) {
        for (const gn of gve.notes || []) {
          const halfTone = gn.sourceNote?.halfTone;
          const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
          const noteDuration = gn.sourceNote?.Length?.RealValue ?? 0;
          
          if (noteDuration > duration) {
            duration = noteDuration;
          }
          
          if (typeof halfTone === 'number' && !isRest && !notes.includes(halfTone)) {
            notes.push(halfTone);
          }
        }
      }
      
      noteEntries.push({
        timestamp: entryTime,
        duration,
        x: entryX,
        notes
      });
    }
    
    // Sort by timestamp
    noteEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Find which note entry contains this beat
    let activeEntry: typeof noteEntries[0] | null = null;
    
    for (let i = 0; i < noteEntries.length; i++) {
      const entry = noteEntries[i];
      const entryStart = entry.timestamp;
      const entryEnd = entry.timestamp + entry.duration;
      
      // Check if this beat falls within this note's duration
      if (beatAbsValue >= entryStart && beatAbsValue < entryEnd) {
        activeEntry = entry;
        break;
      }
    }
    
    // Calculate measure-based position (used for all beats)
    let measureWidth = 0;
    if (measure.PositionAndShape?.Size?.width) {
      measureWidth = measure.PositionAndShape.Size.width * unitInPixels;
    } else {
      const borderRight = measure.PositionAndShape?.BorderRight ?? (measurePos?.x ?? 0) + 50;
      const borderLeft = measurePos?.x ?? 0;
      measureWidth = Math.abs((borderRight - borderLeft) * unitInPixels);
    }
    
    const ts = measure.parentSourceMeasure?.ActiveTimeSignature || { Numerator: 4 };
    const beatsInMeasure = ts.Numerator;
    
    const LEFT_MARGIN = 55;
    const RIGHT_MARGIN = 20;
    const usableWidth = measureWidth - LEFT_MARGIN - RIGHT_MARGIN;
    const beatWidth = usableWidth / beatsInMeasure;
    const beatOffset = LEFT_MARGIN + (beatWidth * beat.beatInMeasure);
    
    const beatX = measureX + beatOffset + 12;
    
    // Store expected notes if we found an active entry
    if (activeEntry) {
      beat.expectedNotes = [...activeEntry.notes];
    }
    
    beat.staffEntryX = beatX;
    beat.staffEntryY = measureY;
    
    if (beat.index < 16) { // Log first 16 beats for debugging
      console.log(`✓ Beat ${beat.index}:`, {
        measure: measureIndex,
        beatNum: beat.beatInMeasure,
        X: beat.staffEntryX.toFixed(1),
        Y: beat.staffEntryY.toFixed(1),
        H: systemHeight.toFixed(1),
        hasActiveEntry: !!activeEntry,
        duration: activeEntry?.duration,
        notes: beat.expectedNotes
      });
    }

    // Also extract notes from ALL staves (in case we missed any)
    const additionalNotes: number[] = [];
    for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
      const staffMeasure = measureList[staffIdx];
      for (const entry of staffMeasure.staffEntries || []) {
        const entryTime = entry.timestamp?.RealValue ?? 0;
        if (Math.abs(entryTime - beatAbsValue) < 0.0001) {
          const notesFromStaff = extractNotesFromStaffEntry(entry);
          for (const note of notesFromStaff) {
            if (!beat.expectedNotes.includes(note) && !additionalNotes.includes(note)) {
              additionalNotes.push(note);
            }
          }
        }
      }
    }
    
    // Add any additional notes we found
    beat.expectedNotes.push(...additionalNotes);
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

export class BeatCursor {
  private osmd: any;
  private beats: Beat[];
  private currentBeatIndex: number = 0;
  private cursorElement: SVGRectElement | null = null;
  private isVisible: boolean = true;
  private isPlaying: boolean = false;

  constructor(osmd: any) {
    this.osmd = osmd;
    this.beats = buildBeatTimeline(osmd);
    this.createCursorElement();
    
    console.log(`📊 Built beat timeline with ${this.beats.length} beats`);
  }

  private createCursorElement() {
    const svg = this.osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) {
      console.error("No SVG element found");
      return;
    }

    const existing = document.getElementById("custom-beat-cursor");
    if (existing) existing.remove();

    this.cursorElement = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    this.cursorElement.setAttribute("fill", "rgba(255, 0, 0, 0.15)");
    this.cursorElement.setAttribute("stroke", "#FF0000");
    this.cursorElement.setAttribute("stroke-width", "2");
    this.cursorElement.setAttribute("opacity", "0.8");
    this.cursorElement.setAttribute("id", "custom-beat-cursor");
    this.cursorElement.style.pointerEvents = "none";
    this.cursorElement.setAttribute("rx", "3");
    
    svg.appendChild(this.cursorElement);
    console.log("Cursor element created");
    this.updateCursorPosition();
  }

  private updateCursorPosition() {
    if (!this.cursorElement || !this.isVisible) {
      if (this.cursorElement) this.cursorElement.setAttribute("display", "none");
      return;
    }

    this.cursorElement.setAttribute("display", "block");

    const beat = this.beats[this.currentBeatIndex];
    if (!beat || beat.staffEntryX === undefined) {
      console.error("Invalid beat", beat);
      return;
    }

    // Position cursor to cover notes better
    const x = beat.staffEntryX - 12;
    const y = beat.staffEntryY?? - 10;
    const width = 28;
    const height = (beat.systemHeight ?? 100) + 20;

    console.log(`🎯 Cursor at beat ${this.currentBeatIndex}: X=${x.toFixed(1)}, Y=${y.toFixed(1)}, H=${height.toFixed(1)}`);

    this.cursorElement.setAttribute("x", x.toString());
    this.cursorElement.setAttribute("y", y.toString());
    this.cursorElement.setAttribute("width", width.toString());
    this.cursorElement.setAttribute("height", height.toString());

    const parent = this.cursorElement.parentNode;
    if (parent) {
      const nextSibling = this.cursorElement.nextSibling;
      parent.removeChild(this.cursorElement);
      if (nextSibling) {
        parent.insertBefore(this.cursorElement, nextSibling);
      } else {
        parent.appendChild(this.cursorElement);
      }
    }

    this.scrollIntoView(beat.staffEntryX);
  }

  private scrollIntoView(x: number) {
    const container = this.osmd.container;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    const padding = 100;

    if (x < scrollLeft + padding) {
      container.scrollLeft = Math.max(0, x - padding);
    } else if (x > scrollRight - padding) {
      container.scrollLeft = x - containerWidth + padding;
    }
  }

  next(): boolean {
    if (this.currentBeatIndex >= this.beats.length - 1) return false;
    this.currentBeatIndex++;
    this.updateCursorPosition();
    return true;
  }

  previous(): boolean {
    if (this.currentBeatIndex <= 0) return false;
    this.currentBeatIndex--;
    this.updateCursorPosition();
    return true;
  }

  reset() {
    this.currentBeatIndex = 0;
    this.isPlaying = false;
    this.updateCursorPosition();
  }
  
  refreshPositions() {
    enrichBeatsWithCalculatedPositions(this.osmd, this.beats);
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
    this.updateCursorPosition();
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

  startPlayback() {
    this.isPlaying = true;
    this.updateCursorPosition();
  }
  
  stopPlayback() {
    this.isPlaying = false;
    this.updateCursorPosition();
  }

  getCurrentExpectedNotes(): number[] {
    const beat = this.getCurrentBeat();
    return beat?.expectedNotes || [];
  }

  getCurrentExpectedMIDI(): number[] {
    return this.getCurrentExpectedNotes().map(ht => ht + 12);
  }

  findGraphicalNotesAtCurrentBeat(midiNote: number): any[] {
    const beat = this.getCurrentBeat();
    if (!beat) return [];

    const osmdHalfTone = midiNote - 12;
    
    const graphicSheet = this.osmd.GraphicSheet;
    const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
    
    if (!measureList) return [];

    const matchingNotes: any[] = [];

    for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
      const measure = measureList[staffIdx];
      
      for (const staffEntry of measure.staffEntries || []) {
        const entryTime = staffEntry.timestamp?.RealValue;
        const beatTime = beat.timestamp.RealValue;
        
        if (Math.abs(entryTime - beatTime) > 0.0001) continue;

        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const halfTone = gn.sourceNote?.halfTone;
            if (halfTone === osmdHalfTone) {
              matchingNotes.push(gn);
            }
          }
        }
      }
    }

    return matchingNotes;
  }
}

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