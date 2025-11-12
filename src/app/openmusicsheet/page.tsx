/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import * as Tone from 'tone';
import { WebMidi } from 'webmidi';

export default function MusicPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async () => {
  await Tone.start(); // 👈 ensures AudioContext starts only after user gesture
  console.log("AudioContext started");

  playMusic(); // your music playback function
};

  useEffect(() => {
    const initOSMD = async () => {
      if (!containerRef.current) return;

      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        backend: 'svg',
      });

      osmdRef.current = osmd;
      await osmd.load('/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml');
      await osmd.render();
      console.log('Parts found:', osmd.Sheet.Parts.length);
      console.log('First part:', osmd.Sheet.Parts[0]);
    };


    initOSMD();
  }, []);

  function getNoteName(note: any): string | null {
  if (!note?.Pitch) return null;
  const pitch = note.Pitch;

  // Prefer halfTone if available (numeric MIDI pitch)
  const halfTone = pitch.halfTone ?? pitch.HalfTone ?? null;
  if (halfTone === null || isNaN(halfTone)) {
    console.warn("Skipping invalid pitch:", pitch);
    return null;
  }

  // Convert MIDI number (0–127) to note name
  const midiToNote = (midi: number) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const name = notes[midi % 12];
    const octave = Math.floor(midi / 12) - 1; // MIDI octave formula
    return `${name}${octave}`;
  };

  const name = midiToNote(halfTone);

  // sanity check
  if (!name.match(/[A-G]#?\d/)) {
    console.warn("Invalid name from pitch:", pitch);
    return null;
  }

  return name;
}




  const playMusic = async () => {
    if (!osmdRef.current) return;

    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: {
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 0.5,
  },
}).toDestination();
   
    // const quarterNote = Tone.Time("4n").toSeconds();
    const osmd = osmdRef.current;
    const graphicSheet = osmd.GraphicSheet;
    const measureList = graphicSheet?.MeasureList || [];
    const rawNotes: any[] = [];
    const bpm = 60; // you can tweak this: 60 = slow, 90 = normal, 120 = upbeat
    const quarterNote = 60 / bpm;

    // Extract notes from the graphical sheet
    measureList.forEach((measureArray: any[]) => {
      measureArray.forEach((graphicalMeasure: any) => {
        graphicalMeasure.staffEntries.forEach((staffEntry: any) => {
          staffEntry.graphicalVoiceEntries?.forEach((voiceEntry: any) => {
            voiceEntry.notes?.forEach((graphicalNote: any) => {
              const note = graphicalNote.sourceNote;
              if (note?.Pitch) {
                const duration = note.Length?.RealValue || 0.25;
                const time = note.Timestamp?.RealValue || 0;
                rawNotes.push({ note, duration, time });
              }
            });
          });
        });
      });
    });

    console.log("Raw notes extracted:", rawNotes.length);

    // Convert to playable notes with validation
    const playableNotes = rawNotes
  .map((n) => {
    const name = getNoteName(n.note);
    if (!name) return null;
    return {
      name,
      duration: n.duration,
      time: n.time
    };
  })
  .filter((n) => n && Tone.Frequency(n.name).toFrequency() > 0);


    console.table(playableNotes.slice(0, 15));
    console.log("Valid notes:", playableNotes.length);
if (playableNotes.length === 0) {
  alert("No playable notes found — check if your MusicXML is valid.");
  return;
}

// Play the validated notes
setIsPlaying(true);
const now = Tone.now() + 0.5; // give 0.5 seconds buffer before first note
let currentTime = 0;

playableNotes.forEach((note: any) => {
  const pitch = note?.name;
  const duration = (note?.duration ?? 0) * quarterNote;
  // guard: ensure pitch exists and duration is a positive number
  if (!pitch || typeof duration !== 'number' || duration <= 0) return;

  synth.triggerAttackRelease(pitch, duration, now + currentTime);
  currentTime += duration; // ⏱ increment timing
});
    

    const lastNote = playableNotes[playableNotes.length - 1];
    const totalDuration =
      ((lastNote?.time ?? 0) + (lastNote?.duration ?? 0)) *
      quarterNote *
      1000;

    setTimeout(() => setIsPlaying(false), totalDuration);
  };

  const stopMusic = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  // Listen for MIDI Keyboard
  useEffect(() => {
    WebMidi.enable()
      .then(() => {
        const input = WebMidi.inputs[0];
        if (!input) {
          console.log('No MIDI device found');
          return;
        }

        const synth = new Tone.Synth().toDestination();

        input.addListener('noteon', (e) => {
          synth.triggerAttack(e.note.name + e.note.octave);
        });

        input.addListener('noteoff', () => {
          synth.triggerRelease();
        });
      })
      .catch((err) => console.error('WebMIDI failed:', err));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div
        ref={containerRef}
        className="w-full max-w-5xl bg-white shadow-lg rounded-lg p-4 mb-6"
      />

      <div className="flex gap-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          onClick={stopMusic}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}