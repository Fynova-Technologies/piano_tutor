/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default function getNotesAtCursor(osmd: OpenSheetMusicDisplay) {
    try {
      const it = osmd.cursor.iterator;
      if (!it) {
        console.warn("[getNotesAtCursor] No iterator found");
        return [];
      }
      
      const ves = it.CurrentVoiceEntries || [];
      const notes: number[] = [];
      
      for (const ve of ves) {
        const veNotes = ve.Notes || [];
        
        for (const n of veNotes) {
          const halfTone = (n as any)?.sourceNote?.halfTone ?? 
                          (n as any)?.sourceNote?.Pitch?.halfTone ??
                          (n as any)?.pitch?.Midi ?? 
                          (n as any)?.Pitch?.Midi ??
                          (n as any)?.halfTone;
          
          if (typeof halfTone === "number" && !(typeof n.isRest === "function" ? n.isRest() : false)) {
            notes.push(halfTone);
          }
        }
      }
      
      return notes;
    } catch (e) {
      console.warn("getNotesAtCursor error", e);
      return [];
    }
  }
