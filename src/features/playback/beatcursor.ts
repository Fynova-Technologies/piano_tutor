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
    measureLeft?: number;
  measureRight?: number;
}

function collectMeasurePositions(
  osmd: any
): Map<number, { x: number; width: number; y: number; height: number }> {
  const map = new Map();
  const graphicSheet = osmd.GraphicSheet;

  if (!graphicSheet?.MeasureList) {
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
  console.log(`Unit conversion: ${unitInPixels.toFixed(2)} px/unit`);

  const systemGeometry = new Map<any, { top: number; height: number }>();
  // top-level, alongside getUnitInPixels


  function getSystemStaveBounds(measureList: any[]): { top: number; bottom: number } | null {
  let top = Infinity;
  let bottom = -Infinity;

  for (const measure of measureList || []) {
    const stave = measure?.stave;
    if (stave?.getYForLine && stave?.getBottomY) {
      const staveTop = stave.getYForLine(0);
      const staveBottom = stave.getBottomY();
      if (staveTop < top) top = staveTop;
      if (staveBottom > bottom) bottom = staveBottom;
    }
  }

  return top === Infinity ? null : { top, bottom };
}

  function getSystemGeometry(musicSystem: any) {
    if (!musicSystem) return { top: 0, height: 100 };
    if (systemGeometry.has(musicSystem)) return systemGeometry.get(musicSystem)!;

    let top = 0, height = 100;
    if (musicSystem.StaffLines?.length > 0) {
      const firstStaff = musicSystem.StaffLines[0];
      const lastStaff = musicSystem.StaffLines[musicSystem.StaffLines.length - 1];
      const firstY = (firstStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastY = (lastStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastHeight = (lastStaff.PositionAndShape?.Size?.height ?? 40) * unitInPixels;
      top = firstY;
      height = lastY + lastHeight - firstY + 20;
    }
    const geo = { top, height };
    systemGeometry.set(musicSystem, geo);
    return geo;
  }

  for (let measureIdx = 0; measureIdx < graphicSheet.MeasureList.length; measureIdx++) {
    const measureList = graphicSheet.MeasureList[measureIdx];
    if (!measureList || measureList.length === 0) continue;

    // ✅ Find first non-null measure instead of blindly taking [0]
    const measure = measureList.find((m: any) => m != null);
    if (!measure) continue;  // ← This was the missing guard

    const position = measure.PositionAndShape?.AbsolutePosition;
    const size = measure.PositionAndShape?.Size;

    if (!position?.x || !size?.width) continue;

     const musicSystem = measure.ParentMusicSystem;
const bounds = getSystemStaveBounds(measureList);
const xBounds = getRealMeasureXBounds(measureList); // ← new

let topY: number, sysHeight: number;
if (bounds) {
  topY = bounds.top - 10;
  sysHeight = bounds.bottom - bounds.top + 20;
} else {
  const geo = getSystemGeometry(musicSystem);
  topY = geo.top;
  sysHeight = geo.height;
}

let xPixels: number, widthPixels: number;
if (xBounds) {
  xPixels = xBounds.left;
  widthPixels = xBounds.right - xBounds.left;
} else {
  xPixels = position.x * unitInPixels;      // fallback only
  widthPixels = size.width * unitInPixels;  // fallback only
}

map.set(measureIdx, {
  x: xPixels,
  width: widthPixels,
  y: topY,
  height: sysHeight,
});


    let systemHeight = 100;
    let systemTopY = 0;

    if (musicSystem?.StaffLines?.length > 0) {
      const firstStaff = musicSystem.StaffLines[0];
      const lastStaff =
        musicSystem.StaffLines[musicSystem.StaffLines.length - 1];
      const firstY =
        (firstStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastY =
        (lastStaff.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
      const lastHeight =
        (lastStaff.PositionAndShape?.Size?.height ?? 40) * unitInPixels;
      systemTopY = firstY;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      systemHeight = lastY + lastHeight - firstY + 20;
    }


    // const { top, height } = getSystemGeometry(measure.ParentMusicSystem);

    // map.set(measureIdx, {
    //   x: xPixels,
    //   width: widthPixels,
    //   y: top,
    //   height: height,
    // });

    if (measureIdx < 10) {
      console.log(
        `Measure ${measureIdx}: X=${xPixels.toFixed(1)}px, Width=${widthPixels.toFixed(1)}px, Y=${systemTopY.toFixed(1)}px`
      );
    }
  }

  console.log(`✅ Collected ${map.size} measure positions`);
  return map;
}



// top-level helper, near the other functions
function getUnitInPixels(osmd: any): number {
  let unitInPixels = 10;
  const graphicSheet = osmd.GraphicSheet;
  if (osmd.drawer?.backend) {
    const innerElement = osmd.drawer.backend.getInnerElement?.();
    if (innerElement?.offsetWidth && graphicSheet?.ParentMusicSheet?.pageWidth) {
      unitInPixels = innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
    }
  }
  return unitInPixels;
}

function getCursorX(
  beatAnchors: Map<number, any[]>,
  measure: number,
  localTime: number
) {
  const anchors = beatAnchors.get(measure);
  if (!anchors || anchors.length < 2) {
    console.warn(
      `⚠️ Measure ${measure}: Insufficient anchors (${anchors?.length || 0})`
    );
    return null;
  }

  // Find the segment we're in
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];

    if (localTime >= a.t && localTime <= b.t) {
      // Interpolate between the two anchors
      const p = (localTime - a.t) / (b.t - a.t);
      const x = a.x + (b.x - a.x) * p;

      if (i === 0 && localTime < 0.001) {
        console.log(
          `🎯 Measure ${measure} at t=${localTime.toFixed(3)}: interpolated x=${x.toFixed(1)} (anchor at t=${a.t}, x=${a.x.toFixed(1)})`
        );
      }

      return x;
    }
  }

  // Improved fallback: handle times before first anchor or after last anchor
  const firstAnchor = anchors[0];
  const lastAnchor = anchors[anchors.length - 1];

  if (localTime < firstAnchor.t) {
    console.warn(
      `⚠️ Measure ${measure}: localTime ${localTime.toFixed(3)} < first anchor ${firstAnchor.t.toFixed(3)}, using first anchor x=${firstAnchor.x.toFixed(1)}`
    );
    return firstAnchor.x;
  }

  if (localTime > lastAnchor.t) {
    console.warn(
      `⚠️ Measure ${measure}: localTime ${localTime.toFixed(3)} > last anchor ${lastAnchor.t.toFixed(3)}, using last anchor x=${lastAnchor.x.toFixed(1)}`
    );
    return lastAnchor.x;
  }

  console.error(
    `❌ Measure ${measure}: Failed to find position for t=${localTime.toFixed(3)}`
  );
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

  const graphicalEntries = collectGraphicalEntries(osmd, measureStarts);
  const beatAnchors = buildBeatAnchors(osmd, graphicalEntries);

  // ✅ Step 1: Collect all note onset absolute times from cursor iterator
  const noteOnsetTimes = new Set<string>();

  if (osmd.cursor) {
    osmd.cursor.reset();
    const iterator = osmd.cursor.Iterator;
    let safety = 0;

    while (!iterator.EndReached && safety < 10000) {
      safety++;
      const measureIndex = iterator.CurrentMeasureIndex;
      const currentVoiceEntries = iterator.CurrentVoiceEntries;

      if (currentVoiceEntries?.length > 0) {
        const firstEntry = currentVoiceEntries[0];
        const relTime = firstEntry.Timestamp?.RealValue ?? 0;
        const absTime = measureStarts[measureIndex] + relTime;
        noteOnsetTimes.add(absTime.toFixed(6));
      }

      iterator.moveToNext();
    }

    osmd.cursor.hide();
  }

  console.log(`🎼 Found ${noteOnsetTimes.size} unique note onsets`);

  // ✅ Step 2: Build merged timeline — beat grid + note onsets
  // Collect all unique absolute times
  const allTimestamps = new Map<string, { absTime: number; measureIndex: number; isNoteOnset: boolean }>();

  for (let m = 0; m < measures.length; m++) {
  const measure = measures[m];
  const ts = measure.ActiveTimeSignature || { Numerator: 4, Denominator: 4 };
  const beatsPerMeasure = ts.Numerator;
  const beatDuration = 1 / ts.Denominator;

  for (let b = 0; b < beatsPerMeasure; b++) {
    const absTime = measureStarts[m] + b * beatDuration;
    const key = absTime.toFixed(6);
    if (!allTimestamps.has(key)) {
      allTimestamps.set(key, {
        absTime,
        measureIndex: m,
        isNoteOnset: noteOnsetTimes.has(key),
      });
    }
  }
}

  // Add note onsets that fall between beats (subdivisions like 8th/16th notes)
  if (osmd.cursor) {
    osmd.cursor.reset();
    const iterator = osmd.cursor.Iterator;
    let safety = 0;

    while (!iterator.EndReached && safety < 10000) {
      safety++;
      const measureIndex = iterator.CurrentMeasureIndex;
      const currentVoiceEntries = iterator.CurrentVoiceEntries;

      if (currentVoiceEntries?.length > 0) {
        const firstEntry = currentVoiceEntries[0];
        const relTime = firstEntry.Timestamp?.RealValue ?? 0;
        const absTime = measureStarts[measureIndex] + relTime;
        const key = absTime.toFixed(6);

        if (!allTimestamps.has(key)) {
          allTimestamps.set(key, {
            absTime,
            measureIndex,
            isNoteOnset: true,
          });
        }
      }

      iterator.moveToNext();
    }

    osmd.cursor.hide();
  }

  // ✅ Step 3: Sort all timestamps and build Beat objects
  const sortedEntries = [...allTimestamps.values()].sort(
    (a, b) => a.absTime - b.absTime
  );

  let beatIndex = 0;

  

  for (const entry of sortedEntries) {
    const { absTime, measureIndex, isNoteOnset } = entry;
    const measure = measures[measureIndex];
    const ts = measure.ActiveTimeSignature || {
      Numerator: 4,
      Denominator: 4,
    };
    const beatDuration = 1 / ts.Denominator;
    const relTime = absTime - measureStarts[measureIndex];
    const beatInMeasure = relTime / beatDuration;

    const measureDuration =
      measure.Duration?.RealValue ??
      ts.Numerator * (1 / ts.Denominator);

    const localTime = relTime / measureDuration;
    const x = getCursorX(beatAnchors, measureIndex, localTime);
   const measurePos = measurePositions.get(measureIndex);

const beat: Beat = {
  index: beatIndex++,
  measureIndex,
  beatInMeasure,
  timestamp: new Fraction(Math.round(absTime * 1920), 1920),
  expectedNotes: [],
  isNoteStart: isNoteOnset,
  noteDuration: 0,
  measureLeft: measurePos?.x,
  measureRight: measurePos ? measurePos.x + measurePos.width : undefined,
};


    if (x != null && measurePos && x > measurePos.x + 5) {
      beat.staffEntryX = x;
      beat.staffEntryY = measurePos.y;
      beat.systemHeight = measurePos.height;
    } else if (measurePos) {
      const clamped = Math.max(0, Math.min(1, localTime));
      beat.staffEntryX = measurePos.x + measurePos.width * clamped;
      beat.staffEntryY = measurePos.y;
      beat.systemHeight = measurePos.height;
    }

    beats.push(beat);
  }

  console.log(`✅ Built ${beats.length} merged beats (grid + onsets)`);
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

    for (const measure of staffMeasures || []) {
  if (!measure || !measure.PositionAndShape) continue;

      const measureX = measure.PositionAndShape.AbsolutePosition.x * unit;
      let measureWidth = measure.PositionAndShape.Size.width * unit;

      const rightBarline =
        measure.RightBarLine?.PositionAndShape?.AbsolutePosition?.x;
      if (rightBarline != null) {
        measureWidth = rightBarline * unit - measureX;
      }

      const system = measure.ParentMusicSystem;
      const top =
        system.StaffLines[0].PositionAndShape.AbsolutePosition.y * unit;
      const bottomStaff =
        system.StaffLines[system.StaffLines.length - 1];
      const bottom =
        (bottomStaff.PositionAndShape.AbsolutePosition.y +
          bottomStaff.PositionAndShape.Size.height) *
          unit;
      const height = bottom - top + 20;

      const sourceMeasure =
        sheet.ParentMusicSheet?.SourceMeasures?.[m];
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

      console.log(
        `  staffEntries count: ${measure.staffEntries?.length || 0}`
      );

      // Collect all notes (skip rests)
      const noteCount = 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const hasNoteAtStart = false;

      for (const staffEntry of measure.staffEntries || []) {
  const localTime = staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
  if (localTime == null) continue;

  const pos = staffEntry.PositionAndShape?.AbsolutePosition;
  if (!pos) continue;

  let hasActualNote = false;
  let x = pos.x * unit; // fallback only

  for (const gve of staffEntry.graphicalVoiceEntries || []) {
    for (const note of gve.notes || []) {
      const isRest = note.sourceNote?.isRest?.() || note.sourceNote?.IsRest || false;
      if (isRest) continue;

      hasActualNote = true;

      // ✅ Use the actual rendered notehead's bbox — same technique as drawFeedbackDot
      const vfNote = Array.isArray(note?.vfnote) ? note.vfnote[0] : note?.vfnote;
      const noteEl: SVGGraphicsElement | null = vfNote?.attrs?.el ?? null;
      if (noteEl) {
        const notehead =
          (noteEl.querySelector(".vf-notehead") as SVGGraphicsElement) ??
          (noteEl.querySelector("path") as SVGGraphicsElement) ??
          (noteEl.querySelector("use") as SVGGraphicsElement);
        try {
          const bbox = (notehead ?? noteEl).getBBox();
          x = bbox.x + bbox.width / 2;
        } catch {
          // element not measurable yet — keep fallback x
        }
      }
      break;
    }
    if (hasActualNote) break;
  }

  if (!hasActualNote) {
    console.log(`  ⏭️ Skipping rest at t=${localTime.toFixed(3)}, x=${(pos.x * unit).toFixed(1)}px`);
    continue;
  }

  const absTime = measureStarts[m] + localTime;
  const normalizedTime = localTime / measureDuration;

  entries.push({
    time: normalizedTime,
    absTime,
    x,
    y: top,
    height,
    measureIndex: m,
  });

  console.log(
    `  ✅ Note at t=${normalizedTime.toFixed(3)} (local=${localTime.toFixed(3)}), x=${x.toFixed(1)}px (bbox-based)`
  );
}

      console.log(`  Total notes collected: ${noteCount}`);

      // Measure end
      entries.push({
        time: 1,
        absTime: measureStarts[m] + measureDuration,
        x: measureX + measureWidth,
        y: top,
        height,
        measureIndex: m,
      });

      console.log(
        `  📍 Added measure end at x=${(measureX + measureWidth).toFixed(1)}px`
      );
    }
  }

  console.log(`✅ Total entries before dedup: ${entries.length}`);

  // Remove duplicates
  const seen = new Set<string>();
  const filtered = entries.filter((e) => {
    const key = `${e.measureIndex}_${e.time.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✅ After deduplication: ${filtered.length} entries`);
  return filtered;
}

function getRealMeasureXBounds(measureList: any[]): { left: number; right: number } | null {
  for (const measure of measureList || []) {
    const stave = measure?.stave;
    if (stave?.x != null && stave?.width != null) {
      return { left: stave.x, right: stave.x + stave.width };
    }
  }
  return null;
}

function buildBeatAnchors(osmd: any, graphicalEntries: any[]) {
  const anchors = new Map<number, { t: number; x: number }[]>();
  const byMeasure = new Map<number, any[]>();

  for (const e of graphicalEntries) {
    if (!byMeasure.has(e.measureIndex)) {
      byMeasure.set(e.measureIndex, []);
    }
    byMeasure.get(e.measureIndex)!.push(e);
  }

  const graphicSheet = osmd.GraphicSheet;
  let unitInPixels = 10;
  if (osmd.drawer?.backend) {
    const innerElement = osmd.drawer.backend.getInnerElement?.();
    if (
      innerElement?.offsetWidth &&
      graphicSheet?.ParentMusicSheet?.pageWidth
    ) {
      unitInPixels =
        innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
    }
  }

  for (const [m, list] of byMeasure) {
    // Merge entries with same time (take leftmost X)
    const merged = new Map<number, number>();
    for (const e of list) {
      const t = Number(e.time.toFixed(4));
      if (!merged.has(t)) {
        merged.set(t, e.x);
      } else {
        merged.set(t, Math.min(merged.get(t)!, e.x));
      }
    }

    const mergedList = [...merged.entries()].map(([t, x]) => ({
      time: t,
      x,
    }));
    list.length = 0;
    list.push(...mergedList);

    // Sort by local time
    list.sort((a, b) => a.time - b.time);

    const arr: { t: number; x: number }[] = [];

    const measureEnd = list.find((e) => Math.abs(e.time - 1) < 0.0001);
    const notes = list.filter((e) => Math.abs(e.time - 1) >= 0.0001);

    if (notes.length === 0) {
  const measureRow = graphicSheet?.MeasureList?.[m];
  const xBounds = getRealMeasureXBounds(measureRow);

  let startX: number, endXFallback: number;
  if (xBounds) {
    startX = xBounds.left;
    endXFallback = xBounds.right;
  } else {
    const measurePos = measureRow?.[0]?.PositionAndShape;
    if (!measurePos?.AbsolutePosition?.x || !measurePos?.Size?.width) continue;
    startX = measurePos.AbsolutePosition.x * unitInPixels;
    endXFallback = startX + measurePos.Size.width * unitInPixels;
  }

  const endX = measureEnd ? measureEnd.x : endXFallback;

  arr.push({ t: 0, x: startX + unitInPixels * 2 });
  arr.push({ t: 1, x: endX - unitInPixels * 1 });
  anchors.set(m, arr);
  continue;
}

    const firstNote = notes[0];
    const lastNote = notes[notes.length - 1];

    // Add measure start anchor (t=0) if needed
    if (firstNote.time > 0.0001) {
  const measureRow = graphicSheet?.MeasureList?.[m];
  const xBounds = getRealMeasureXBounds(measureRow);
  const barX = xBounds
    ? xBounds.left
    : (measureRow?.[0]?.PositionAndShape?.AbsolutePosition?.x ?? 0) * unitInPixels;
  arr.push({ t: 0, x: barX + unitInPixels * 1 });
}

    // Add all note anchors
    for (const note of notes) {
      arr.push({ t: note.time, x: note.x });
    }

    // Add measure end anchor (t=1) if needed
    if (lastNote.time < 0.999) {
      if (measureEnd) {
        arr.push({ t: 1, x: measureEnd.x });
        console.log(
          `📍 Measure ${m}: Added measure end at t=1, x=${measureEnd.x.toFixed(1)} (last note at t=${lastNote.time.toFixed(3)})`
        );
      } else if (notes.length >= 2) {
        const secondLast = notes[notes.length - 2];
        const spacing =
          (lastNote.x - secondLast.x) /
          (lastNote.time - secondLast.time);
        const endX = lastNote.x + spacing * (1 - lastNote.time);
        arr.push({ t: 1, x: endX });
        console.log(
          `📍 Measure ${m}: Extrapolated end at t=1, x=${endX.toFixed(1)}`
        );
      } else if (notes.length === 1) {
  const measureRow = graphicSheet?.MeasureList?.[m];
  const xBounds = getRealMeasureXBounds(measureRow);
  const measureEndX = xBounds
    ? xBounds.right
    : ((measureRow?.[0]?.PositionAndShape?.AbsolutePosition?.x ?? 0) +
       (measureRow?.[0]?.PositionAndShape?.Size?.width ?? 0)) * unitInPixels;
  arr.push({ t: 1, x: measureEndX - unitInPixels * 1 });
}
    }

    if (arr.length >= 2) {
      anchors.set(m, arr);
      console.log(
        `✅ Measure ${m} has ${arr.length} anchors: ${arr
          .map((a) => `t=${a.t.toFixed(2)}, x=${a.x.toFixed(1)}`)
          .join(" | ")}`
      );
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

  // Calculate measure start times for absolute time conversion
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
    absoluteTime: number;
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

          if (
            typeof halfTone === "number" &&
            !isRest &&
            !notes.includes(halfTone)
          ) {
            notes.push(halfTone);
          }
        }
      }

      if (notes.length > 0) {
        // Convert measure-relative time to absolute time
        const relativeTime = timestamp.RealValue;
        const absoluteTime = measureStarts[measureIndex] + relativeTime;

        allVoiceEntries.push({
          absoluteTime,
          notes,
          duration: maxDuration,
          measureIndex,
        });

        console.log(
          `📝 Note at measure ${measureIndex}, relative t=${relativeTime.toFixed(4)}, absolute t=${absoluteTime.toFixed(4)}, notes=${notes.join(",")}, duration=${maxDuration.toFixed(4)}`
        );
      }
    }

    iterator.moveToNext();
  }

  const EPSILON = 1e-6;

  console.log("🎹 === ASSIGNING NOTES TO BEATS ===");
  console.log(`Total voice entries collected: ${allVoiceEntries.length}`);

  for (const beat of beats) {
    const beatTime = beat.timestamp.RealValue;
    const activeNotes: number[] = [];
    let isStart = false;
    let noteDuration = 0;

    for (const entry of allVoiceEntries) {
      const entryStart = entry.absoluteTime;
      const entryEnd = entryStart + entry.duration;

      if (
        beatTime >= entryStart - EPSILON &&
        beatTime < entryEnd - EPSILON
      ) {
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

    if (activeNotes.length > 0 && beat.index < 20) {
      console.log(
        `🎵 Beat ${beat.index} (t=${beatTime.toFixed(4)}, measure ${beat.measureIndex}, beat ${beat.beatInMeasure}): notes=[${activeNotes.join(",")}], isStart=${isStart}, duration=${noteDuration.toFixed(4)}`
      );
    }
  }

  const validBeats = beats.filter(
    (b) => b.staffEntryX && b.staffEntryX > 0
  ).length;
  const uniqueXPositions = new Set(
    beats.map((b) => b.staffEntryX).filter((x) => x !== undefined && x > 0)
  );
  const beatsWithNotes = beats.filter(
    (b) => b.expectedNotes.length > 0
  ).length;

  console.log(`✅ Enrichment complete:`);
  console.log(`  - ${validBeats}/${beats.length} beats have valid positions`);
  console.log(`  - ${uniqueXPositions.size} unique X positions found`);
  console.log(`  - ${beatsWithNotes} beats have expected notes`);

  osmd.cursor.hide();
}

export class BeatCursor {
  private osmd: any;
  private beats: Beat[];
  private currentBeatIndex: number = 0;
  private cursorElement: SVGRectElement | null = null;
  private isVisible: boolean = true;
  private isPlaying: boolean = false;
  private transposeOffset: number = 0;
  private unitInPixels: number = 10;
  private cursorAnimFrame: number | null = null;
  private lastSystemY: number | null = null;

private scrollToSystemIfChanged(currentY: number) {
  if (this.lastSystemY === null || Math.abs(currentY - this.lastSystemY) > 5) {
    this.lastSystemY = currentY;

    if (!this.cursorElement) return;
    try {
      this.cursorElement.scrollIntoView({
        behavior: "smooth",
        block: "center",   // keeps the new line comfortably in view, away from your fixed footer
        inline: "nearest", // don't fight with the horizontal scrollIntoView below
      });
    } catch {
      // older browsers without smooth-scroll options support — silently skip
    }
  }
}

private animateCursorTo(targetX: number, targetY: number, targetWidth: number, targetHeight: number, duration = 90) {
  if (!this.cursorElement) return;
  if (this.cursorAnimFrame) cancelAnimationFrame(this.cursorAnimFrame);

  const el = this.cursorElement;
  const startX = parseFloat(el.getAttribute("x") || `${targetX}`);
  const startY = parseFloat(el.getAttribute("y") || `${targetY}`);
  const startWidth = parseFloat(el.getAttribute("width") || `${targetWidth}`);
  const startHeight = parseFloat(el.getAttribute("height") || `${targetHeight}`);
  const startTime = performance.now();

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const step = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const e = easeOutCubic(t);

    el.setAttribute("x", (startX + (targetX - startX) * e).toString());
    el.setAttribute("y", (startY + (targetY - startY) * e).toString());
    el.setAttribute("width", (startWidth + (targetWidth - startWidth) * e).toString());
    el.setAttribute("height", (startHeight + (targetHeight - startHeight) * e).toString());

    if (t < 1) {
      this.cursorAnimFrame = requestAnimationFrame(step);
    } else {
      this.cursorAnimFrame = null;
    }
  };

  this.cursorAnimFrame = requestAnimationFrame(step);
}



  constructor(osmd: any) {
    this.osmd = osmd;
    this.transposeOffset = 12; // ✅ ADD THIS LINE - OSMD halfTone = midi - 12, always
    this.unitInPixels = getUnitInPixels(osmd); // ← add this
    if (!osmd.cursor) {
      console.error("❌ OSMD cursor not initialized");
      this.beats = [];
      return;
    }

    this.beats = buildBeatTimeline(osmd);
    this.createCursorElement();

    console.log(`✅ BeatCursor ready: ${this.beats.length} beats`);
    console.log(
      `First 8 X positions: [${this.beats
        .slice(0, 8)
        .map((b) => b.staffEntryX?.toFixed(1) || "N/A")
        .join(", ")}]`
    );
  }

  findClosestGraphicalNoteAtBeat(midi: number): any | null {
    const beat = this.getCurrentBeat();
    if (!beat) return null;

    const targetHT = midi - this.transposeOffset;
    const graphicSheet = this.osmd.GraphicSheet;
    const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
    if (!measureList) return null;

    let best = null;
    let min = Infinity;

    for (const measure of measureList) {
      for (const staffEntry of measure.staffEntries || []) {
        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const ht = gn.sourceNote?.halfTone;
            if (ht == null) continue;
            const d = Math.abs(ht - targetHT);
            if (d < min) {
              min = d;
              best = gn;
            }
          }
        }
      }
    }

    return best;
  }

  private createCursorElement() {
    const svg = this.osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) {
      console.error("❌ No SVG element found");
      return;
    }

    const existing = document.getElementById("custom-beat-cursor");
    if (existing) existing.remove();

    this.cursorElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    this.cursorElement.setAttribute("fill", "rgba(255, 0, 0, 0.15)");
    this.cursorElement.setAttribute("stroke", "#FF0000");
    this.cursorElement.setAttribute("stroke-width", "2");
    this.cursorElement.setAttribute("opacity", "0.8");
    this.cursorElement.setAttribute("id", "custom-beat-cursor");
    this.cursorElement.style.pointerEvents = "none";
    this.cursorElement.setAttribute("rx", "4");
    this.cursorElement.setAttribute("ry", "4");

    svg.appendChild(this.cursorElement);
    this.updateCursorPosition();
  }

private updateCursorPosition(animate: boolean = false, animMs?: number) {  
  if (!this.cursorElement) return;
  if (!this.isVisible) {
    this.cursorElement.setAttribute("display", "none");
    return;
  }

  const beat = this.beats[this.currentBeatIndex];
  if (!beat?.staffEntryX || beat.staffEntryX <= 0) return;

  this.cursorElement.setAttribute("display", "block");

  const margin = this.unitInPixels * 0.5;
  let width = this.unitInPixels * 2.5;

  if (beat.measureLeft != null && beat.measureRight != null) {
    const available = beat.measureRight - beat.measureLeft - margin * 2;
    if (available > 0 && available < width) {
      width = available;
    }
  }

  let x = beat.staffEntryX - width / 2;
  if (beat.measureLeft != null) x = Math.max(x, beat.measureLeft + margin);
  if (beat.measureRight != null) x = Math.min(x, beat.measureRight - width - margin);

  const y = (beat.staffEntryY ?? 0) - 10;
  const height = (beat.systemHeight ?? 100) + 20;

  if (animate) {
    this.animateCursorTo(x, y, width, height, animMs ?? 90);
  } else {
    if (this.cursorAnimFrame) {
      cancelAnimationFrame(this.cursorAnimFrame);
      this.cursorAnimFrame = null;
    }
    this.cursorElement.setAttribute("x", x.toString());
    this.cursorElement.setAttribute("y", y.toString());
    this.cursorElement.setAttribute("width", width.toString());
    this.cursorElement.setAttribute("height", height.toString());
  }

  const parent = this.cursorElement.parentNode;
  if (parent) {
    parent.removeChild(this.cursorElement);
    parent.appendChild(this.cursorElement);
  }

  this.scrollIntoView(beat.staffEntryX);         // existing: horizontal, same-line
  this.scrollToSystemIfChanged(beat.staffEntryY ?? 0);
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

  next(animMs?: number): boolean {
  if (this.currentBeatIndex >= this.beats.length - 1) {
    return false;
  }
  this.currentBeatIndex++;
  this.updateCursorPosition(true, animMs);
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
    this.unitInPixels = getUnitInPixels(this.osmd); // ← add this
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

  getBeatDurationInQuarters(beatIndex: number): number {
  const beat = this.beats[beatIndex];
  const next = this.beats[beatIndex + 1];
  if (!beat || !next) return 1; // fallback: one quarter note

  // timestamp.RealValue: 1.0 = whole note, so ×4 converts to quarter-note units
  const diff = (next.timestamp.RealValue - beat.timestamp.RealValue) * 4;
  return Math.max(diff, 0.0625); // guard against 0/negative
}

  setPosition(beatIndex: number) {
    if (beatIndex >= 0 && beatIndex < this.beats.length) {
      this.currentBeatIndex = beatIndex;
      console.log(`📍 Set position to beat ${beatIndex}`);
      this.updateCursorPosition();
    } else {
      console.error(
        `❌ Invalid beat index: ${beatIndex} (valid range: 0-${this.beats.length - 1})`
      );
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
    return this.getCurrentExpectedNotes().map(
      (ht) => ht + this.transposeOffset
    );
  }

  isCurrentBeatNoteStart(): boolean {
    const beat = this.getCurrentBeat();
    return beat?.isNoteStart ?? false;
  }

findGraphicalNotesAtCurrentBeat(midiNote: number, staffIndexFilter?: number): any[] {
  const beat = this.getCurrentBeat();
  if (!beat) return [];

  const osmdHalfTone = midiNote - this.transposeOffset;

  const graphicSheet = this.osmd.GraphicSheet;
  const measures = this.osmd.Sheet?.SourceMeasures || [];

  let measureStartTime = 0;
  for (let i = 0; i < beat.measureIndex; i++) {
    const m = measures[i];
    measureStartTime += m.Duration?.RealValue ??
      (m.ActiveTimeSignature.Numerator * (1 / m.ActiveTimeSignature.Denominator));
  }

  const beatTime = beat.timestamp.RealValue;
  const EPSILON = 1e-2;
  const matchingNotes: any[] = [];

  const measureList = graphicSheet.MeasureList?.[beat.measureIndex];
  if (!measureList) return [];

  for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
    // ✅ Skip staves we don't want
    if (staffIndexFilter !== undefined && staffIdx !== staffIndexFilter) continue;

    const measure = measureList[staffIdx];

    for (const staffEntry of measure.staffEntries || []) {
      const relativeTime = staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
      if (relativeTime == null) continue;

      const absoluteEntryTime = measureStartTime + relativeTime;
      if (Math.abs(absoluteEntryTime - beatTime) > EPSILON) continue;

      for (const gve of staffEntry.graphicalVoiceEntries || []) {
        for (const gn of gve.notes || []) {
          const halfTone = gn.sourceNote?.halfTone;
          const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
          if (isRest) continue;

          if (halfTone === osmdHalfTone) {
            matchingNotes.push(gn);
          }
        }
      }
    }
  }

  return matchingNotes;
}

setInterpolatedPosition(progress: number) {
  if (!this.cursorElement) return;

  const currentBeat = this.beats[this.currentBeatIndex];
  const nextBeat = this.beats[this.currentBeatIndex + 1];
  if (!currentBeat?.staffEntryX) return;

  const margin = this.unitInPixels * 0.5;

  const widthFor = (beat: Beat) => {
    let w = this.unitInPixels * 2.5;
    if (beat.measureLeft != null && beat.measureRight != null) {
      const available = beat.measureRight - beat.measureLeft - margin * 2;
      if (available > 0 && available < w) w = available;
    }
    return w;
  };

  const clampX = (rawX: number, beat: Beat, width: number) => {
    let x = rawX;
    if (beat.measureLeft != null) x = Math.max(x, beat.measureLeft + margin);
    if (beat.measureRight != null) x = Math.min(x, beat.measureRight - width - margin);
    return x;
  };

  const currentWidth = widthFor(currentBeat);
  const currentX = clampX(currentBeat.staffEntryX - currentWidth / 2, currentBeat, currentWidth);

  const nextX = (nextBeat?.staffEntryX && nextBeat.staffEntryY === currentBeat.staffEntryY)
    ? clampX(nextBeat.staffEntryX - widthFor(nextBeat) / 2, nextBeat, widthFor(nextBeat))
    : currentX;

  // ✅ progress already goes 0→1 across the full beat — no early arrival
  const interpolatedX = currentX + (nextX - currentX) * progress;
  this.cursorElement.setAttribute("x", interpolatedX.toString());
}

flashCorrect() {
  if (!this.cursorElement) return;
  this.cursorElement.setAttribute("fill", "rgba(76, 175, 80, 0.35)");
  this.cursorElement.setAttribute("stroke", "#4caf50");
  this.cursorElement.setAttribute("stroke-width", "2.5");
}

flashIncorrect() {
  if (!this.cursorElement) return;
  this.cursorElement.setAttribute("fill", "rgba(244, 67, 54, 0.35)");
  this.cursorElement.setAttribute("stroke", "#f44336");
  this.cursorElement.setAttribute("stroke-width", "2.5");
}

setDefaultColor(beatIndex: number) {
  if (!this.cursorElement) return;
  const beat = this.beats[beatIndex];
  if (!beat) return;

  if (beat.isNoteStart && beat.expectedNotes.length > 0) {
    // Beat has notes — bright red, fully opaque
    this.cursorElement.setAttribute("fill", "rgba(255, 0, 0, 0.20)");
    this.cursorElement.setAttribute("stroke", "#FF0000");
    this.cursorElement.setAttribute("stroke-width", "2.5");
    this.cursorElement.setAttribute("opacity", "0.9");
  } else if (beat.expectedNotes.length > 0) {
    // Mid-note beat — softer orange
    this.cursorElement.setAttribute("fill", "rgba(255, 165, 0, 0.15)");
    this.cursorElement.setAttribute("stroke", "#FF8800");
    this.cursorElement.setAttribute("stroke-width", "2");
    this.cursorElement.setAttribute("opacity", "0.5");
  } else {
    // Rest beat — gray, very subtle
    this.cursorElement.setAttribute("fill", "rgba(128, 128, 128, 0.10)");
    this.cursorElement.setAttribute("stroke", "#888888");
    this.cursorElement.setAttribute("stroke-width", "1.5");
    this.cursorElement.setAttribute("opacity", "0.25");
  }
}

getExpectedNotesByStaff(): { treble: number[], bass: number[] } {
  const beat = this.getCurrentBeat();
  if (!beat) return { treble: [], bass: [] };

  const graphicSheet = this.osmd.GraphicSheet;
  const measures = this.osmd.Sheet?.SourceMeasures || [];

  let measureStartTime = 0;
  for (let i = 0; i < beat.measureIndex; i++) {
    const m = measures[i];
    measureStartTime += m.Duration?.RealValue ??
      (m.ActiveTimeSignature.Numerator * (1 / m.ActiveTimeSignature.Denominator));
  }

  const beatTime = beat.timestamp.RealValue;
  const EPSILON = 1e-2;
  const measureList = graphicSheet.MeasureList?.[beat.measureIndex];

  const result = { treble: [] as number[], bass: [] as number[] };
  if (!measureList) return result;

  for (let staffIdx = 0; staffIdx < measureList.length; staffIdx++) {
    const measure = measureList[staffIdx];
    for (const staffEntry of measure.staffEntries || []) {
      const relativeTime = staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
      if (relativeTime == null) continue;
      if (Math.abs(measureStartTime + relativeTime - beatTime) > EPSILON) continue;

      for (const gve of staffEntry.graphicalVoiceEntries || []) {
        for (const gn of gve.notes || []) {
          const ht = gn.sourceNote?.halfTone;
          const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
          if (isRest || ht == null) continue;
          const midi = ht + this.transposeOffset;
          if (staffIdx === 0) result.treble.push(midi);
          else result.bass.push(midi);
        }
      }
    }
  }

  return result;
}
}



export function useBeatCursor(
  osmdRef: React.MutableRefObject<any>
) {
  const [beatCursor, setBeatCursor] = React.useState<BeatCursor | null>(null);
  const [currentBeatIndex, setCurrentBeatIndex] = React.useState(0);
  const [totalBeats, setTotalBeats] = React.useState(0);

  React.useEffect(() => {
  const osmd = osmdRef.current;

  if (!osmd || !osmd.Sheet || !osmd.GraphicSheet) {
    console.log("⏳ OSMD not ready yet...");
    return;
  }

  console.log("🎬 Initializing BeatCursor AFTER OSMD ready");

  const cursor = new BeatCursor(osmd);
  setBeatCursor(cursor);
  setTotalBeats(cursor.getTotalBeats());

  return () => {
    cursor.destroy();
  };
}, [osmdRef.current?.GraphicSheet]);

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
    refreshPositions,
  };
}