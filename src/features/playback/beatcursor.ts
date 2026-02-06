/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// Beat-wise Cursor - MEASURE-BASED APPROACH
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
  isNoteStart?: boolean;
  noteDuration?: number;
}

function collectMeasurePositions(osmd: any): Map<number, { x: number; width: number; y: number; height: number }> {
  const map = new Map();
  const graphicSheet = osmd.GraphicSheet;
  
  if (!graphicSheet?.MeasureList) {
    console.error("❌ No graphic sheet found");
    return map;
  }

  let unitInPixels = 10;
  if (osmd.drawer?.backend) {
    const innerElement = osmd.drawer.backend.getInnerElement?.();
    if (innerElement?.offsetWidth && graphicSheet.ParentMusicSheet?.pageWidth) {
      unitInPixels = innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
    }
  }

  console.log("🔍 === COLLECTING MEASURE POSITIONS ===");
  console.log(`   Unit conversion: ${unitInPixels.toFixed(2)} px/unit`);

  for (let measureIdx = 0; measureIdx < graphicSheet.MeasureList.length; measureIdx++) {
    const measureList = graphicSheet.MeasureList[measureIdx];
    
    if (!measureList || measureList.length === 0) continue;

    // Use first staff measure
    const measure = measureList[0];
    const position = measure.PositionAndShape?.AbsolutePosition;
    const size = measure.PositionAndShape?.Size;
    
    if (!position?.x || !size?.width) continue;

    // Get system height
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
    }

    const xPixels = position.x * unitInPixels;
    const widthPixels = size.width * unitInPixels;

    map.set(measureIdx, {
      x: xPixels,
      width: widthPixels,
      y: systemTopY,
      height: systemHeight
    });

    if (measureIdx < 10) {
      console.log(`   Measure ${measureIdx}: X=${xPixels.toFixed(1)}px, Width=${widthPixels.toFixed(1)}px, Y=${systemTopY.toFixed(1)}px`);
    }
  }

  console.log(`✅ Collected ${map.size} measure positions`);
  return map;
}

export function buildBeatTimeline(osmd: any): Beat[] {
  const beats: Beat[] = [];
  const sheet = osmd.Sheet;

  if (!sheet?.SourceMeasures) {
    console.error("❌ No source measures found");
    return beats;
  }

  const measures = sheet.SourceMeasures;
  const measurePositions = collectMeasurePositions(osmd);


  // -----------------------------------
  // 1. Compute measure start times
  // -----------------------------------
  const measureStarts: number[] = [];

  let t = 0;

  for (let i = 0; i < measures.length; i++) {
    measureStarts[i] = t;

    const m = measures[i];

    if (m.Duration?.RealValue != null) {
      t += m.Duration.RealValue;
    } else {
      const ts = m.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };
      t += ts.Numerator * (1 / ts.Denominator);
    }
  }

  // -----------------------------------
  // 2. Collect graphical entries
  // -----------------------------------
  const graphicalEntries = collectGraphicalEntries(osmd, measureStarts);

  console.log("🎼 Graphical entries:", graphicalEntries.length);

  // -----------------------------------
  // 3. Build beats
  // -----------------------------------
  let beatIndex = 0;
  let absoluteTimestamp = new Fraction(0, 1);

  for (let m = 0; m < measures.length; m++) {
    const measure = measures[m];
    const ts = measure.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };

    const beatsPerMeasure = ts.Numerator;
    const beatDuration = new Fraction(1, ts.Denominator);

    for (let b = 0; b < beatsPerMeasure; b++) {
      const beatTime = absoluteTimestamp.RealValue;

      const beat: Beat = {
        index: beatIndex++,
        measureIndex: m,
        beatInMeasure: b,
        timestamp: absoluteTimestamp.clone(),
        expectedNotes: [],
        isNoteStart: false,
        noteDuration: 0
      };

      // -----------------------------------
      // 4. Find latest entry before beat
      // -----------------------------------
      const EPS = 1e-4;

let snap: any = null;

// Find note that starts exactly here
for (const entry of graphicalEntries) {
  if (Math.abs(entry.absTime - beatTime) < EPS) {
    snap = entry;
    break;
  }
}

const measurePos = measurePositions.get(m);

// 1️⃣ Snap if note starts
if (snap) {
  beat.staffEntryX = snap.x;
  beat.staffEntryY = snap.y;
  beat.systemHeight = snap.height;
}

// 2️⃣ Otherwise interpolate
else if (measurePos) {
  const localTime = beatTime - measureStarts[m];

  const measureDur =
    measures[m].Duration?.RealValue ??
    (measures[m].ActiveTimeSignature.Numerator *
      (1 / measures[m].ActiveTimeSignature.Denominator));

  const ratio = localTime / measureDur;

  const clamped = Math.max(0, Math.min(1, ratio));

  beat.staffEntryX =
    measurePos.x + measurePos.width * clamped;

  beat.staffEntryY = measurePos.y;
  beat.systemHeight = measurePos.height;
}

      beats.push(beat);

      absoluteTimestamp = absoluteTimestamp.Add(beatDuration);
    }
  }

  // -----------------------------------
  // 5. Carry forward sustained notes
  // -----------------------------------
  let lastX: number | undefined;
  let lastY: number | undefined;
  let lastH: number | undefined;

  for (const beat of beats) {
    if (beat.staffEntryX != null) {
      lastX = beat.staffEntryX;
      lastY = beat.staffEntryY;
      lastH = beat.systemHeight;
    } else if (lastX != null) {
      beat.staffEntryX = lastX;
      beat.staffEntryY = lastY;
      beat.systemHeight = lastH;
    }
  }

  console.log(`✅ Built ${beats.length} beats`);

  enrichBeatsWithNotes(osmd, beats);

  return beats;
}


function collectGraphicalEntries(osmd: any, measureStarts: number[]) {
  const entries: {
    time: number;       // local
    absTime: number;    // global
    x: number;
    y: number;
    height: number;
    measureIndex: number;
  }[] = [];

  const sheet = osmd.GraphicSheet;
  if (!sheet?.MeasureList) return entries;

  const unit =
    osmd.drawer.backend.getInnerElement().offsetWidth /
    sheet.ParentMusicSheet.pageWidth;

  for (let m = 0; m < sheet.MeasureList.length; m++) {
    const staffMeasures = sheet.MeasureList[m];

    for (const measure of staffMeasures) {
      const system = measure.ParentMusicSystem;

      const top =
        system.StaffLines[0].PositionAndShape.AbsolutePosition.y * unit;

      const bottomStaff =
        system.StaffLines[system.StaffLines.length - 1];

      const bottom =
        (bottomStaff.PositionAndShape.AbsolutePosition.y +
          bottomStaff.PositionAndShape.Size.height) * unit;

      const height = bottom - top + 20;

      for (const entry of measure.staffEntries || []) {
        const localTime =
          entry.timestamp?.RealValue ??
          entry.sourceStaffEntry?.Timestamp?.RealValue;

        if (localTime == null) continue;

        const pos = entry.PositionAndShape?.AbsolutePosition;
        if (!pos) continue;

        const absTime = measureStarts[m] + localTime;

        entries.push({
          time: localTime,
          absTime,
          x: pos.x * unit,
          y: top,
          height,
          measureIndex: m
        });
      }
    }
  }

  return entries;
}



function enrichBeatsWithNotes(osmd: any, beats: Beat[]) {
  if (!osmd.cursor) {
    console.error("❌ OSMD cursor not available");
    return;
  }

  console.log("=== 🔧 ENRICHING BEATS WITH NOTES ===");

  osmd.cursor.reset();
  const iterator = osmd.cursor.Iterator;
  
  interface VoiceEntryInfo {
    timestamp: Fraction;
    notes: number[];
    duration: number;
    measureIndex: number;
  }
  
  const allVoiceEntries: VoiceEntryInfo[] = [];
  
  let safetyCounter = 0;
  const MAX_ITERATIONS = 10000;
  
  while (!iterator.EndReached && safetyCounter < MAX_ITERATIONS) {
    safetyCounter++;
    
    const currentVoiceEntries = iterator.CurrentVoiceEntries;
    const measureIndex = iterator.CurrentMeasureIndex;
    
    if (currentVoiceEntries && currentVoiceEntries.length > 0) {
      const firstEntry = currentVoiceEntries[0];
      const timestamp = firstEntry.Timestamp;
      
      const notes: number[] = [];
      let maxDuration = 0;
      
      for (const voiceEntry of currentVoiceEntries) {
        for (const note of voiceEntry.Notes || []) {
          const halfTone = note.halfTone;
          const isRest = note.isRest?.() || note.IsRest || false;
          const duration = note.Length?.RealValue ?? 0;
          
          if (duration > maxDuration) {
            maxDuration = duration;
          }
          
          if (typeof halfTone === 'number' && !isRest && !notes.includes(halfTone)) {
            notes.push(halfTone);
          }
        }
      }
      
      if (notes.length > 0) {
        allVoiceEntries.push({
          timestamp: timestamp.clone(),
          notes: notes,
          duration: maxDuration,
          measureIndex: measureIndex
        });
      }
    }
    
    iterator.moveToNext();
  }

  const EPSILON = 1e-6;
  
  console.log("🎹 === ASSIGNING NOTES TO BEATS ===");
  
  for (const beat of beats) {
    const beatTime = beat.timestamp.RealValue;
    
    // Find active notes
    const activeNotes: number[] = [];
    let isStart = false;
    let noteDuration = 0;
    
    for (const entry of allVoiceEntries) {
      const entryStart = entry.timestamp.RealValue;
      const entryEnd = entryStart + entry.duration;
      
      if (beatTime >= entryStart - EPSILON && beatTime < entryEnd - EPSILON) {
        for (const note of entry.notes) {
          if (!activeNotes.includes(note)) {
            activeNotes.push(note);
          }
        }
        
        if (Math.abs(beatTime - entryStart) < EPSILON) {
          isStart = true;
          noteDuration = entry.duration;
        }
      }
    }
    
    beat.expectedNotes = activeNotes;
    beat.isNoteStart = isStart;
    beat.noteDuration = noteDuration;
  }
  
  const validBeats = beats.filter(b => b.staffEntryX && b.staffEntryX > 0).length;
  const uniqueXPositions = new Set(beats.map(b => b.staffEntryX).filter(x => x !== undefined && x > 0));
  
  console.log(`✅ Enrichment complete - ${validBeats}/${beats.length} beats have valid positions`);
  console.log(`   ${uniqueXPositions.size} unique X positions found`);
  
  osmd.cursor.hide();
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
    
    if (!osmd.cursor) {
      console.error("❌ OSMD cursor not initialized");
      this.beats = [];
      return;
    }
    
    this.beats = buildBeatTimeline(osmd);
    this.createCursorElement();
    
    console.log(`✅ BeatCursor ready: ${this.beats.length} beats`);
    console.log(`   First 8 X positions: [${this.beats.slice(0, 8).map(b => b.staffEntryX?.toFixed(1) || 'N/A').join(', ')}]`);
  }

  private createCursorElement() {
    const svg = this.osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) {
      console.error("❌ No SVG element found");
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
    this.updateCursorPosition();
  }

  private updateCursorPosition() {
    if (!this.cursorElement) {
      console.warn("⚠️ Cursor element not initialized");
      return;
    }

    if (!this.isVisible) {
      this.cursorElement.setAttribute("display", "none");
      return;
    }

    const beat = this.beats[this.currentBeatIndex];
    if (!beat) {
      console.error(`❌ No beat found at index ${this.currentBeatIndex}`);
      return;
    }

    if (beat.staffEntryX === undefined || beat.staffEntryX <= 0) {
  console.warn("⚠️ Missing X at beat", this.currentBeatIndex);

  // fallback: keep last position
  return;
}


    this.cursorElement.setAttribute("display", "block");

    // Visual feedback based on beat type
    if (beat.isNoteStart) {
      this.cursorElement.setAttribute("opacity", "0.8");
      this.cursorElement.setAttribute("fill", "rgba(255, 0, 0, 0.20)");
      this.cursorElement.setAttribute("stroke", "#FF0000");
      this.cursorElement.setAttribute("stroke-width", "2.5");
    } else if (beat.expectedNotes.length > 0) {
      this.cursorElement.setAttribute("opacity", "0.5");
      this.cursorElement.setAttribute("fill", "rgba(255, 165, 0, 0.15)");
      this.cursorElement.setAttribute("stroke", "#FF8800");
      this.cursorElement.setAttribute("stroke-width", "2");
    } else {
      this.cursorElement.setAttribute("opacity", "0.25");
      this.cursorElement.setAttribute("fill", "rgba(128, 128, 128, 0.10)");
      this.cursorElement.setAttribute("stroke", "#888888");
      this.cursorElement.setAttribute("stroke-width", "1.5");
    }

    const cursorWidth = 28;
    const x = beat.staffEntryX - (cursorWidth / 2);
    const y = beat.staffEntryY ?? 0;
    const height = beat.systemHeight ?? 100;

    if (isNaN(x) || isNaN(y) || isNaN(height)) {
      console.error(`❌ Invalid cursor position values: x=${x}, y=${y}, height=${height}`);
      return;
    }

    this.cursorElement.setAttribute("x", x.toString());
    this.cursorElement.setAttribute("y", y.toString());
    this.cursorElement.setAttribute("width", cursorWidth.toString());
    this.cursorElement.setAttribute("height", height.toString());

    // Ensure cursor is on top
    const parent = this.cursorElement.parentNode;
    if (parent) {
      parent.removeChild(this.cursorElement);
      parent.appendChild(this.cursorElement);
    }

    console.log(`🎯 Cursor at beat ${this.currentBeatIndex} (t=${beat.timestamp.RealValue.toFixed(4)}): X=${x.toFixed(1)}, Y=${y.toFixed(1)}`);

    this.scrollIntoView(beat.staffEntryX);
  }

  private scrollIntoView(x: number) {
    const container = this.osmd.container;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    
    const padding = Math.min(150, containerWidth * 0.2);

    if (x < scrollLeft + padding) {
      container.scrollLeft = Math.max(0, x - padding);
    } else if (x > scrollRight - padding) {
      container.scrollLeft = x - containerWidth + padding;
    }
  }

  next(): boolean {
    if (this.currentBeatIndex >= this.beats.length - 1) {
      console.log(`⚠️ Already at last beat (${this.currentBeatIndex}/${this.beats.length - 1})`);
      return false;
    }
    
    this.currentBeatIndex++;
    console.log(`➡️ Moved to beat ${this.currentBeatIndex}/${this.beats.length - 1}`);
    this.updateCursorPosition();
    return true;
  }

  previous(): boolean {
    if (this.currentBeatIndex <= 0) {
      console.log(`⚠️ Already at first beat`);
      return false;
    }
    
    this.currentBeatIndex--;
    console.log(`⬅️ Moved to beat ${this.currentBeatIndex}`);
    this.updateCursorPosition();
    return true;
  }

  reset() {
    this.currentBeatIndex = 0;
    this.isPlaying = false;
    console.log(`🔄 Reset to beat 0`);
    this.updateCursorPosition();
  }
  
  refreshPositions() {
    console.log(`🔄 Refreshing positions for all beats...`);
    const newBeats = buildBeatTimeline(this.osmd);
    
    // Preserve note data
    for (let i = 0; i < Math.min(this.beats.length, newBeats.length); i++) {
      newBeats[i].expectedNotes = this.beats[i].expectedNotes;
      newBeats[i].isNoteStart = this.beats[i].isNoteStart;
      newBeats[i].noteDuration = this.beats[i].noteDuration;
    }
    
    this.beats = newBeats;
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
      console.log(`📍 Set position to beat ${beatIndex}`);
      this.updateCursorPosition();
    } else {
      console.error(`❌ Invalid beat index: ${beatIndex} (valid range: 0-${this.beats.length - 1})`);
    }
  }

  show() {
    this.isVisible = true;
    console.log(`👁️ Showing cursor`);
    this.updateCursorPosition();
  }

  hide() {
    this.isVisible = false;
    console.log(`🙈 Hiding cursor`);
    if (this.cursorElement) {
      this.cursorElement.setAttribute("display", "none");
    }
  }

  destroy() {
    if (this.cursorElement) {
      this.cursorElement.remove();
      this.cursorElement = null;
    }
    if (this.osmd.cursor) {
      this.osmd.cursor.hide();
    }
    console.log(`🗑️ Cursor destroyed`);
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

  isCurrentBeatNoteStart(): boolean {
    const beat = this.getCurrentBeat();
    return beat?.isNoteStart ?? false;
  }

  findGraphicalNotesAtCurrentBeat(midiNote: number): any[] {
    const beat = this.getCurrentBeat();
    if (!beat) return [];

    const osmdHalfTone = midiNote - 12;
    const graphicSheet = this.osmd.GraphicSheet;
    const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
    
    if (!measureList) return [];

    const matchingNotes: any[] = [];
    const beatTime = beat.timestamp.RealValue;
    const EPSILON = 1e-6;

    for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
      const measure = measureList[staffIdx];
      
      for (const staffEntry of measure.staffEntries || []) {
        const entryTime = staffEntry.timestamp?.RealValue ?? 
                         staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
        
        if (entryTime === null || Math.abs(entryTime - beatTime) > EPSILON) continue;

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

    console.log("🎬 Initializing BeatCursor from useBeatCursor hook");
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

  const refreshPositions = () => {
    beatCursor?.refreshPositions();
  };

  return {
    beatCursor,
    currentBeatIndex,
    totalBeats,
    next,
    previous,
    reset,
    refreshPositions
  };
}