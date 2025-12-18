/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default function findNotesAtCursorByMidi(osmd: OpenSheetMusicDisplay, midi: number) {
    try {
      const it = osmd.cursor.iterator;
      if (!it) {
        console.warn("No iterator found");
        return [];
      }
      
      const matches: any[] = [];
      
      // Get the exact timestamp of the cursor position
      const currentTimestamp = it.CurrentSourceTimestamp;
      
      console.log(`Looking for MIDI ${midi} at timestamp`, currentTimestamp);
      
      // Get current voice entries to find the exact source notes at cursor
      const ves = it.CurrentVoiceEntries || [];
      const sourceNotesAtCursor: any[] = [];
      
      for (const ve of ves) {
        const veNotes = ve.Notes || [];
        for (const n of veNotes) {
          const halfTone = (n as any)?.sourceNote?.halfTone !== undefined
            ? (n as any).sourceNote.halfTone
            : n.halfTone;
          if (Number(halfTone) === Number(midi) && !(typeof n.isRest === "function" ? n.isRest() : false)) {
            sourceNotesAtCursor.push((n as any)?.sourceNote ?? n);
          }
        }
      }
      
      console.log(`  Found ${sourceNotesAtCursor.length} source notes at cursor with MIDI ${midi}`);
      
      if (sourceNotesAtCursor.length === 0) return [];
      
      // Now find the graphical representations of these exact source notes
      if (!osmd?.GraphicSheet?.MeasureList) return [];
      
      const measureList = osmd.GraphicSheet.MeasureList;
      
      for (const system of measureList) {
        if (!Array.isArray(system)) continue;
        
        for (const gMeasure of system) {
          if (!gMeasure?.staffEntries) continue;
          
          for (const staffEntry of gMeasure.staffEntries) {
            for (const gve of staffEntry.graphicalVoiceEntries || []) {
              for (const gn of gve.notes || []) {
                // Check if this graphical note's source is one of our cursor notes
                if (sourceNotesAtCursor.includes(gn?.sourceNote)) {
                  matches.push(gn);
                  console.log(`    ✓ Found matching graphical note`);
                }
              }
            }
          }
        }
      }
      
      console.log(`Total found: ${matches.length} graphical notes for MIDI ${midi}`);
      return matches;
    } catch (e) {
      console.warn("findNotesAtCursorByMidi error", e);
      return [];
    }
  }
