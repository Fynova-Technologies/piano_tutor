"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMIDISuccess = (midiAccess: WebMidi.MIDIAccess) => {
    // eslint-disable-next-line prefer-const
    for (let input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
    }
  };

  function getMIDIMessage(midiMessage: WebMidi.MIDIMessageEvent) {
    const [status, note, velocity] = midiMessage.data;

    if (status === 0xF8) return; // Ignore timing clock

    setActiveNotes((prevNotes) => {
      const updatedNotes = new Set(prevNotes);

      if (status === 144 && velocity > 0) {
        // Note On
        updatedNotes.add(note);
      } else if (status === 128 || (status === 144 && velocity === 0)) {
        // Note Off
        updatedNotes.delete(note);
      }

      return updatedNotes;
    });
  }

  function onMIDIFailure() {
    console.log("Could not access your MIDI devices.");
  }

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
  }, [onMIDISuccess]);

  function noteNumberToName(noteNumber: number): string {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNumber / 12) - 1;
    const note = noteNames[noteNumber % 12];
    return `${note}${octave}`;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <a>
          Hello World Today we are going to connect our midi device using the
          web midi api hope it works
        </a>

        {activeNotes.size > 0 ? (
          <div>
            <h1>🎹 Active Notes:</h1>
            <ul>
              {[...activeNotes].map((note) => (
                <li key={note}>{noteNumberToName(note)}</li>
              ))}
            </ul>
          </div>
        ) : (
          <h1>No notes pressed</h1>
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
