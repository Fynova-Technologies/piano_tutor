"use client";

import React, { useRef, useState, useEffect } from "react";
import MusicSheet, { EventNotes, MusicSheetHandle } from "@/components/MusicSheet";
import MidiController from "@/components/MidiController";
import * as Tone from "tone";

/**
 * Practice page - coordinates sheet, playback, slider, and MIDI checking.
 */
export default function PracticePage() {
  const sheetRef = useRef<MusicSheetHandle | null>(null);
  const [events, setEvents] = useState<EventNotes[]>([]);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(80);
  
  // Keep track of current synth to dispose properly
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const playbackIndexRef = useRef(0); // Track playback position independently

  // Called by MusicSheet once it has parsed events
  function handleExtracted(ev: EventNotes[]) {
    console.log("handleExtracted called with", ev.length, "events");
    setEvents(ev);
    setReady(true);
    setIndex(0);
    playbackIndexRef.current = 0;
  }

  // Play one event (highlight sheet and play via Tone)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function playEventAt(i: number) {
    if (!sheetRef.current) return;
    const ev = events[i];
    if (!ev) return;

    // Visual highlight
    sheetRef.current.highlightEvent(i);
    
    // Ensure Tone audio context is started
    await Tone.start();
    
    // Create synth if needed
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    
    // Play all notes in the event
    const now = Tone.now();
    ev.notes.forEach((noteName) => {
      synthRef.current!.triggerAttackRelease(noteName, "8n", now);
    });
  }

  // Start automatic playback using Tone.Transport scheduling
  async function startPlayback() {
    console.log("startPlayback called", { ready, eventsLength: events.length, index });
    if (!ready || events.length === 0) {
      console.log("Playback blocked: not ready or no events");
      return;
    }
    
    console.log("Starting Tone context...");
    await Tone.start();
    console.log("Tone context started");
    setIsPlaying(true);
    console.log("isPlaying set to true");
    
    const transport = Tone.getTransport();
    console.log("Transport obtained", transport);
    transport.cancel(); // Clear any previous schedules
    transport.stop(); // Ensure transport is stopped before scheduling
    console.log("Transport cleared and stopped");
    
    // Set BPM on transport
    transport.bpm.value = bpm;
    console.log("BPM set to", bpm);
    
    // Get starting index
    const startIdx = index;
    playbackIndexRef.current = startIdx;
    
    // Create synth if needed
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    }
    
    // Play first event immediately (at time 0)
    console.log("Scheduling first event at index", startIdx);
    transport.schedule((time) => {
      console.log("Playing event", startIdx, "at time", time);
      playbackIndexRef.current = startIdx;
      setIndex(startIdx);
      
      const ev = events[startIdx];
      if (ev && sheetRef.current) {
        sheetRef.current.highlightEvent(startIdx);
        ev.notes.forEach((noteName) => {
          console.log("Playing note:", noteName);
          synthRef.current!.triggerAttackRelease(noteName, "8n", time);
        });
      }
    }, 0);
    
    // Schedule remaining events at quarter note intervals
    console.log("Scheduling remaining events from", startIdx + 1, "to", events.length - 1);
    for (let i = startIdx + 1; i < events.length; i++) {
      const capturedIndex = i; // Capture for closure
      const beatPosition = (capturedIndex - startIdx) * 4; // Each event is 4 sixteenth notes (quarter note)
      
      transport.schedule((time) => {
        console.log("Playing event", capturedIndex, "at time", time);
        // Update state on main thread
        playbackIndexRef.current = capturedIndex;
        setIndex(capturedIndex);
        
        // Play audio at scheduled time
        const ev = events[capturedIndex];
        if (ev && sheetRef.current) {
          sheetRef.current.highlightEvent(capturedIndex);
          
          ev.notes.forEach((noteName) => {
            console.log("Playing note:", noteName);
            synthRef.current!.triggerAttackRelease(noteName, "8n", time);
          });
        }
      }, `0:0:${beatPosition}`); // Bar:Quarter:Sixteenth notation
    }
    
    // Schedule stop after last event
    const lastBeatPosition = (events.length - startIdx) * 4;
    transport.schedule(() => {
      console.log("Stopping playback");
      stopPlayback();
    }, `0:0:${lastBeatPosition + 2}`);
    
    console.log("Starting transport...");
    transport.start("+0.1"); // Start with slight delay
    console.log("Transport started");
  }

  function stopPlayback() {
    setIsPlaying(false);
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    
    // Dispose synth
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  }

  // Called when MIDI controller notifies pressed notes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function onUserPressed(pressed: Set<string>) {
    const ev = events[index];
    if (!ev) return;
    
    const expected = ev.notesSet;
    let correct = false;
    
    // Check if user pressed exactly the right notes
    if (expected.size > 0 && pressed.size === expected.size) {
      correct = Array.from(expected).every((n) => pressed.has(n));
    }
    
    // Mark the event as correct/incorrect
    if (sheetRef.current) {
      sheetRef.current.markEvent(index, correct);
    }
    
    // Auto-advance to next event if correct
    if (correct && index < events.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      playbackIndexRef.current = nextIndex;
      sheetRef.current?.highlightEvent(nextIndex);
    }
  }

  // Manual slider changes (jump to step)
  function onSliderChange(v: number) {
    stopPlayback();
    setIndex(v);
    playbackIndexRef.current = v;
    sheetRef.current?.highlightEvent(v);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-semibold mb-4">MusicXML Practice — OSMD + Tone + WebMIDI</h1>

      <div className="mb-3">
        <strong>Status:</strong> {ready ? `Loaded — ${events.length} events` : "Loading..."}
        <div className="text-sm text-gray-600">
          Debug: ready={ready.toString()}, events.length={events.length}, index={index}
        </div>
      </div>

      <div className="mb-4 flex gap-3 items-center">
        <button
          onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
          disabled={!ready || events.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPlaying ? "Stop" : "Play"}
        </button>

        <label className="flex items-center gap-2">
          BPM:
          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value || 80))}
            disabled={isPlaying}
            className="ml-2 p-1 border rounded w-24 disabled:bg-gray-200"
          />
        </label>

        <div className="ml-4">Step {index + 1} / {Math.max(1, events.length)}</div>
      </div>

      <MusicSheet
        ref={sheetRef}
        filePath="/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml"
        onExtracted={handleExtracted}
        controlledIndex={index}
        onSliderChange={onSliderChange}
      />

      <div className="mt-4">
        <MidiController />
      </div>

      <div className="mt-4 p-4 bg-white rounded shadow">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Press <strong>Play</strong> to hear the melody automatically advance</li>
          <li>Use the <strong>slider</strong> to jump to any position</li>
          <li>Play the highlighted notes on your MIDI keyboard</li>
          <li>Notes turn <span className="text-green-600 font-semibold">green</span> if correct, <span className="text-red-600 font-semibold">red</span> if incorrect</li>
          <li>When correct, the sheet auto-advances to the next note</li>
        </ul>
      </div>
    </div>
  );
}