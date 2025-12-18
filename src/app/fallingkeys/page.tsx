"use client";

import { useEffect, useRef } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

const PPS = 120; // pixels per second

export default function FallingKeysCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const midiRef = useRef<Midi | null>(null);
  const activeNotes = useRef<Set<number>>(new Set());

  /* ---------- Load MIDI ---------- */
  useEffect(() => {
    async function loadMidi() {
      const res = await fetch("/songs/mxl/Eagles (The) — Hotel California (Solo Original) [MIDIfind.com].mid");
      const buffer = await res.arrayBuffer();
      midiRef.current = new Midi(buffer);
    }
    loadMidi();
  }, []);

  /* ---------- MIDI Keyboard ---------- */
  useEffect(() => {
    navigator.requestMIDIAccess().then(access => {
      access.inputs.forEach(input => {
        input.onmidimessage = e => {
          const [status, note, velocity] = e.data;
          if (status === 144 && velocity > 0) {
            activeNotes.current.add(note);
          } else if (status === 128 || velocity === 0) {
            activeNotes.current.delete(note);
          }
        };
      });
    });
  }, []);

  /* ---------- Audio ---------- */
  const samplerRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    samplerRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
  }, []);

  /* ---------- Falling Keys Render Loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Tone.Transport.seconds;
      const midi = midiRef.current;
      if (!midi) return requestAnimationFrame(draw);
      const HIT_LINE = canvas.height - 40;


      midi.tracks.forEach(track => {
      track.notes.forEach(note => {
        const y = HIT_LINE - (note.time - time) * PPS;
        const h = note.duration * PPS;
      
        if (y + h < 0 || y > canvas.height) return;
      
        const x =
          ((note.midi - 21) / (108 - 21)) * canvas.width;
      
        ctx.fillStyle = activeNotes.current.has(note.midi)
          ? "lime"
          : "cyan";
      
        ctx.fillRect(x, y, 12, h);
      });
    });

      requestAnimationFrame(draw);
    }

    draw();
  }, []);

  /* ---------- Playback ---------- */
  async function play() {
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();

    midiRef.current?.tracks.forEach(track => {
      track.notes.forEach(note => {
        Tone.Transport.schedule(time => {
          samplerRef.current?.triggerAttackRelease(
            Tone.Frequency(note.midi, "midi").toNote(),
            note.duration,
            time,
            note.velocity
          );
        }, note.time);
      });
    });

    Tone.Transport.start();
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full h-64 bg-black rounded"
      />
      <button
        onClick={play}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Play MIDI
      </button>
    </div>
  );
}
