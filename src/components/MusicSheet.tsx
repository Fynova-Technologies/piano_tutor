"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

/**
 * EventNotes groups notes that align vertically across staves (both clefs).
 */
export type EventNotes = {
  notes: string[]; // ["C4", "E4"]
  notesSet: Set<string>;
  graphicalNoteRefs: any[]; // OSMD graphical note objects to color
};

export type MusicSheetHandle = {
  highlightEvent: (index: number) => void;
  markEvent: (index: number, correct: boolean) => void;
  playEvent?: (index: number) => Promise<void>;
};

interface Props {
  filePath: string;
  onExtracted?: (events: EventNotes[]) => void;
  controlledIndex?: number;
  onSliderChange?: (v: number) => void;
}

/**
 * MusicSheet:
 * - Renders OSMD once
 * - Extracts vertical events from OSMD's Sheet (SourceMeasures) and attempts to map to graphical notes
 * - Renders an overlay slider at the bottom of the rendered sheet
 * - Exposes highlightEvent & markEvent via ref
 */
const MusicSheet = forwardRef<MusicSheetHandle, Props>(
  ({ filePath, onExtracted, controlledIndex = 0, onSliderChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
    const [events, setEvents] = useState<EventNotes[]>([]);
    const [sliderMax, setSliderMax] = useState(0);
    const [sliderVal, setSliderVal] = useState(0);

    // helper: midi number -> name (C4)
    const midiToName = (m: number) => {
      const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const oct = Math.floor(m / 12) - 1;
      const name = names[((m % 12) + 12) % 12];
      return `${name}${oct}`;
    };

    // initialize OSMD once
    useEffect(() => {
      let cancelled = false;
      async function init() {
        if (!containerRef.current) return;
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: true,
          backgroundColor: "#ffffff",
        });
        osmdRef.current = osmd;
        try {
          await osmd.load(filePath);
          await osmd.render();
        } catch (e) {
          console.error("OSMD load/render error:", e);
          return;
        }

        // Extract vertical events
        const extracted: EventNotes[] = [];
        try {
          const sheetAny = (osmd as any).Sheet;
          const srcMeasures = sheetAny?.SourceMeasures || [];
          for (const measure of srcMeasures) {
            const vss = measure.VerticalSourceStaffEntries || [];
            for (const vs of vss) {
              const notesHere: { midi?: number; source?: any }[] = [];
              if (vs.Notes && vs.Notes.length > 0) {
                for (const sNote of vs.Notes) {
                  let midi: number | undefined = undefined;
                  if (typeof sNote.halfTone === "number") midi = sNote.halfTone;
                  else if (sNote.Pitch && typeof sNote.Pitch.HalfTone === "number")
                    midi = sNote.Pitch.HalfTone;
                  else if (typeof sNote.MidiPitch === "number") midi = sNote.MidiPitch;
                  else if (sNote.Step && typeof sNote.Octave === "number") {
                    // compute
                    const stepMap: Record<string, number> = {
                      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
                    };
                    const alter = sNote.Alter ?? 0;
                    const base = stepMap[sNote.Step] ?? 0;
                    midi = (sNote.Octave + 1) * 12 + base + alter;
                  }
                  if (typeof midi === "number") notesHere.push({ midi, source: sNote });
                }
              }
              if (notesHere.length > 0) {
                // Try to map graphical notes that reference same sourceNote
                const gMatches: any[] = [];
                try {
                  const gms = (osmd as any).GraphicalMusicSheet?.GraphicalMeasures || [];
                  for (const gMeasure of gms) {
                    for (const staffEntry of gMeasure?.StaffEntries || []) {
                      for (const gVo of staffEntry?.GraphicalVoiceEntries || []) {
                        for (const gNote of gVo?.Notes || []) {
                          for (const s of notesHere) {
                            if (s.source && gNote?.sourceNote === s.source) {
                              gMatches.push(gNote);
                            }
                          }
                        }
                      }
                    }
                  }
                } catch {}
                const names = notesHere.map((n) => midiToName(n.midi!));
                extracted.push({ notes: names, notesSet: new Set(names), graphicalNoteRefs: gMatches });
              }
            }
          }
        } catch (e) {
          console.error("Extraction error:", e);
        }

        // fallback: if nothing extracted, try scanning Graphical measures
        if (extracted.length === 0) {
          try {
            const fallback: EventNotes[] = [];
            const gms = (osmd as any).GraphicalMusicSheet?.GraphicalMeasures || [];
            for (const gMeasure of gms) {
              for (const staffEntry of gMeasure?.StaffEntries || []) {
                for (const gVo of staffEntry?.GraphicalVoiceEntries || []) {
                  for (const gNote of gVo?.Notes || []) {
                    const src = gNote?.sourceNote;
                    let midi: number | undefined = undefined;
                    if (src) midi = src.halfTone ?? src?.Pitch?.HalfTone ?? src?.MidiPitch;
                    if (typeof midi === "number") {
                      fallback.push({
                        notes: [midiToName(midi)],
                        notesSet: new Set([midiToName(midi)]),
                        graphicalNoteRefs: [gNote],
                      });
                    }
                  }
                }
              }
            }
            if (fallback.length > 0) {
              setEvents(fallback);
              setSliderMax(Math.max(0, fallback.length - 1));
              onExtracted?.(fallback);
              return;
            }
          } catch (e) {
            console.warn("fallback extraction failed", e);
          }
        }

        if (!cancelled) {
          setEvents(extracted);
          setSliderMax(Math.max(0, extracted.length - 1));
          onExtracted?.(extracted);
        }
      }

      init();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filePath]);

    // sync slider value when parent-controlled index changes
    useEffect(() => {
      setSliderVal(controlledIndex);
    }, [controlledIndex]);

    // expose imperative methods for parent
    useImperativeHandle(ref, () => ({
      highlightEvent(i: number) {
        if (!osmdRef.current) return;
        // clear previous notehead colors
        events.forEach((ev) => {
          ev.graphicalNoteRefs.forEach((gn: any) => {
            try {
              if (gn.sourceNote && gn.sourceNote.NoteheadColor) delete gn.sourceNote.NoteheadColor;
              if (gn.svgElement) gn.svgElement.style.fill = "";
            } catch {}
          });
        });
        const ev = events[i];
        if (!ev) return;
        ev.graphicalNoteRefs.forEach((gn: any) => {
          try {
            if (gn.sourceNote) gn.sourceNote.NoteheadColor = "#3498db";
            if (gn.svgElement) gn.svgElement.style.fill = "#3498db";
          } catch {}
        });
        try {
          osmdRef.current.render();
        } catch {}
      },
      markEvent(i: number, correct: boolean) {
        if (!osmdRef.current) return;
        const ev = events[i];
        if (!ev) return;
        const color = correct ? "#16a34a" : "#dc2626";
        ev.graphicalNoteRefs.forEach((gn: any) => {
          try {
            if (gn.sourceNote) gn.sourceNote.NoteheadColor = color;
            if (gn.svgElement) gn.svgElement.style.fill = color;
          } catch {}
        });
        try {
          osmdRef.current.render();
        } catch {}
      },
    }));

    return (
      <div style={{ position: "relative" }}>
        <div ref={containerRef} style={{ minHeight: 420, background: "#fff", borderRadius: 8, padding: 8 }} />
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="range"
            min={0}
            max={sliderMax}
            value={sliderVal}
            onChange={(e) => {
              const v = Number(e.target.value || 0);
              setSliderVal(v);
              onSliderChange?.(v);
            }}
            style={{ width: "100%" }}
          />
          <div style={{ minWidth: 80, textAlign: "center" }}>{sliderVal} / {sliderMax}</div>
        </div>
      </div>
    );
  }
);

MusicSheet.displayName = "MusicSheet";
export default MusicSheet;
