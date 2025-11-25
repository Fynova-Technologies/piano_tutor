/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default function Test2HybridFull() {
  const xml = "/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<any>(null);

  // playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const midiInRef = useRef<MIDIInput | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStepNotes, setCurrentStepNotes] = useState<number[]>([]);
  const currentStepNotesRef = useRef<number[]>([]);




  // prevents MIDI OUT echoing into MIDI IN
  const playbackMidiGuard = useRef<number>(0);

  // guard so visual highlighting only happens while in play-mode
  const playModeRef = useRef<boolean>(false);

  const cursorsOptions = [
    {
      type: 0, // Type of cursor (0 for default, 3 for measure highlighting, etc.)
      color: "#FF0000", // Red color
      alpha: 1, // Opacity
      follow: true, // Cursor follows the notes automatically
    },
  ];


  // inject highlight CSS once
  useEffect(() => {
    const id = "osmd-midi-highlight-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .vf-note-highlight * { fill: red !important; stroke: red !important; filter: drop-shadow(0 0 6px red) !important; }
      .midi-dot { pointer-events: none; }
      .measure-highlight { fill: rgba(255, 255, 0, 0.12); }
      .measure-border-highlight { stroke: rgba(255, 165, 0, 0.8); stroke-width: 2px; fill: none; }
      .progress-bar { width: 100%; height: 10px; background: #eee; border-radius: 6px; overflow: hidden; cursor: pointer; }
      .progress-fill { height: 100%; background: linear-gradient(90deg,#4caf50,#8bc34a); width: 0%; }
    `;
    document.head.appendChild(style);
  }, []);

  function replaceOsmdCursor(osmd: any) {
    // safe-guard in case cursor or cursorElement are not present yet
    try {
      const img = osmd.cursor.cursorElement; // the <img> or cursor element
      if (!img) return;

      // Hide the OSMD-generated cursor image if present
      try {
        img.style.display = "none";
      } catch {}

      // Create your vertical cursor
      let custom = document.getElementById("custom-vertical-cursor") as HTMLDivElement | null;
      if (!custom) {
        custom = document.createElement("div");
        custom.id = "custom-vertical-cursor";
        custom.style.position = "absolute";
        custom.style.background = "red";
        custom.style.opacity = "0.7";
        custom.style.width = "3px"; // thickness of the vertical line
        custom.style.pointerEvents = "none";
        custom.style.zIndex = "9999";
        img.parentElement?.appendChild(custom);
      }

      // Patch OSMD so your cursor follows the music
      const originalUpdate = osmd.cursor.update?.bind(osmd.cursor);
      if (!originalUpdate) return;

      osmd.cursor.update = function (...args: any[]) {
        originalUpdate(...args);

        const el = osmd.cursor.cursorElement as HTMLElement | SVGElement | null;
        if (!el) return;

        // compute bounding box safely
        try {
          const rect = (el as any).getBoundingClientRect();
          const parentRect = (img.parentElement as HTMLElement)?.getBoundingClientRect();
          if (!parentRect) return;

          // left relative to parent
          const left = rect.left - parentRect.left;
          const top = rect.top - parentRect.top;

          custom!.style.left = `${Math.round(left)}px`;
          custom!.style.top = `${Math.round(top)}px`;
          custom!.style.height = `${Math.round(rect.height)}px`;
          // keep a visible but slim vertical line
          custom!.style.width = `6px`;
        } catch (e) {
          console.warn("error is ", e)
        }
      };
    } catch (e) {
      console.warn("replaceOsmdCursor failed", e);
    }
  }

  // ---- Helper functions reused from your earlier code (adapted) ----
  function findOsmdNotesByMidi(midi: number) {
    const osmd = osmdRef.current;
    if (!osmd?.GraphicSheet) return [];
    const matches: any[] = [];
    for (const measureRow of (osmd.GraphicSheet as any).MeasureList || []) {
      for (const gm of measureRow || []) {
        if (!gm?.staffEntries) continue;
        for (const entry of gm.staffEntries || []) {
          for (const gve of entry.graphicalVoiceEntries || []) {
            for (const gn of gve.notes || []) {
              if ((gn as any)?.sourceNote?.halfTone === midi) matches.push(gn);
            }
          }
        }
      }
    }
    return matches;
  }

  function highlightGraphicalNoteNative(gn: any, ms = 600) {
    const group = gn?.getSVGGElement?.() || gn?.graphicalNotehead?.svgElement || gn?.svgElement;
    if (!group) return;
    group.classList.add("vf-note-highlight");
    setTimeout(() => group.classList.remove("vf-note-highlight"), ms);
  }

  // NOTE: this function will only act if playModeRef.current is true.
  // function handleMidiNoteVisual(midi: number) {
  //   if (!playModeRef.current) return; // block any early highlighting from MIDI input
  //   const exact = findOsmdNotesByMidi(midi);
  //   if (exact.length > 0) {
  //     exact.forEach((gn) => highlightGraphicalNoteNative(gn, 700));
  //   }
  // }

function getNotesAtCursor(osmd: any) {
  try {
    const it = osmd.cursor.iterator;
    if (!it) {
      console.warn("[getNotesAtCursor] No iterator found");
      return [];
    }
    
    console.log("[getNotesAtCursor] Iterator exists, checking CurrentVoiceEntries...");
    const ves = it.CurrentVoiceEntries || [];
    console.log("[getNotesAtCursor] Found", ves.length, "voice entries");
    
    const notes: number[] = [];
    
    for (const ve of ves) {
      console.log("[getNotesAtCursor] Voice entry:", ve);
      const veNotes = ve.Notes || [];
      console.log("[getNotesAtCursor] Voice entry has", veNotes.length, "notes");
      
      for (const n of veNotes) {
        // Try multiple paths to get the MIDI note number
        const halfTone = n?.sourceNote?.halfTone ?? 
                        n?.sourceNote?.Pitch?.halfTone ??
                        n?.pitch?.Midi ?? 
                        n?.Pitch?.Midi ??
                        n?.halfTone;
        
        console.log("[getNotesAtCursor] Note object:", n);
        console.log("[getNotesAtCursor] halfTone:", halfTone, "isRest:", n?.isRestFlag);
        
        if (typeof halfTone === "number" && !n?.isRestFlag) {
          notes.push(halfTone);
        }
      }
    }
    
    console.log("[DEBUG] NOTES AT THIS POSITION:", notes);
    return notes;
  } catch (e) {
    console.warn("getNotesAtCursor error", e);
    return [];
  }
}




  // ---- OSMD setup & playback map generation ----
  useEffect(() => {
    if (!containerRef.current) return;

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      backend: "svg",
      autoResize: true,
      drawingParameters: "default",
      followCursor: true,
      cursorsOptions: cursorsOptions,
    });


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let cancelled = false;

    (async () => {
  try {
    await osmd.load(xml);

    // First render (necessary so OSMD builds layout)
    await osmd.render();

    // Now apply cursorOptions properly AFTER layout
    osmd.setOptions({
      cursorsOptions: [
        {
          type: 0,
          color: "#FF0000",
          alpha: 1,
          follow: true
        }
      ]
    });

    // Render again so the cursor rebuilds correctly
    await osmd.render();

    // Cursor now exists with correct type
    osmd.cursor.show();
    osmd.cursor.reset();

    osmdRef.current = osmd;
    replaceOsmdCursor(osmd);

    // Now rebuild playback map
    buildPlaybackStepsAndMaps(osmd);

  } catch (e) {
    console.error("OSMD load/render error", e);
  }
})();


    const onResize = () => {
      try {
        osmd.render();
      } catch {}
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml]);

  function buildPlaybackStepsAndMaps(osmd: any) {
    const it = osmd.cursor.iterator.clone();
    const durations: number[] = [];
    const midiToIndex = new Map<number, number>(); // first occurrence
    let idx = 0;

    while (!it.EndReached) {
      const measure = it.CurrentMeasure;
      const bpm =
        typeof measure?.TempoInBPM === "number"
          ? measure.TempoInBPM
          : osmd.Sheet?.Rules?.DefaultTempoBPM ?? 120;

      const quarterMs = (60 / bpm) * 1000;

      const ves = it.CurrentVoiceEntries || [];
      const realVals = ves.map((ve: any) => ve?.Duration?.RealValue ?? 0.25);
      const smallest = realVals.length ? Math.min(...realVals) : 0.25;
      const delayMs = Math.max(50, smallest * 4 * quarterMs);
      durations.push(delayMs);

      // record midi numbers for this cursor step, map first occurrence
      for (const ve of ves) {
        for (const note of ve.Notes || []) {
          const half = note?.sourceNote?.halfTone ?? note?.pitch?.Midi ?? note?.midi;
          if (typeof half === "number" && !midiToIndex.has(half)) {
            midiToIndex.set(half, idx);
          }
        }
      }

      idx++;
      it.moveToNext();
    }

    (osmd as any)._playbackDurations = durations;
    (osmd as any)._playbackMidiMap = midiToIndex;
    (osmd as any)._playbackTotal = durations.length;
    setTotalSteps(durations.length);
    setPlayIndex(0);
  }

  function stopCursor() {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }
    osmd.cursor.reset();
    setIsPlaying(false);
    setPlayIndex(0);
    playModeRef.current = false;
    // clear any lingering highlights
    clearHighlight(osmd);
    document.querySelectorAll(".vf-note-highlight").forEach((el) => el.classList.remove("vf-note-highlight"));
  }

  function pauseCursor() {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }
    setIsPlaying(false);
    playModeRef.current = false;
  }

// for highlighting notes that is under the cursor
  // find graphical note objects by halfTone for your MeasureList shape:
// MeasureList = [ [gMeasure_staff0, gMeasure_staff1], [gMeasure_staff0, gMeasure_staff1], ... ]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function findGraphicalNotes(osmd: any, halfTone: number) {
  const result: any[] = [];
  if (!osmd?.GraphicSheet?.MeasureList) {
    console.warn("[findGraphicalNotes] No MeasureList found");
    return result;
  }

  const measureList = osmd.GraphicSheet.MeasureList;
  console.log("[findGraphicalNotes] Searching for halfTone:", halfTone, "in", measureList.length, "systems");

  for (let sysIdx = 0; sysIdx < measureList.length; sysIdx++) {
    const system = measureList[sysIdx];
    if (!Array.isArray(system)) continue;
    
    for (let mIdx = 0; mIdx < system.length; mIdx++) {
      const gMeasure = system[mIdx];
      if (!gMeasure || !gMeasure.staffEntries) continue;
      
      for (let eIdx = 0; eIdx < gMeasure.staffEntries.length; eIdx++) {
        const entry = gMeasure.staffEntries[eIdx];
        
        // Check graphicalVoiceEntries (this is the main path)
        for (const gve of entry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const noteHalfTone = gn?.sourceNote?.pitch?.halfTone ?? gn?.sourceNote?.halfTone;
            if (noteHalfTone === halfTone) {
              console.log("[findGraphicalNotes] ✓ Found match at system", sysIdx, "measure", mIdx, "entry", eIdx);
              result.push(gn);
            }
          }
        }
      }
    }
  }
  
  console.log("[findGraphicalNotes] Total found:", result.length, "notes for halfTone", halfTone);
  if (result.length > 0) {
    console.log("[findGraphicalNotes] First result sample:", result[0]);
  }
  return result;
}



function clearHighlight(osmd: any) {
  if (!osmd?.GraphicSheet?.MeasureList) return;
  const measureList = osmd.GraphicSheet.MeasureList;

  for (const system of measureList) {
    if (!Array.isArray(system)) continue;
    for (const gMeasure of system) {
      if (!gMeasure?.staffEntries) continue;
      for (const entry of gMeasure.staffEntries) {
        const gNotes = entry.graphicalNotes || [];
        for (const gn of gNotes) {
          try {
            if (gn.sourceNote && gn.sourceNote.noteheadColor) gn.sourceNote.noteheadColor = undefined;
          } catch {}
        }
      }
    }
  }

  try {
    osmd.render();
  } catch (e) {
    console.warn("osmd.render failed when clearing highlights:", e);
  }
}


  function playCursor() {
    const osmd = osmdRef.current;
    if (!osmd) return;
    const steps: number[] = (osmd as any)._playbackDurations ?? [];
    if (!steps.length) {
      console.warn("No playback steps built");
      return;
    }

    // cancel previous
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }

    osmd.cursor.show();

    setIsPlaying(true);
    playModeRef.current = true;

    // start from current playIndex
    let idx = Math.max(0, playIndex);

    // helper to send midi out for this cursor step (if possible)
    const sendMidiForStep = (index: number) => {
      const it = osmd.cursor.iterator.clone();
      let i = 0;
      while (!it.EndReached && i < index) {
        it.moveToNext();
        i++;
      }
      // now CurrentVoiceEntries describes this step
      const ves = it.CurrentVoiceEntries || [];
      for (const ve of ves) {
        for (const n of ve.Notes || []) {
          const half = n?.sourceNote?.halfTone;
          if (typeof half === "number") {
            const midiNote = half;
            const velocity = 0x50;
            try {
              if (midiOutputs.length > 0) {
                // increase guard before sending, to avoid the note echoing back into input
                playbackMidiGuard.current += 1;

                // note on
                midiOutputs[0].send([0x90, midiNote, velocity]);

                // schedule note off after small delay (duration inferred roughly)
                const offDelay = Math.max(100, (osmd as any)._playbackDurations?.[index] ?? 200);
                const when = window.performance.now() + offDelay;
                midiOutputs[0].send([0x80, midiNote, 0x40], when);

                // clear guard after the note is expected to stop sounding
                setTimeout(() => {
                  playbackMidiGuard.current = Math.max(0, playbackMidiGuard.current - 1);
                }, offDelay + 20);
              }
            } catch (e) {
              console.warn("MIDI send error", e);
              playbackMidiGuard.current = Math.max(0, playbackMidiGuard.current - 1);
            }
          }
        }
      }
    };

    function step() {
      if (idx >= steps.length) {
        setIsPlaying(false);
        playModeRef.current = false;
        return;
      }
      
      // Get notes FIRST before moving cursor
      const stepNotes = getNotesAtCursor(osmd);
      console.log("[DEBUG] CURSOR AT STEP", idx, "- EXPECTED NOTES:", stepNotes);
      
      // Store them
      setCurrentStepNotes(stepNotes);
      currentStepNotesRef.current = stepNotes;
      
      // Now move cursor visually for NEXT iteration
      osmd.cursor.next();

      setPlayIndex(idx);

      // send MIDI output for this step
      sendMidiForStep(idx);

      const delay = steps[idx] ?? 200;
      idx++;
      osmd._playTimer = setTimeout(step, delay);
    }

    step();
  }

  // Seek to an arbitrary playback index
  function seekTo(index: number) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (!((osmd as any)._playbackDurations?.length)) return;
    index = Math.max(0, Math.min(index, (osmd as any)._playbackDurations.length - 1));
    // reset cursor and step index times
    osmd.cursor.reset();
    for (let i = 0; i < index; ++i) osmd.cursor.next();
    setPlayIndex(index);
  }

  // ---- MIDI Input hookup (for keyboard/controller sync) ----
  useEffect(() => {
    if (!("requestMIDIAccess" in navigator)) return;
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let midiAccess: MIDIAccess | null = null;

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((m) => {
        if (!active) return;
        midiAccess = m;
        
        // Log ALL available MIDI devices
        console.log("=== AVAILABLE MIDI DEVICES ===");
        console.log("INPUTS:");
        m.inputs.forEach((input, key) => {
          console.log(`  - ${input.name} ${key} (${input.manufacturer || 'unknown'})`);
        });
        console.log("OUTPUTS:");
        m.outputs.forEach((output, key) => {
          console.log(`  - ${output.name} ${key} (${output.manufacturer || 'unknown'})`);
        });
        
        const outs: MIDIOutput[] = [];
        m.outputs.forEach((o) => outs.push(o));
        setMidiOutputs(outs);

        // Attach to ALL inputs (not just first one)
        let inputCount = 0;
        for (const input of m.inputs.values()) {
          console.log("[MIDI SETUP] Attaching to input:", input.name);
          inputCount++;
          
          // Keep reference to first input for display
          if (inputCount === 1) {
            midiInRef.current = input;
          }
          
          input.onmidimessage = (ev) => {
            const [status, key, velocity] = ev.data as Uint8Array;
            console.log("[MIDI RAW]", input.name, "- status:", status, "key:", key, "velocity:", velocity);
            
            const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;
            const isNoteOff = ((status & 0xf0) === 0x80) || ((status & 0xf0) === 0x90 && velocity === 0);

            console.log("[MIDI] isNoteOn:", isNoteOn, "isNoteOff:", isNoteOff);

            // ignore events we generated during playback
            if (playbackMidiGuard.current > 0) {
              console.log("[MIDI] Ignoring - playback guard active");
              return;
            }

            // Only allow visual highlighting from MIDI input when playback is active
            if (isNoteOn) {
              console.log("[MIDI INPUT] Note ON - key:", key, "playMode:", playModeRef.current);
              
              if (playModeRef.current) {
                const cursorNotes = currentStepNotesRef.current || [];
                console.log("[MIDI INPUT] Played key:", key, "| Expected notes:", cursorNotes);

                if (cursorNotes.length === 0) {
                  console.warn("[MIDI INPUT] No cursor notes set! Cursor might not be positioned.");
                }

                if (cursorNotes.some(n => Number(n) === Number(key))) {
                  // ✅ CORRECT NOTE - highlight it using the WORKING method!
                  console.log("[MIDI INPUT] ✅ CORRECT! Highlighting note:", key);
                  
                  // Use the proven working method from your original code
                  const matchingNotes = findOsmdNotesByMidi(Number(key));
                  console.log("[MIDI INPUT] Found", matchingNotes.length, "matching graphical notes");
                  matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
                  
                  // Optional: Auto-advance cursor after correct note
                  // Uncomment if you want the cursor to move forward automatically:
                  // setTimeout(() => {
                  //   if (osmdRef.current?.cursor) {
                  //     osmdRef.current.cursor.next();
                  //   }
                  // }, 100);
                } else {
                  // ❌ WRONG NOTE
                  console.log("[MIDI INPUT] ❌ Wrong note! Expected:", cursorNotes, "Got:", key);
                  // Optional: highlight wrong note in different color
                  const wrongNotes = findOsmdNotesByMidi(Number(key));
                  wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
                }
              } else {
                console.log("[MIDI INPUT] Ignoring - play mode not active");
              }
            }

            if (isNoteOff) {
              // optional: can un-highlight or other behaviour (no-op here)
            }
          };
        }
        
        if (inputCount === 0) {
          console.warn("[MIDI SETUP] No MIDI inputs found! Connect a MIDI keyboard and refresh.");
        }
      })
      .catch((e) => console.warn("No MIDI access", e));

    return () => {
      active = false;
      try {
        if (midiInRef.current) midiInRef.current.onmidimessage = null;
      } catch {}
    };
  }, []);

  // jump cursor to first occurrence of midi note (keyboard sync)
  // NOTE: keeping function in case you want to re-enable it later, but we won't call it from MIDI input.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function jumpCursorToMidi(midi: number) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    const midiMap: Map<number, number> = (osmd as any)._playbackMidiMap;
    if (!midiMap) return;
    const targetIndex = midiMap.get(midi);
    if (typeof targetIndex === "number") {
      // seek
      seekTo(targetIndex);
    } else {
      // no-op
    }
  }

  // respond to clicks on the progress bar to seek
  function onProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const total = (osmd as any)._playbackDurations?.length ?? 0;
    if (!total) return;
    const idx = Math.floor(pct * total);
    seekTo(idx);
  }

  // convert playIndex => percent for progress UI
  const progressPercent = totalSteps ? Math.round((playIndex / Math.max(1, totalSteps - 1)) * 100) : 0;

  // Keyboard bindings: space = play/pause, piano keys = simulate MIDI
  useEffect(() => {
    // Map computer keyboard keys to MIDI notes (C4=60)
    const keyToMidi: Record<string, number> = {
      'a': 60, // C
      'w': 61, // C#
      's': 62, // D
      'e': 63, // D#
      'd': 64, // E
      'f': 65, // F
      't': 66, // F#
      'g': 67, // G
      'y': 68, // G#
      'h': 69, // A
      'u': 70, // A#
      'j': 71, // B
      'k': 72, // C (octave up)
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (isPlaying) pauseCursor();
        else playCursor();
        return;
      }

      // Simulate MIDI input from computer keyboard
      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat && playModeRef.current) {
        ev.preventDefault();
        console.log("[KEYBOARD] Simulating MIDI note:", midiNote, "from key:", ev.key);
        
        const cursorNotes = currentStepNotesRef.current || [];
        console.log("[KEYBOARD] Expected notes:", cursorNotes);

        if (cursorNotes.some(n => Number(n) === Number(midiNote))) {
          console.log("[KEYBOARD] ✅ CORRECT! Highlighting note:", midiNote);
          const matchingNotes = findOsmdNotesByMidi(Number(midiNote));
          console.log("[KEYBOARD] Found", matchingNotes.length, "matching graphical notes");
          matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
        } else {
          console.log("[KEYBOARD] ❌ Wrong note! Expected:", cursorNotes, "Got:", midiNote);
          const wrongNotes = findOsmdNotesByMidi(Number(midiNote));
          wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
        }
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playIndex]);

  // UI
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => {
            if (isPlaying) {
              pauseCursor();
            } else {
              playCursor();
            }
          }}
          style={{
            padding: "8px 12px",
            background: isPlaying ? "#f0a500" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          onClick={() => stopCursor()}
          style={{
            padding: "8px 12px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ⏹ Stop
        </button>

        <button
          onClick={() => {
            console.log("=== MIDI TEST ===");
            console.log("MIDI Input connected:", midiInRef.current?.name || "none");
            console.log("Play mode active:", playModeRef.current);
            console.log("Current expected notes:", currentStepNotesRef.current);
            console.log("Testing: Play a MIDI key now and watch console...");
          }}
          style={{
            padding: "8px 12px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          🔍 Test MIDI
        </button>

        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 12, color: "#333" }}>Progress: {playIndex} / {totalSteps}</div>
        </div>

        <div style={{ marginLeft: "auto", fontSize: 13 }}>
          MIDI In: {midiInRef.current?.name || "none"} | Out: {midiOutputs.length > 0 ? midiOutputs[0].name : "none"}
        </div>
      </div>

      {/* Keyboard guide */}
      <div style={{ marginBottom: 12, padding: 8, background: "#f5f5f5", borderRadius: 6, fontSize: 12 }}>
        <strong>Keyboard Controls:</strong> Space = Play/Pause | Piano keys: A W S E D F T G Y H U J K (C to C, white & black keys)
      </div>

      {/* Progress bar */}
      <div className="progress-bar" onClick={onProgressClick} style={{ marginBottom: 12 }}>
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Music sheet container */}
      <div
        ref={containerRef}
        id="osmd-container"
        style={{ width: "100%", minHeight: "70vh", background: "white", border: "1px solid #ddd" }}
      />
    </div>
  );
}