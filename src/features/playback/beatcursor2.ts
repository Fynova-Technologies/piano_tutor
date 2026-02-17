/* eslint-disable @typescript-eslint/no-explicit-any */
// ==========================================
// Beat-wise Cursor - MEASURE-BASED APPROACH
// ==========================================
// 🎯 FIXED: Timestamp mismatch between beats (absolute) and voice entries (relative)

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

function getCursorX(
  beatAnchors: Map<number, any[]>,
  measure: number,
  localTime: number
) {
  const anchors = beatAnchors.get(measure);

  if (!anchors || anchors.length < 2) {
    console.warn(`⚠️ Measure ${measure}: Insufficient anchors (${anchors?.length || 0})`);
    return null;
  }

  // 🎯 FIND THE SEGMENT WE'RE IN
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];

    if (localTime >= a.t && localTime <= b.t) {
      // ✅ INTERPOLATE between the two anchors
      const p = (localTime - a.t) / (b.t - a.t);
      const x = a.x + (b.x - a.x) * p;
      
      if (i === 0 && localTime < 0.001) {
        console.log(`   🎯 Measure ${measure} at t=${localTime.toFixed(3)}: interpolated x=${x.toFixed(1)} (anchor at t=${a.t}, x=${a.x.toFixed(1)})`);
      }
      
      return x;
    }
  }

  // 🎯 IMPROVED FALLBACK: Handle times before first anchor or after last anchor
  const firstAnchor = anchors[0];
  const lastAnchor = anchors[anchors.length - 1];
  
  if (localTime < firstAnchor.t) {
    console.warn(`⚠️ Measure ${measure}: localTime ${localTime.toFixed(3)} < first anchor ${firstAnchor.t.toFixed(3)}, using first anchor x=${firstAnchor.x.toFixed(1)}`);
    return firstAnchor.x;
  }
  
  if (localTime > lastAnchor.t) {
    console.warn(`⚠️ Measure ${measure}: localTime ${localTime.toFixed(3)} > last anchor ${lastAnchor.t.toFixed(3)}, using last anchor x=${lastAnchor.x.toFixed(1)}`);
    return lastAnchor.x;
  }
  
  // Should never reach here
  console.error(`❌ Measure ${measure}: Failed to find position for t=${localTime.toFixed(3)}`);
  return firstAnchor.x;
}


function buildBeatTimeline(osmd: any): Beat[] {
  const beats: Beat[] = [];
  const sheet = osmd.Sheet;

  if (!sheet?.SourceMeasures) {
    console.error("❌ No source measures found");
    return beats;
  }

  const measures = sheet.SourceMeasures;
  const measurePositions = collectMeasurePositions(osmd);

  // Compute measure start times
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

  // Collect graphical entries
  const graphicalEntries = collectGraphicalEntries(osmd, measureStarts);
  const beatAnchors = buildBeatAnchors(osmd, graphicalEntries);

  graphicalEntries.sort((a, b) => a.absTime - b.absTime);

  console.log("🎼 Graphical entries:", graphicalEntries.length);

  // Build beats
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

      const sourceMeasure = measures[m];
      const measureDuration =
        sourceMeasure.Duration?.RealValue ??
        (sourceMeasure.ActiveTimeSignature.Numerator *
         (1 / sourceMeasure.ActiveTimeSignature.Denominator));

      const localTime = (beatTime - measureStarts[m]) / measureDuration;

      const x = getCursorX(beatAnchors, m, localTime);

      const measurePos = measurePositions.get(m);

      if (x != null && measurePos && x > measurePos.x + 5) {
        beat.staffEntryX = x;
        beat.staffEntryY = measurePos.y;
        beat.systemHeight = measurePos.height;
      }
      // Fallback case
      else if (measurePos) {
        const measureDur =
          measures[m].Duration?.RealValue ??
          (measures[m].ActiveTimeSignature.Numerator *
            (1 / measures[m].ActiveTimeSignature.Denominator));

        const local = (beatTime - measureStarts[m]) / measureDur;
        const clamped = Math.max(0, Math.min(1, local));

        beat.staffEntryX = measurePos.x + measurePos.width * clamped;
        beat.staffEntryY = measurePos.y;
        beat.systemHeight = measurePos.height;
      }

      beats.push(beat);
      absoluteTimestamp = absoluteTimestamp.Add(beatDuration);
    }
  }

  console.log(`✅ Built ${beats.length} beats`);

  enrichBeatsWithNotes(osmd, beats);

  return beats;
}


function collectGraphicalEntries(osmd: any, measureStarts: number[]) {
  const entries: {
    time: number;
    absTime: number;
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

  console.log("🔍 === COLLECTING GRAPHICAL ENTRIES ===");

  for (let m = 0; m < sheet.MeasureList.length; m++) {
    const staffMeasures = sheet.MeasureList[m];
    
    console.log(`📏 Measure ${m}:`);

    for (let i = 0; i < staffMeasures.length; i++) {
      const measure = staffMeasures[i];

      // Only first staff
      if (i !== 0) continue;

      if (!measure.PositionAndShape) continue;

      const measureX = measure.PositionAndShape.AbsolutePosition.x * unit;
      let measureWidth = measure.PositionAndShape.Size.width * unit;

      const rightBarline = measure.RightBarLine?.PositionAndShape?.AbsolutePosition?.x;
      if (rightBarline != null) {
        measureWidth = rightBarline * unit - measureX;
      }

      const system = measure.ParentMusicSystem;
      const top = system.StaffLines[0].PositionAndShape.AbsolutePosition.y * unit;
      const bottomStaff = system.StaffLines[system.StaffLines.length - 1];
      const bottom =
        (bottomStaff.PositionAndShape.AbsolutePosition.y +
          bottomStaff.PositionAndShape.Size.height) * unit;
      const height = bottom - top + 20;

      const sourceMeasure = sheet.ParentMusicSheet?.SourceMeasures?.[m];
      let measureDuration = 0;

      if (sourceMeasure?.Duration?.RealValue != null) {
        measureDuration = sourceMeasure.Duration.RealValue;
      } else {
        const ts = sourceMeasure?.ActiveTimeSignature;
        if (ts) {
          measureDuration = ts.Numerator * (1 / ts.Denominator);
        } else {
          measureDuration = 1;
        }
      }

      console.log(`   staffEntries count: ${measure.staffEntries?.length || 0}`);

      // ✅ COLLECT ALL NOTES (skip rests)
      let noteCount = 0;
      let hasNoteAtStart = false;

      for (const staffEntry of measure.staffEntries || []) {
        const localTime = staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
        if (localTime == null) continue;

        const pos = staffEntry.PositionAndShape?.AbsolutePosition;
        if (!pos) continue;

        // Check if this entry has actual notes (not rests)
        let hasActualNote = false;
        
        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const note of gve.notes || []) {
            const isRest = note.sourceNote?.isRest?.() || 
                          note.sourceNote?.IsRest || 
                          false;
            
            if (!isRest) {
              hasActualNote = true;
              break;
            }
          }
          if (hasActualNote) break;
        }

        if (!hasActualNote) {
          console.log(`   ⏭️ Skipping rest at t=${localTime.toFixed(3)}, x=${(pos.x * unit).toFixed(1)}px`);
          continue;
        }

        const absTime = measureStarts[m] + localTime;
        const normalizedTime = localTime / measureDuration;

        entries.push({
          time: normalizedTime,
          absTime,
          x: pos.x * unit,
          y: top,
          height,
          measureIndex: m
        });

        noteCount++;

        if (Math.abs(localTime) < 0.0001) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          hasNoteAtStart = true;
        }

        console.log(`   ✅ Note ${noteCount} at t=${normalizedTime.toFixed(3)} (local=${localTime.toFixed(3)}), x=${(pos.x * unit).toFixed(1)}px, rawTimestamp=${staffEntry.sourceStaffEntry?.Timestamp?.toString()}`);
      }

      console.log(`   Total notes collected: ${noteCount}`);

      // MEASURE END
      entries.push({
        time: 1,
        absTime: measureStarts[m] + measureDuration,
        x: measureX + measureWidth,
        y: top,
        height,
        measureIndex: m
      });
      console.log(`   📍 Added measure end at x=${(measureX + measureWidth).toFixed(1)}px`);
    }
  }

  console.log(`✅ Total entries before dedup: ${entries.length}`);

  // Remove duplicates
  const seen = new Set<string>();
  const filtered = entries.filter(e => {
    const key = `${e.measureIndex}_${e.absTime.toFixed(6)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✅ After deduplication: ${filtered.length} entries`);

  return filtered;
}

function buildBeatAnchors(
  osmd: any,
  graphicalEntries: any[]
) {
  const anchors = new Map<number, { t: number; x: number }[]>();

  const byMeasure = new Map<number, any[]>();


  



  for (const e of graphicalEntries) {
    if (!byMeasure.has(e.measureIndex)) {
      byMeasure.set(e.measureIndex, []);
    }
    byMeasure.get(e.measureIndex)!.push(e);
  }

  // Also get measure positions for comparison
  const graphicSheet = osmd.GraphicSheet;
  let unitInPixels = 10;
  if (osmd.drawer?.backend) {
    const innerElement = osmd.drawer.backend.getInnerElement?.();
    if (innerElement?.offsetWidth && graphicSheet?.ParentMusicSheet?.pageWidth) {
      unitInPixels = innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
    }
  }

  for (const [m, list] of byMeasure) {

    // ✅ Sort by LOCAL time
    list.sort((a, b) => a.time - b.time);

    const arr: { t: number; x: number }[] = [];

    // Separate measure end from actual notes
    const measureEnd = list.find(e => Math.abs(e.time - 1) < 0.0001);
    const notes = list.filter(e => Math.abs(e.time - 1) >= 0.0001);

    if (notes.length === 0) {
      // 🎯 FIX: Empty measure (all rests) - create proper anchors instead of skipping
      const measurePos = graphicSheet?.MeasureList?.[m]?.[0]?.PositionAndShape;
      
      if (measurePos?.AbsolutePosition?.x != null && measurePos?.Size?.width != null) {
        const startX = measurePos.AbsolutePosition.x * unitInPixels;
        const width = measurePos.Size.width * unitInPixels;
        const endX = measureEnd ? measureEnd.x : (startX + width);
        
        // Create anchors at measure boundaries for rest measures
        // This ensures smooth interpolation across rest measures
        arr.push({ t: 0, x: startX + 20 }); // Slight offset from barline
        arr.push({ t: 1, x: endX - 10 }); // Slight offset before next barline
        
        anchors.set(m, arr);
        console.log(`   ⚠️ Measure ${m}: Rest-only measure, anchors: t=0 x=${(startX + 10).toFixed(1)}, t=1 x=${(endX - 10).toFixed(1)}`);
      }
      continue;
    }

    const firstNote = notes[0];
    const lastNote = notes[notes.length - 1];

    // 🎯 Add measure start anchor (t=0) if needed
    if (firstNote.time > 0.0001) {
      // There's a rest at the beginning - add barline anchor
      const measurePos = graphicSheet?.MeasureList?.[m]?.[0]?.PositionAndShape;

      if (measurePos?.AbsolutePosition?.x != null) {
        const barX = measurePos.AbsolutePosition.x * unitInPixels;

        arr.push({
          t: 0,
          x: barX + 10 // Offset from barline
        });

        console.log(
          `   📍 Measure ${m}: Leading rest → bar anchor at t=0, x=${(barX + 10).toFixed(1)}`
        );
      }
    }

    // Add all note anchors
    for (const note of notes) {
      arr.push({
        t: note.time,
        x: note.x
      });
    }

    // 🎯 Add measure end anchor (t=1) if needed
    if (lastNote.time < 0.999) {
      if (measureEnd) {
        arr.push({ t: 1, x: measureEnd.x });
        console.log(`   📍 Measure ${m}: Added measure end at t=1, x=${measureEnd.x.toFixed(1)} (last note at t=${lastNote.time.toFixed(3)})`);
      } else if (notes.length >= 2) {
        // No explicit measure end - extrapolate from last notes
        const secondLast = notes[notes.length - 2];
        const spacing = (lastNote.x - secondLast.x) / (lastNote.time - secondLast.time);
        const endX = lastNote.x + (spacing * (1 - lastNote.time));
        arr.push({ t: 1, x: endX });
        console.log(`   📍 Measure ${m}: Extrapolated end at t=1, x=${endX.toFixed(1)}`);
      } else if (notes.length === 1) {
        // Single note in measure - use measure end position
        const measurePos = graphicSheet?.MeasureList?.[m]?.[0]?.PositionAndShape;
        if (measurePos?.AbsolutePosition?.x != null && measurePos?.Size?.width != null) {
          const measureEndX = (measurePos.AbsolutePosition.x + measurePos.Size.width) * unitInPixels;
          arr.push({ t: 1, x: measureEndX - 10 }); // Slight offset from barline
          console.log(`   📍 Measure ${m}: Single note measure, end at t=1, x=${(measureEndX - 10).toFixed(1)}`);
        }
      }
    }

    if (arr.length >= 2) {
      anchors.set(m, arr);
      
      console.log(`   ✅ Measure ${m} has ${arr.length} anchors: ${arr.map(a => `t=${a.t.toFixed(2)}, x=${a.x.toFixed(1)}`).join(' | ')}`);
    }
  }

  return anchors;
}







function enrichBeatsWithNotes(osmd: any, beats: Beat[]) {
  if (!osmd.cursor) {
    console.error("❌ OSMD cursor not available");
    return;
  }

  console.log("=== 🔧 ENRICHING BEATS WITH NOTES ===");

  // 🎯 FIX: Calculate measure start times for absolute time conversion
  const measures = osmd.Sheet?.SourceMeasures || [];
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

  osmd.cursor.reset();
  const iterator = osmd.cursor.Iterator;
  
  interface VoiceEntryInfo {
    absoluteTime: number;  // 🎯 FIXED: Changed from Fraction to absolute number
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
        // 🎯 FIXED: Convert measure-relative time to absolute time
        const relativeTime = timestamp.RealValue;
        const absoluteTime = measureStarts[measureIndex] + relativeTime;
        
        allVoiceEntries.push({
          absoluteTime: absoluteTime,  // 🎯 Now storing absolute time
          notes: notes,
          duration: maxDuration,
          measureIndex: measureIndex
        });
        
        console.log(`   📝 Note at measure ${measureIndex}, relative t=${relativeTime.toFixed(4)}, absolute t=${absoluteTime.toFixed(4)}, notes=${notes.join(',')}, duration=${maxDuration.toFixed(4)}`);
      }
    }
    
    iterator.moveToNext();
  }

  const EPSILON = 1e-6;
  
  console.log("🎹 === ASSIGNING NOTES TO BEATS ===");
  console.log(`   Total voice entries collected: ${allVoiceEntries.length}`);
  
  for (const beat of beats) {
    const beatTime = beat.timestamp.RealValue;
    
    // Find active notes
    const activeNotes: number[] = [];
    let isStart = false;
    let noteDuration = 0;
    
    for (const entry of allVoiceEntries) {
      const entryStart = entry.absoluteTime;  // 🎯 FIXED: Now using absolute time
      const entryEnd = entryStart + entry.duration;
      
      // Check if beat time falls within this note's duration
      if (beatTime >= entryStart - EPSILON && beatTime < entryEnd - EPSILON) {
        for (const note of entry.notes) {
          if (!activeNotes.includes(note)) {
            activeNotes.push(note);
          }
        }
        
        // Check if this is the exact start of a note
        if (Math.abs(beatTime - entryStart) < EPSILON) {
          isStart = true;
          noteDuration = entry.duration;
        }
      }
    }
    
    beat.expectedNotes = activeNotes;
    beat.isNoteStart = isStart;
    beat.noteDuration = noteDuration;
    
    // 🎯 Enhanced logging for debugging
    if (activeNotes.length > 0 && beat.index < 20) {
      console.log(`   🎵 Beat ${beat.index} (t=${beatTime.toFixed(4)}, measure ${beat.measureIndex}, beat ${beat.beatInMeasure}): notes=[${activeNotes.join(',')}], isStart=${isStart}, duration=${noteDuration.toFixed(4)}`);
    }
  }
  
  const validBeats = beats.filter(b => b.staffEntryX && b.staffEntryX > 0).length;
  const uniqueXPositions = new Set(beats.map(b => b.staffEntryX).filter(x => x !== undefined && x > 0));
  const beatsWithNotes = beats.filter(b => b.expectedNotes.length > 0).length;
  
  console.log(`✅ Enrichment complete:`);
  console.log(`   - ${validBeats}/${beats.length} beats have valid positions`);
  console.log(`   - ${uniqueXPositions.size} unique X positions found`);
  console.log(`   - ${beatsWithNotes} beats have expected notes`);
  
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
  this.cursorElement.setAttribute("rx", "4"); // Slightly more rounded corners
  this.cursorElement.setAttribute("ry", "4");
  
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

  // 🎯 FIX 1: Wider cursor to cover the note properly
  const cursorWidth = 25; // Increased from 28

  // 🎯 FIX 2: Center the cursor on the note, with slight left offset
  const x = beat.staffEntryX - 12; // Small offset to center on note head

  // 🎯 FIX 3: Extend cursor height to cover full system with padding
  const y = (beat.staffEntryY ?? 0) - 10; // Add padding above
  const height = (beat.systemHeight ?? 100) + 20; // Add padding above and below

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

  console.log(`🎯 Cursor at beat ${this.currentBeatIndex} (t=${beat.timestamp.RealValue.toFixed(4)}): X=${x.toFixed(1)} (staffEntryX=${beat.staffEntryX.toFixed(1)}), Y=${y.toFixed(1)}, Expected notes: [${beat.expectedNotes.join(',')}]`);

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
    if (!beat) {
      console.error('❌ No current beat found');
      return [];
    }

    console.log(`\n🔍 === findGraphicalNotesAtCurrentBeat CALLED ===`);
    console.log(`   Input MIDI note: ${midiNote}`);
    console.log(`   Current beat: ${beat.index} (measure ${beat.measureIndex}, beat ${beat.beatInMeasure})`);
    console.log(`   Beat timestamp (absolute): ${beat.timestamp.RealValue.toFixed(4)}`);
    console.log(`   Expected notes at this beat: [${beat.expectedNotes.map(ht => `${ht} (MIDI ${ht + 12})`).join(', ')}]`);

    const osmdHalfTone = midiNote - 12;
    console.log(`   Looking for halfTone: ${osmdHalfTone}`);

    const graphicSheet = this.osmd.GraphicSheet;
    const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
    
    if (!measureList) {
      console.error(`❌ No measure list found for measure ${beat.measureIndex}`);
      return [];
    }

    // 🎯 FIX: Calculate measure start time for absolute time conversion
    const measures = this.osmd.Sheet?.SourceMeasures || [];
    let measureStartTime = 0;
    
    for (let i = 0; i < beat.measureIndex; i++) {
      const m = measures[i];
      if (m.Duration?.RealValue != null) {
        measureStartTime += m.Duration.RealValue;
      } else {
        const ts = m.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };
        measureStartTime += ts.Numerator * (1 / ts.Denominator);
      }
    }

    console.log(`   Measure ${beat.measureIndex} starts at absolute time: ${measureStartTime.toFixed(4)}`);

    const matchingNotes: any[] = [];
    const beatTime = beat.timestamp.RealValue; // Absolute time
    const EPSILON = 1e-6;

    console.log(`\n   📋 Checking all staff entries in measure ${beat.measureIndex}:`);

    for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
      const measure = measureList[staffIdx];
      
      console.log(`   📝 Staff ${staffIdx}: ${measure.staffEntries?.length || 0} entries`);
      
      for (const staffEntry of measure.staffEntries || []) {
        // 🎯 FIX: Get relative time and convert to absolute time
        const relativeTime = staffEntry.timestamp?.RealValue ?? 
                            staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
        
        if (relativeTime === null || relativeTime === undefined) {
          console.log(`      ⏭️ Skipping entry with no timestamp`);
          continue;
        }
        
        // Convert to absolute time for comparison
        const absoluteEntryTime = measureStartTime + relativeTime;
        const timeDiff = Math.abs(absoluteEntryTime - beatTime);
        
        console.log(`      Entry: relativeT=${relativeTime.toFixed(4)}, absoluteT=${absoluteEntryTime.toFixed(4)}, targetT=${beatTime.toFixed(4)}, diff=${timeDiff.toFixed(6)}`);
        
        if (timeDiff > EPSILON) {
          console.log(`         ⏭️ Skipping - time difference too large (${timeDiff.toFixed(6)} > ${EPSILON})`);
          continue;
        }

        console.log(`         ✅ Time match! Checking notes...`);

        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const halfTone = gn.sourceNote?.halfTone;
            const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
            
            console.log(`            Note: halfTone=${halfTone}, MIDI=${halfTone + 12}, isRest=${isRest}, target=${osmdHalfTone}`);
            
            if (halfTone === osmdHalfTone) {
              matchingNotes.push(gn);
              console.log(`            🎯 MATCH FOUND!`);
            }
          }
        }
      }
    }

    console.log(`\n   ✅ Total matching notes found: ${matchingNotes.length}`);
    console.log(`=== END findGraphicalNotesAtCurrentBeat ===\n`);

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