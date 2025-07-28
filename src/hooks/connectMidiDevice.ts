import React, { useCallback } from "react";
// type Note = { x_pos: number; y_pos: number; systemIndex: number };
type NoteEvent = { note: number; time: number };
let chordTimeout: ReturnType<typeof setTimeout> | null = null;
let currentChord: NoteEvent[] = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let lastNoteTime = 0;
const CHORD_WINDOW_MS = 30;
type ConnectMidiDeviceProps = {
    isPlaying: boolean;
    captureChordGroup: (chord: NoteEvent[]) => void;
};

export default function ConnectMidiDevice({ isPlaying, captureChordGroup }: ConnectMidiDeviceProps) {
    const activeNotes = React.useRef<Map<number, number>>(new Map()); // Track active notes and their sliderBeat
    
     const getMIDIMessage= useCallback((midiMessage: WebMidi.MIDIMessageEvent) => {
      const [status, note, velocity] = midiMessage.data;
      const statusType = status & 0xF0;
    
      if (statusType === 0x80 || (statusType === 0x90 && velocity === 0)) {
        activeNotes.current.delete(note);
        return;
      }
    
      if (statusType === 0x90 && velocity > 0 && isPlaying) {
        if (!activeNotes.current.has(note)) {
          const now = performance.now();
    
          currentChord.push({ note, time: now });
          lastNoteTime = now;
    
          // Clear any previous pending finalization
          if (chordTimeout) clearTimeout(chordTimeout);
    
          // Set timeout to finalize current chord
          chordTimeout = setTimeout(() => {
            if (currentChord.length > 0) {
              console.log("Finalizing chord:", currentChord);
              captureChordGroup(currentChord);
              currentChord = [];
            }
          }, CHORD_WINDOW_MS);
        }
      }
    }, [captureChordGroup, isPlaying]);
    
  return { getMIDIMessage };
}