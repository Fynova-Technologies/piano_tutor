/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export default function Test2HybridFull() {
  // ========== NEW: Upload State ==========
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  
  // Original xml path (fallback)
  const fallbackXml = "/songs/mxl/test000001.mxl";
  
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
      type: 0,
      color: "#FF0000",
      alpha: 1,
      follow: true,
    },
  ];

  // ========== NEW: File Upload Handler ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PNG, JPG, or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      // const data = await response.json();Episode 95
      const raw = await response.text();
console.log("RAW RESPONSE:", raw);

let data;
try {
  data = JSON.parse(raw);
} catch {
  throw new Error("API did not return JSON. Raw response:\n" + raw);
}


      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      // Store the MusicXML content
      setUploadedMusicXML(data.musicxml);
      setShowUploadPanel(false); // Hide upload panel after success
      
      console.log('✅ MusicXML uploaded successfully');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to convert sheet music');
      console.error('Upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

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

  function replaceOsmdCursor(osmd:OpenSheetMusicDisplay) {
    try {
      const img = osmd.cursor.cursorElement;
      if (!img) return;

      try {
        img.style.display = "none";
      } catch {}

      let custom = document.getElementById("custom-vertical-cursor");
      if (!custom) {
        custom = document.createElement("div");
        custom.id = "custom-vertical-cursor";
        custom.style.position = "absolute";
        custom.style.background = "rgba(255, 0, 0, 0.2)";
        custom.style.border = "2px solid rgba(255, 0, 0, 0.7)";
        custom.style.borderRadius = "4px";
        custom.style.pointerEvents = "none";
        custom.style.zIndex = "9999";
        img.parentElement?.appendChild(custom);
      }

      const originalUpdate = osmd.cursor.update?.bind(osmd.cursor);
      if (!originalUpdate) return;

      osmd.cursor.update = function (...args) {
        originalUpdate(...args);

        const el = osmd.cursor.cursorElement;
        if (!el) return;

        try {
          const rect = el.getBoundingClientRect();
          const parentRect = img.parentElement?.getBoundingClientRect();
          if (!parentRect) return;

          // Get the actual staff lines to determine proper height
          const staffLines = img.parentElement?.querySelectorAll('.vf-stave, [class*="StaffLine"]');
          let staffHeight = 100; // Default fallback
          
          if (staffLines && staffLines.length > 0) {
            // Calculate height to cover all staves
            const firstStaff = staffLines[0].getBoundingClientRect();
            const lastStaff = staffLines[staffLines.length - 1].getBoundingClientRect();
            staffHeight = (lastStaff.bottom - firstStaff.top) + 40; // Add padding
          } else {
            // Use a larger multiplier if we can't find staff lines
            staffHeight = rect.height * 3;
          }

          const left = rect.left - parentRect.left+10;
          const top = rect.top - parentRect.top;

          // Wide rectangular cursor covering full staff height
          const cursorWidth = 25;
          const cursorHeight = Math.max(staffHeight, 250); // Ensure minimum height

          custom.style.left = `${Math.round(left - 8)}px`;
          custom.style.top = `${Math.round(top - 30)}px`; // Start higher to cover top of staff
          custom.style.height = `${Math.round(cursorHeight)}px`;
          custom.style.width = `${cursorWidth}px`;
          custom.style.display = 'block'; // Ensure it's visible
        } catch (e) {
          console.warn("error is ", e);
        }
      };
    } catch (e) {
      console.warn("replaceOsmdCursor failed", e);
    }
  }


function findNotesAtCursorByMidi(osmd: any, midi: number) {
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
          const halfTone = n?.sourceNote?.halfTone ?? n?.halfTone;
          if (Number(halfTone) === Number(midi) && !n?.isRestFlag) {
            sourceNotesAtCursor.push(n.sourceNote || n);
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
  
  function highlightGraphicalNoteNative(gn: any, ms = 600) {
    const group = gn?.getSVGGElement?.() || gn?.graphicalNotehead?.svgElement || gn?.svgElement;
    if (!group) return;
    group.classList.add("vf-note-highlight");
    setTimeout(() => group.classList.remove("vf-note-highlight"), ms);
  }

  function getNotesAtCursor(osmd: any) {
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
          const halfTone = n?.sourceNote?.halfTone ?? 
                          n?.sourceNote?.Pitch?.halfTone ??
                          n?.pitch?.Midi ?? 
                          n?.Pitch?.Midi ??
                          n?.halfTone;
          
          if (typeof halfTone === "number" && !n?.isRestFlag) {
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
              type: 0,
              color: "#FF0000",
              alpha: 1,
              follow: true
            }
          ]
        });
        await osmd.render();
        osmd.cursor.show();
        osmd.cursor.reset();

        osmdRef.current = osmd;
        replaceOsmdCursor(osmd);
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
  }, [xml]); // ← IMPORTANT: Re-run when xml changes!

  function buildPlaybackStepsAndMaps(osmd: any) {
    const it = osmd.cursor.iterator.clone();
    const durations: number[] = [];
    const midiToIndex = new Map<number, number>();
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

    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }

    osmd.cursor.show();
    setIsPlaying(true);
    playModeRef.current = true;

    let idx = Math.max(0, playIndex);

    const sendMidiForStep = (index: number) => {
      const it = osmd.cursor.iterator.clone();
      let i = 0;
      while (!it.EndReached && i < index) {
        it.moveToNext();
        i++;
      }
      const ves = it.CurrentVoiceEntries || [];
      for (const ve of ves) {
        for (const n of ve.Notes || []) {
          const half = n?.sourceNote?.halfTone;
          if (typeof half === "number") {
            const midiNote = half;
            const velocity = 0x50;
            try {
              if (midiOutputs.length > 0) {
                playbackMidiGuard.current += 1;
                midiOutputs[0].send([0x90, midiNote, velocity]);

                const offDelay = Math.max(100, (osmd as any)._playbackDurations?.[index] ?? 200);
                const when = window.performance.now() + offDelay;
                midiOutputs[0].send([0x80, midiNote, 0x40], when);

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
      
      const stepNotes = getNotesAtCursor(osmd);
      setCurrentStepNotes(stepNotes);
      currentStepNotesRef.current = stepNotes;
      
      osmd.cursor.next();
      setPlayIndex(idx);
      sendMidiForStep(idx);

      const delay = steps[idx] ?? 200;
      idx++;
      osmd._playTimer = setTimeout(step, delay);
    }

    step();
  }

  function seekTo(index: number) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (!((osmd as any)._playbackDurations?.length)) return;
    index = Math.max(0, Math.min(index, (osmd as any)._playbackDurations.length - 1));
    osmd.cursor.reset();
    for (let i = 0; i < index; ++i) osmd.cursor.next();
    setPlayIndex(index);
  }

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
          
          input.onmidimessage = (ev) => {
            const [status, key, velocity] = ev.data as Uint8Array;
            
            const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;

            if (playbackMidiGuard.current > 0) {
              return;
            }

            if (isNoteOn) {
              if (playModeRef.current) {
                const cursorNotes = currentStepNotesRef.current || [];

                if (cursorNotes.some(n => Number(n) === Number(key))) {
                  const matchingNotes = findNotesAtCursorByMidi(osmdRef.current,Number(key));
                  matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
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

  useEffect(() => {
    const keyToMidi: Record<string, number> = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
      't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72,
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (isPlaying) pauseCursor();
        else playCursor();
        return;
      }

      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat && playModeRef.current) {
        ev.preventDefault();
        
        const cursorNotes = currentStepNotesRef.current || [];

        if (cursorNotes.some(n => Number(n) === Number(midiNote))) {
          const matchingNotes = findNotesAtCursorByMidi(osmdRef.current,Number(midiNote));
          matchingNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 1500));
        } else {
          const wrongNotes = findNotesAtCursorByMidi(osmdRef.current,Number(midiNote));
          wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
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
              onChange={handleFileUpload}
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