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
    playMusic();
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
    const limiter = new Tone.Limiter(-3).toDestination();

  const sampler = new Tone.Sampler({
  urls: {
        "A0": "A0.mp3",
    "C1": "C1.mp3",
    "Eb1": "Ds1.mp3",
    "Gb1": "Fs1.mp3",
    "A1": "A1.mp3",
    "C2": "C2.mp3",
    "Eb2": "Ds2.mp3",
    "Gb2": "Fs2.mp3",
    "A2": "A2.mp3",
    "C3": "C3.mp3",
    "Eb3": "Ds3.mp3",
    "Gb3": "Fs3.mp3",
    "A3": "A3.mp3",
    "C4": "C4.mp3",
    "Eb4": "Ds4.mp3",
    "Gb4": "Fs4.mp3",
    "A4": "A4.mp3",
    "C5": "C5.mp3",
    "Eb5": "Ds5.mp3",
    "Gb5": "Fs5.mp3",
    "A5": "A5.mp3",
    "C6": "C6.mp3",
    "Eb6": "Ds6.mp3",
    "Gb6": "Fs6.mp3",
    "A6": "A6.mp3",
    "C7": "C7.mp3",
    "Eb7": "Ds7.mp3",
    "Gb7": "Fs7.mp3",
    "A7": "A7.mp3",
    "C8": "C8.mp3"
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  onload: () => {
        console.log('Samples loaded – ready to play!');
      },
  
}).connect(limiter);

    const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).connect(limiter);
  sampler.connect(reverb);

  // --- Ensure AudioContext and all buffers are ready BEFORE scheduling ---
  await Tone.start();       // unlock audio (user gesture required before calling playMusic)
  await Tone.loaded();      // wait for all Tone.Buffer loads (important!)

  console.log("Tone started and all buffers loaded.");

  // --- Extract notes from OSMD ---
  const osmd = osmdRef.current!;
  osmd.cursor.show();
  osmd.cursor.reset();
const graphicSheet = osmd.GraphicSheet;
const measureList = graphicSheet?.MeasureList || [];
const rawNotes: any[] = [];
const bpm = 60;
const quarterNoteSec = 60 / bpm;

let cumulativeTime = 0; // Track time manually

measureList.forEach((measureArray: any[]) => {
  measureArray.forEach((graphicalMeasure: any) => {
    const measureTime = cumulativeTime; // Start of this measure
    
    graphicalMeasure.staffEntries?.forEach((staffEntry: any) => {
      const entryTime = staffEntry.relInMeasureTimestamp?.RealValue ?? 0;
      const absoluteTime = measureTime + entryTime;
      
      staffEntry.graphicalVoiceEntries?.forEach((voiceEntry: any) => {
        voiceEntry.notes?.forEach((graphicalNote: any) => {
          const note = graphicalNote.sourceNote;
          if (note?.Pitch) {
            const duration = note.Length?.RealValue ?? 0.25;
            rawNotes.push({ 
              note, 
              duration, 
              time: absoluteTime 
            });
          }
        });
      });
    });
    
    // Add measure duration to cumulative time
    const measureDuration = graphicalMeasure.parentMeasure?.Duration?.RealValue ?? 1;
    cumulativeTime += measureDuration;
  });
});
  // --- Convert to playable notes (name + time in seconds + duration in seconds) ---
  const playableNotes = rawNotes
    .map((n) => {
      const name = getNoteName(n.note); // your existing helper that returns like "C4"
      if (!name) return null;
      return {
        name,
        timeSec: (n.time ?? 0) * quarterNoteSec,
        durSec: (n.duration ?? 0.25) * quarterNoteSec,
      };
    })
    .filter(Boolean);

console.log("First 20 playable notes:", playableNotes.slice(0, 20));  
console.log("Valid notes:", playableNotes.length);
  if (playableNotes.length === 0) {
    alert("No playable notes found — check if your MusicXML is valid.");
    sampler.dispose();
    reverb.dispose();
    return;
  }

  setIsPlaying(true);

  // --- Setup Transport and Part (times are in seconds) ---
  const transport = Tone.getTransport();
  transport.cancel();
  transport.position = 0;
  transport.bpm.value = bpm;

  const part = new Tone.Part(
    (time, value: any) => {
      // safety: ensure sampler still loaded
      if (!sampler.loaded) {
        console.warn("Sampler not loaded at play time; skipping note:", value.name);
        return;
      }
      // value: { name, durSec }
      // Move cursor forward at the exact time the note plays
      Tone.getDraw().schedule(() => {
        // ensure DOM updates happen on the next animation frame
        requestAnimationFrame(() => {
          osmd.cursor.next();
        });
      }, time);
      
      const velocity = 0.5 + Math.random() * 0.4;
      sampler.triggerAttackRelease(value.name, value.durSec, time,velocity);
    },
    // part events array: use absolute seconds
    playableNotes.map((n) => ({
      time: n?.timeSec,
      name: n?.name,
      durSec: n?.durSec,
    }))
  );

  part.start(0);
  part.loop = false;

  // start transport (small pre-roll to allow safety)
  transport.start("+0.05");

  // compute end time and schedule cleanup
  const last = playableNotes[playableNotes.length - 1];
  if (!last) {
    console.warn("No last note found; aborting scheduled cleanup and stopping immediately.");
    // immediate cleanup if something unexpected happened
    part.stop();
    part.dispose();
    transport.stop();
    sampler.dispose();
    reverb.dispose();
    setIsPlaying(false);
    return;
  }
  const totalMs = ((last.timeSec ?? 0) + (last.durSec ?? 0)) * 1000;
  setTimeout(() => {
    osmd.cursor.hide();
    part.stop();
    part.dispose();
    transport.stop();
    sampler.dispose();
    reverb.dispose();
    setIsPlaying(false);
  }, totalMs + 500);
};


  const stopMusic = () => {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    setIsPlaying(false);
  };

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