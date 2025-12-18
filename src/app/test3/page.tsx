/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import replaceOsmdCursor from "@/features/utils/replaceOsmdCursor";
import handleFileUpload from "@/features/utils/fileupload";
import findNotesAtCursorByMidi from "@/features/notes/findNotesatcursor";
import highlightGraphicalNoteNative from "@/features/notes/highlightgraphicalnotes";
import getNotesAtCursor from "@/features/notes/getNotesatcursor";
import buildPlaybackStepsAndMaps from "@/features/playback/buildplaybacksetpsandmaps";
import pauseCursor from "@/features/playback/pausecursor";

export default function Test3HybridFull() {
  // ========== NEW: Upload State ==========
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const samplerRef = useRef<Sampler | null>(null); // sampler will replace PolySynth
  const playedNotesRef = useRef<Set<number>>(new Set());         
  // Original xml path (fallback)
  const fallbackXml = "/songs/mxl/EasyC.mxl";
  // Use uploaded XML if available, otherwise use fallback
  const xml = uploadedMusicXML || fallbackXml;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<any>(null);
  // playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const midiInRef = useRef<MIDIInput | null>(null);
  const [currentStepNotes, setCurrentStepNotes] = useState<number[]>([]);
  const currentStepNotesRef = useRef<number[]>([]);

  const playbackMidiGuard = useRef<number>(0);
  const playModeRef = useRef<boolean>(false);

  const cursorsOptions = [
    {
      type: 1,
      color: "#FF0000",
      alpha: 1,
      follow: true,
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
      .upload-panel { background: #f8f9fa; border: 2px dashed #ddd; border-radius: 8px; padding: 24px; margin-bottom: 16px; text-align: center; }
      .upload-panel.dragging { border-color: #4caf50; background: #e8f5e9; }
      .upload-btn { padding: 12px 24px; background: #4caf50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
      .upload-btn:hover { background: #45a049; }
      .upload-btn:disabled { background: #ccc; cursor: not-allowed; }
      .error-box { background: #ffebee; border: 1px solid #f44336; color: #c62828; padding: 12px; border-radius: 6px; margin-top: 12px; }
      .success-box { background: #e8f5e9; border: 1px solid #4caf50; color: #2e7d32; padding: 12px; border-radius: 6px; margin-top: 12px; }
    `;
    document.head.appendChild(style);
  }, []);

  // ========== OSMD setup (now reacts to xml changes) ==========
  useEffect(() => {
    if (!containerRef.current) return;

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      backend: "svg",
      autoResize: true,
      drawingParameters: "default",
      followCursor: true,
      cursorsOptions: cursorsOptions,
    });
    let cancelled = false;
    (async () => {
      try {
        await osmd.load(xml);
        await osmd.render();

        osmd.setOptions({
          cursorsOptions: [
            {
              type: 1,
              color: "#FF0000",
              alpha: 0.8,
              follow: true,
            }
          ]
        });
        await osmd.render();
        osmd.cursor.show();
        osmd.cursor.reset();

        if (!cancelled) {
          osmdRef.current = osmd;

          // Small delay to ensure DOM is ready
          setTimeout(() => {
            replaceOsmdCursor(osmd);
          }, 100);

          buildPlaybackStepsAndMaps(osmd,setTotalSteps,setPlayIndex);
        }
        
        // Initialize cursor notes on load
        const initialNotes = getNotesAtCursor(osmd);
        setCurrentStepNotes(initialNotes);
        currentStepNotesRef.current = initialNotes;
      } catch (e) {
        console.error("OSMD load/render error", e);
      }
    })();

    const onResize = () => {
      try {
        osmd.render();
        // Reapply custom cursor after resize
        if (osmdRef.current) {
          setTimeout(() => replaceOsmdCursor(osmdRef.current), 50);
        }
      } catch {}
    };
    window.addEventListener("resize", onResize);

  return () => {
    cancelled = true;
    window.removeEventListener("resize", onResize);
    // Clean up custom cursor
    const oldCustom = document.getElementById("custom-vertical-cursor");
    if (oldCustom) {
      oldCustom.remove();
    }
  };
  }, [xml]); // ← IMPORTANT: Re-run when xml changes!

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
    playedNotesRef.current.clear();
    clearHighlight(osmd);
    document.querySelectorAll(".vf-note-highlight").forEach((el) => el.classList.remove("vf-note-highlight"));
    
    // Reset to first position notes
    const initialNotes = getNotesAtCursor(osmd);
    setCurrentStepNotes(initialNotes);
    currentStepNotesRef.current = initialNotes;
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
    osmd.cursor.show();
    setIsPlaying(true);
    playModeRef.current = true;    
    // Get current cursor notes
    const stepNotes = getNotesAtCursor(osmd);
    setCurrentStepNotes(stepNotes);
    currentStepNotesRef.current = stepNotes;
    playedNotesRef.current.clear();
  }

  function seekTo(index: number) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (!((osmd as any)._playbackDurations?.length)) return;
    index = Math.max(0, Math.min(index, (osmd as any)._playbackDurations.length - 1));
    osmd.cursor.reset();
    for (let i = 0; i < index; ++i) osmd.cursor.next();
    setPlayIndex(index);
    
    // Update current notes after seeking
    const stepNotes = getNotesAtCursor(osmd);
    setCurrentStepNotes(stepNotes);
    currentStepNotesRef.current = stepNotes;
    playedNotesRef.current.clear();
  }

  // Function to advance cursor when all notes are played
  function advanceCursorIfComplete() {
    const osmd = osmdRef.current;
    if (!osmd || !playModeRef.current) return;
    
    const requiredNotes = currentStepNotesRef.current;
    const playedNotes = playedNotesRef.current;
    
    // Check if all required notes have been played
    const allPlayed = requiredNotes.every(note => playedNotes.has(note));
    
    if (allPlayed && requiredNotes.length > 0) {
      // Move to next cursor position
      osmd.cursor.next();
      const newIndex = playIndex + 1;
      setPlayIndex(newIndex);
      
      // Get new notes at cursor
      const stepNotes = getNotesAtCursor(osmd);
      setCurrentStepNotes(stepNotes);
      currentStepNotesRef.current = stepNotes;
      playedNotesRef.current.clear();
      
      // Check if we reached the end
      const totalSteps = (osmd as any)._playbackDurations?.length ?? 0;
      if (newIndex >= totalSteps) {
        setIsPlaying(false);
        playModeRef.current = false;
      }
    }
  }

  useEffect(() => {
      let mounted = true;
      async function createSampler() {
        const sampler = new Sampler({
          urls: {
            A0: "A0.mp3",
            C1: "C1.mp3",
            "D#1": "Ds1.mp3",
            "F#1": "Fs1.mp3",
            A1: "A1.mp3",
            C2: "C2.mp3",
            "D#2": "Ds2.mp3",
            "F#2": "Fs2.mp3",
            A2: "A2.mp3",
            C3: "C3.mp3",
            "D#3": "Ds3.mp3",
            "F#3": "Fs3.mp3",
            A3: "A3.mp3",
            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            A4: "A4.mp3",
            C5: "C5.mp3",
            "D#5": "Ds5.mp3",
            "F#5": "Fs5.mp3",
            A5: "A5.mp3",
            C6: "C6.mp3",
            "D#6": "Ds6.mp3",
            "F#6": "Fs6.mp3",
            A6: "A6.mp3",
            C7: "C7.mp3",
            "D#7": "Ds7.mp3",
            "F#7": "Fs7.mp3",
            A7: "A7.mp3",
            C8: "C8.mp3"
          },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1
        }).toDestination();
  
        
        const waitForLoaded = async () => {
          for (let i = 0; i < 200; i++) { // wait up to ~10s
            if (sampler.loaded || sampler.loaded) return;
            await new Promise(r => setTimeout(r, 50));
          }
        };
  
        await waitForLoaded();
  
        if (!mounted) { try { sampler.dispose(); } catch (e) {console.warn("You have an error ",e)} ; return; }
        samplerRef.current = sampler;
      }
  
      createSampler();
      return () => { mounted = false; };
    }, []);
  

  useEffect(() => {
    if (!("requestMIDIAccess" in navigator)) return;
    let active = true;
    let midiAccess: MIDIAccess | null = null;

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((m) => {
        if (!active) return;
        midiAccess = m;
        
        const outs: MIDIOutput[] = [];
        m.outputs.forEach((o) => outs.push(o));
        setMidiOutputs(outs);

        let inputCount = 0;
        for (const input of m.inputs.values()) {
          inputCount++;
          
          if (inputCount === 1) {
            midiInRef.current = input;
          }
          
            input.onmidimessage = async (ev) => {
            const [status, key, velocity] = ev.data as Uint8Array;
            
            const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;

            if (playbackMidiGuard.current > 0) {
              return;
            }

            if (isNoteOn) {
              // Play sound using Tone.js sampler
              if (samplerRef.current && Tone.context.state !== 'running') {
                await Tone.start();
              }
              
              if (samplerRef.current) {
                const noteName = midiToName(key);
                samplerRef.current.triggerAttackRelease(noteName, "8n");
              }
              
              // Visual feedback only in play mode
              if (playModeRef.current) {
                const cursorNotes = currentStepNotesRef.current || [];

                if (cursorNotes.some(n => Number(n) === Number(key))) {
                  const matchingNotes = findNotesAtCursorByMidi(osmdRef.current,Number(key));
                  matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
                  
                  // Mark note as played
                  playedNotesRef.current.add(key);
                  
                  // Check if all notes are now played and advance cursor
                  advanceCursorIfComplete();
                } else {
                  const wrongNotes = findNotesAtCursorByMidi(osmdRef.current,Number(key));
                  wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
                }
              }
            }
          };
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

  const progressPercent = totalSteps ? Math.round((playIndex / Math.max(1, totalSteps - 1)) * 100) : 0;
  
  function midiToName(num:number) {
    const octave = Math.floor(num / 12) - 1;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return names[(num % 12 + 12) % 12] + octave;
  }

useEffect(() => {
    const keyToMidi: Record<string, number> = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
      't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72,
    };

    const onKey = async (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (isPlaying) pauseCursor(osmdRef, setIsPlaying,playModeRef);
        else playCursor();
        return;
      }

      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat) {
        ev.preventDefault();
        
        // Play sound using Tone.js sampler
        if (samplerRef.current && Tone.context.state !== 'running') {
          await Tone.start();
        }
        
        if (samplerRef.current) {
          const noteName = midiToName(midiNote);
          samplerRef.current.triggerAttackRelease(noteName, "8n");
        }
        
        // Only check correctness if in play mode
        if (playModeRef.current) {
          const cursorNotes = currentStepNotesRef.current || [];

          if (cursorNotes.some(n => Number(n) === Number(midiNote))) {
            const matchingNotes = findNotesAtCursorByMidi(osmdRef.current,Number(midiNote));
            matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
            
            // Mark note as played
            playedNotesRef.current.add(midiNote);
            
            // Check if all notes are now played and advance cursor
            advanceCursorIfComplete();
          } else {
            const wrongNotes = findNotesAtCursorByMidi(osmdRef.current,Number(midiNote));
            wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
          }
        }
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, playIndex]);


  // UI
  return (
    <div style={{ padding: 16 }}>
      {/* ========== NEW: Upload Panel ========== */}
      {showUploadPanel && (
        <div className="upload-panel">
          <h2 style={{ marginTop: 0 }}>Upload Sheet Music Image</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Convert your sheet music image to MusicXML and play it
          </p>
          
          <label className="upload-btn">
            {uploadLoading ? '⏳ Converting...' : '📁 Choose Image (PNG/JPG/PDF)'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={e =>handleFileUpload(e, setUploadError, setUploadLoading, setUploadedMusicXML, setShowUploadPanel)}
              disabled={uploadLoading}
              style={{ display: 'none' }}
            />
          </label>

          {uploadError && (
            <div className="error-box">
              <strong>❌ Error:</strong> {uploadError}
            </div>
          )}

          {uploadedMusicXML && (
            <div className="success-box">
              <strong>✅ Success!</strong> Sheet music loaded and ready to play
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
            <strong>Or continue with default song</strong>
            <button
              onClick={() => setShowUploadPanel(false)}
              style={{
                display: 'block',
                margin: '8px auto 0',
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Use Default Song
            </button>
          </div>
        </div>
      )}

      {!showUploadPanel && (
        <div style={{ marginBottom: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#666' }}>
            {uploadedMusicXML ? '📄 Uploaded Sheet' : '📄 Default Song'}
          </span>
          <button
            onClick={() => {
              setShowUploadPanel(true);
              setUploadError(null);
            }}
            style={{
              padding: '4px 8px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            🔄 Upload New
          </button>
        </div>
      )}

      {/* ========== Original Controls ========== */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => {
            if (isPlaying) {
              pauseCursor(osmdRef, setIsPlaying,playModeRef);
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

      <div style={{ marginBottom: 12, padding: 8, background: "#f5f5f5", borderRadius: 6, fontSize: 12 }}>
        <strong>Keyboard Controls:</strong> Space = Play/Pause | Piano keys: A W S E D F T G Y H U J K (C to C, white & black keys)
      </div>

      <div className="progress-bar" onClick={onProgressClick} style={{ marginBottom: 12 }}>
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div
        ref={containerRef}
        id="osmd-container"
        style={{ width: "100%", minHeight: "70vh", background: "white", border: "1px solid #ddd" }}
      />
    </div>
  );
}