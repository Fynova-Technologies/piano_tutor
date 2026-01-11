/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import scoreNotePlayed from "@/features/scores/scorenoteplayed";
import findNotesAtCursorByMidi from "@/features/notes/findNotesatcursor";
import highlightGraphicalNoteNative from "@/features/notes/highlightgraphicalnotes";
import buildPlaybackStepsAndMaps from "@/features/playback/buildplaybacksetpsandmaps";
import pauseCursor from "@/features/playback/pausecursor";
import playCursor from "@/features/playback/playcursor";
import clearHighlight from "@/features/notes/clearhighlight";
import { onProgressClick } from "@/features/utils/onProgressclick";
import RenderOpenMusicSheet from "@/features/components/renderopenmusicsheet";
import CursorControls from "@/features/components/cursorcontrols";
import { useSearchParams } from "next/navigation";
import { CursorType } from "opensheetmusicdisplay";


// ========== NEW: Note tracking types ==========
interface PlayedNote {
  midi: number;
  timestamp: number;
  cursorStep: number;
  wasCorrect: boolean; // true if it was at cursor position and in sheet
  graphicalNotes?: any[]; // reference to OSMD graphical notes if found
}

function Test2HybridFullContent() {
  // ========== NEW: Upload State ==========
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const samplerRef = useRef<Sampler | null>(null);
  const searchparams = useSearchParams();
  const courseTitle = searchparams.get("title") || "Lesson";
  const fileName = searchparams.get("file") || "Wholenotes.mxl";
  
  const fallbackXml = "/songs/mxl/" + fileName;
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
  
  // ===== SCORING STATE =====
  const [score, setScore] = useState<number | null>(null);
  const totalStepsRef = useRef(0);
  const correctStepsRef = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const scoredStepsRef = useRef<Set<number>>(new Set());
  const currentCursorStepRef = useRef<number>(0);
  
  // ========== NEW: Tracking all played notes ==========
  const playedNotesRef = useRef<PlayedNote[]>([]);
  const activeHighlightsRef = useRef<Set<any>>(new Set()); // Track active highlight elements
  
  const cursorsOptions = [
    {
      type: 3,
      color: "#FF0000",
      alpha: 1,
      follow: true,
    },
  ];

  
  
  useEffect(() => {
    const hs = Number(localStorage.getItem("highScore"));
    const ls = Number(localStorage.getItem("lastScore"));
    if (!Number.isNaN(hs)) setHighScore(hs);
    if (!Number.isNaN(ls)) setLastScore(ls);
  }, []);
  
  // inject highlight CSS once
  useEffect(() => {
    const id = "osmd-midi-highlight-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      .vf-note-highlight * { fill: red !important; stroke: red !important; filter: drop-shadow(0 0 6px red) !important; }
      .vf-note-correct * { fill: #4caf50 !important; stroke: #4caf50 !important; filter: drop-shadow(0 0 6px #4caf50) !important; }
      .vf-note-incorrect * { fill: #f44336 !important; stroke: #f44336 !important; filter: drop-shadow(0 0 6px #f44336) !important; }
      .midi-dot { pointer-events: none; }
      .midi-ghost-note-correct { fill: rgba(76, 175, 80, 0.8); stroke: #4caf50; }
      .midi-ghost-note-incorrect { fill: rgba(244, 67, 54, 0.8); stroke: #f44336; }
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

  // ========== OSMD setup ==========
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
        if (!cancelled) {
          osmdRef.current = osmd;
          buildPlaybackStepsAndMaps(osmd,setTotalSteps,setPlayIndex);
        }
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
      const oldCustom = document.getElementById("custom-vertical-cursor");
      if (oldCustom) {
        oldCustom.remove();
      }
    };
  }, [xml]);

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
        for (let i = 0; i < 200; i++) {
          if (sampler.loaded) return;
          await new Promise(r => setTimeout(r, 50));
        }
      };

      await waitForLoaded();

      if (!mounted) { 
        try { 
          sampler.dispose(); 
        } catch (e) {
          console.warn("Disposal error", e);
        } 
        return; 
      }
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
              // Play sound
              if (samplerRef.current && Tone.context.state !== 'running') {
                await Tone.start();
              }
              
              if (samplerRef.current) {
                const noteName = midiToName(key);
                samplerRef.current.triggerAttackRelease(noteName, "8n");
              }

              if (playModeRef.current) {
                scoreNotePlayed(key,playModeRef,currentCursorStepRef,scoredStepsRef,currentStepNotesRef,correctStepsRef);
                
                // ========== NEW: Track and highlight note ==========
                trackAndHighlightNote(key);
              }
            }
          };
        }
      })
      .catch((e) => console.warn("No MIDI access", e));

    return () => {
      active = true;
      try {
        if (midiInRef.current) midiInRef.current.onmidimessage = null;
      } catch {}
    };
  }, []);

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
        if (isPlaying) {
          pauseCursor(osmdRef,setIsPlaying,playModeRef);
        } else {
          // Clear previous tracking when starting new play
          clearAllTracking();
          playCursor({
            osmdRef,
            setIsPlaying,
            playModeRef,
            totalStepsRef,
            correctStepsRef,
            scoredStepsRef,
            currentCursorStepRef,
            currentStepNotesRef,
            setPlayIndex,
            setCurrentStepNotes,
            setScore,
            midiOutputs: midiOutputs as any,
            playbackMidiGuard,
            setCountdown,
            setHighScore,
            setLastScore,
            clearHighlight,
          });
        }
        return;
      }

      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat) {
        ev.preventDefault();
        
        // Play sound
        if (samplerRef.current && Tone.context.state !== 'running') {
          await Tone.start();
        }
        
        if (samplerRef.current) {
          const noteName = midiToName(midiNote);
          samplerRef.current.triggerAttackRelease(noteName, "8n");
        }
        
        // Track and highlight if in play mode
        if (playModeRef.current) {
          scoreNotePlayed(midiNote,playModeRef,currentCursorStepRef,scoredStepsRef,currentStepNotesRef,correctStepsRef);
          trackAndHighlightNote(midiNote);
        }
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying, playIndex]);

  // Replace your trackAndHighlightNote function with this version:

// Replace your trackAndHighlightNote function with this version:

// Replace your trackAndHighlightNote function with this version:

// Replace your trackAndHighlightNote function with this version:

// Replace your trackAndHighlightNote function with this version:

// CRITICAL: Convert OSMD halfTone to MIDI number
// OSMD uses C0 = 0, MIDI uses C0 = 12, so we need to add 12
function osmdToMidi(halfTone: number): number {
  return halfTone + 12;
}

function trackAndHighlightNote(midi: number) {
  if (!osmdRef.current || !playModeRef.current) return;

  // Get current expected notes DIRECTLY from cursor position (in OSMD halfTone)
  const cursorNotesOSMD = getCurrentCursorNotes(osmdRef.current);
  
  // Convert OSMD halfTones to MIDI numbers
  const cursorNotesMIDI = cursorNotesOSMD.map(osmdToMidi);
  
  // Get MIDI note name for easier debugging
  const noteName = midiToNoteName(midi);
  const expectedNames = cursorNotesMIDI.map(m => midiToNoteName(m)).join(', ');
  
  console.log('🎹 Note Analysis:', {
    playedMIDI: midi,
    playedNote: noteName,
    cursorStep: currentCursorStepRef.current,
    osmdHalfTones: cursorNotesOSMD,
    expectedMIDI: cursorNotesMIDI,
    expectedNotes: expectedNames
  });
  
  // Check if this EXACT MIDI note is at cursor
  const exactMatch = cursorNotesMIDI.some(n => Number(n) === Number(midi));
  
  if (!exactMatch) {
    console.warn(`❌ MISMATCH: You played ${noteName} (${midi}), but cursor expects ${expectedNames} (${cursorNotesMIDI.join(', ')})`);
  } else {
    console.log(`✓ EXACT MATCH: You played ${noteName} (${midi}) which is expected at cursor`);
  }
  
  // Find graphical notes - need to search using OSMD halfTone (MIDI - 12)
  const osmdHalfTone = midi - 12;
  const matchingNotes = findNotesAtCursorByMidi(osmdRef.current, osmdHalfTone);
  
  // Determine if note is correct
  const isCorrect = exactMatch && matchingNotes.length > 0;
  
  // Track this played note
  const playedNote: PlayedNote = {
    midi,
    timestamp: Date.now(),
    cursorStep: currentCursorStepRef.current,
    wasCorrect: isCorrect,
    graphicalNotes: matchingNotes.length > 0 ? matchingNotes : undefined
  };
  
  playedNotesRef.current.push(playedNote);
  
  // Highlight the note
  if (matchingNotes.length > 0) {
    console.log(`✅ Highlighting ${matchingNotes.length} note(s) as ${isCorrect ? 'CORRECT (green)' : 'INCORRECT (red)'}`);
    matchingNotes.forEach((gn) => {
      highlightGraphicalNotePersistent(gn, isCorrect);
    });
  } else if (!exactMatch) {
    console.log(`👻 Drawing ghost note as INCORRECT (not expected at cursor)`);
    drawGhostNote(osmdRef.current, Number(midi), false);
  } else {
    console.warn(`⚠️ Note ${midi} (${noteName}) is expected but couldn't find graphical representation`);
  }
  
  console.log('Tracked note:', playedNote);
}

// Helper function to convert MIDI to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}

// Get expected MIDI notes directly from current cursor position
// Returns OSMD halfTone values (need +12 to convert to MIDI)
function getCurrentCursorNotes(osmd: any): number[] {
  if (!osmd?.cursor?.iterator) return [];
  
  const iterator = osmd.cursor.iterator;
  const currentVoiceEntries = iterator.currentVoiceEntries;
  
  if (!currentVoiceEntries) return [];
  
  const halfTones: number[] = [];
  
  console.log('🔍 Analyzing cursor position...');
  
  // Iterate through ALL voice entries at current cursor position
  for (let i = 0; i < currentVoiceEntries.length; i++) {
    const voiceEntry = currentVoiceEntries[i];
    
    if (!voiceEntry?.Notes) continue;
    
    const notes = voiceEntry.Notes;
    
    for (let j = 0; j < notes.length; j++) {
      const note = notes[j];
      const halfTone = note.halfTone;
      
      // Check if it's a rest
      const isRest = note.isRest?.() || note.IsRest || false;
      
      if (typeof halfTone === 'number' && !isRest && !halfTones.includes(halfTone)) {
        halfTones.push(halfTone);
        const midiEquiv = halfTone + 12;
        console.log(`  Found: OSMD halfTone=${halfTone} → MIDI ${midiEquiv} (${midiToNoteName(midiEquiv)})`);
      }
    }
  }
  
  // ALSO check the graphical representation at cursor
  const measureIndex = iterator.currentMeasureIndex;
  const staffIndex = 0;
  
  if (osmd?.GraphicSheet?.MeasureList?.[measureIndex]?.[staffIndex]) {
    const measure = osmd.GraphicSheet.MeasureList[measureIndex][staffIndex];
    const cursorTimestamp = iterator.CurrentSourceTimestamp;
    
    for (const staffEntry of measure.staffEntries || []) {
      const entryTimestamp = staffEntry.timestamp;
      
      if (entryTimestamp?.realValue === cursorTimestamp.realValue) {
        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const halfTone = gn.sourceNote?.halfTone;
            const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
            
            if (typeof halfTone === 'number' && !isRest && !halfTones.includes(halfTone)) {
              halfTones.push(halfTone);
              const midiEquiv = halfTone + 12;
              console.log(`  Found (graphical): OSMD halfTone=${halfTone} → MIDI ${midiEquiv} (${midiToNoteName(midiEquiv)})`);
            }
          }
        }
      }
    }
  }
  
  const midiEquivalents = halfTones.map(h => h + 12);
  const noteNames = midiEquivalents.map(m => midiToNoteName(m)).join(', ');
  console.log(`📍 Current cursor expects: ${noteNames} (MIDI: ${midiEquivalents.join(', ')})`);
  
  return halfTones; // Return OSMD halfTones, caller will convert to MIDI
}

// DIAGNOSTIC: Show all notes in the sheet with their positions
function showAllNotesInSheet(osmd: any) {
  if (!osmd?.cursor?.iterator) return;
  
  console.log('📊 ALL NOTES IN SHEET:');
  console.log('═══════════════════════════════════════');
  
  const iterator = osmd.cursor.iterator;
  iterator.reset();
  
  let stepIndex = 0;
  do {
    const voiceEntries = iterator.currentVoiceEntries || [];
    const timestamp = iterator.CurrentSourceTimestamp;
    
    const notesAtThisStep: number[] = [];
    for (const ve of voiceEntries) {
      const notes = ve.Notes || [];
      for (const n of notes) {
        const midi = n.halfTone;
        if (typeof midi === 'number') {
          notesAtThisStep.push(midi);
        }
      }
    }
    
    if (notesAtThisStep.length > 0) {
      const noteNames = notesAtThisStep.map(m => midiToNoteName(m)).join(', ');
      console.log(`Step ${stepIndex}: ${noteNames} (MIDI: ${notesAtThisStep.join(', ')}) at time ${timestamp.realValue}`);
    }
    
    stepIndex++;
  } while (iterator.moveToNext());
  
  iterator.reset();
  console.log('═══════════════════════════════════════');
}

// REPLACEMENT: More accurate findNotesAtCursorByMidi
// You should replace your existing findNotesAtCursorByMidi with this version
function findNotesAtCursorByMidiFixed(osmd: any, targetMidi: number): any[] {
  if (!osmd?.cursor?.iterator) {
    console.log('No cursor or iterator');
    return [];
  }
  
  const iterator = osmd.cursor.iterator;
  const currentVoiceEntries = iterator.currentVoiceEntries;
  
  if (!currentVoiceEntries) {
    console.log('No current voice entries');
    return [];
  }
  
  const foundGraphicalNotes: any[] = [];
  
  console.log(`🔎 Searching for MIDI ${targetMidi} at cursor position`);
  
  // Iterate through all voice entries at current cursor position
  for (const voiceEntry of currentVoiceEntries) {
    if (!voiceEntry?.notes) continue;
    
    for (const sourceNote of voiceEntry.notes) {
      const noteMidi = sourceNote.halfTone;
      
      console.log(`  - Found source note with MIDI: ${noteMidi}`);
      
      // EXACT match only
      if (noteMidi === targetMidi) {
        // Find the corresponding graphical note
        const graphicalNotes = voiceEntry.parentVoiceEntry?.graphicalVoiceEntry?.notes;
        
        if (graphicalNotes) {
          for (const graphicalNote of graphicalNotes) {
            if (graphicalNote.sourceNote?.halfTone === targetMidi) {
              foundGraphicalNotes.push(graphicalNote);
              console.log(`    ✓ Found matching graphical note`);
            }
          }
        }
      }
    }
  }
  
  console.log(`Total found: ${foundGraphicalNotes.length} graphical notes for MIDI ${targetMidi}`);
  return foundGraphicalNotes;
}

// DIAGNOSTIC: Compare visual position vs stored MIDI
function diagnoseNoteMismatch(osmd: any) {
  if (!osmd?.GraphicSheet?.MeasureList) return;
  
  console.log('🔬 DIAGNOSING NOTE MISMATCH');
  console.log('═══════════════════════════════════════');
  
  const measureList = osmd.GraphicSheet.MeasureList;
  
  for (let measureIndex = 0; measureIndex < measureList.length; measureIndex++) {
    const system = measureList[measureIndex];
    if (!Array.isArray(system)) continue;
    
    for (let staffIndex = 0; staffIndex < system.length; staffIndex++) {
      const gMeasure = system[staffIndex];
      if (!gMeasure?.staffEntries) continue;
      
      console.log(`\nMeasure ${measureIndex}, Staff ${staffIndex}:`);
      console.log(`Clef: ${gMeasure.ParentMusicSystem?.parent?.musicPages?.[0]?.musicSystems?.[0]?.staffLines?.[staffIndex]?.staffLines?.[0]?.clefType || 'unknown'}`);
      
      for (const staffEntry of gMeasure.staffEntries) {
        const timestamp = staffEntry.timestamp?.realValue || 0;
        
        for (const gve of staffEntry.graphicalVoiceEntries || []) {
          for (const gn of gve.notes || []) {
            const sourceMidi = gn.sourceNote?.halfTone;
            const isRest = gn.sourceNote?.isRest?.() || false;
            
            if (isRest || sourceMidi === undefined) continue;
            
            // Get the visual Y position
            const bounds = gn.PositionAndShape?.BoundingRectangle;
            const visualY = bounds?.y || gn.PositionAndShape?.RelativePosition?.y || 0;
            
            // Calculate what MIDI SHOULD be based on visual position
            const stave = gMeasure.stave;
            const staveY = stave?.y || 0;
            const lineSpacing = 10; // typical staff line spacing
            
            // Reference: middle line of treble clef staff is B4 (MIDI 71)
            // For bass clef, middle line is D3 (MIDI 50)
            const clef = gMeasure.ParentStaff?.parent?.instrumentClef?.clefType;
            let expectedMidi;
            
            if (clef === 1) { // Treble clef
              const referenceMidi = 71; // B4 on middle line
              const referenceY = staveY + (2 * lineSpacing);
              const diatonicSteps = Math.round((referenceY - visualY) / (lineSpacing / 2));
              expectedMidi = referenceMidi + diatonicSteps; // rough estimate
            } else { // Bass clef
              const referenceMidi = 50; // D3 on middle line
              const referenceY = staveY + (2 * lineSpacing);
              const diatonicSteps = Math.round((referenceY - visualY) / (lineSpacing / 2));
              expectedMidi = referenceMidi + diatonicSteps;
            }
            
            const difference = sourceMidi - expectedMidi;
            const differenceOctaves = Math.abs(difference) / 12;
            
            console.log(`  Time ${timestamp.toFixed(3)}: Visual Y=${visualY.toFixed(1)}, Stored MIDI=${sourceMidi} (${midiToNoteName(sourceMidi)}), Expected≈${expectedMidi} (${midiToNoteName(expectedMidi)}), Diff=${difference} (${differenceOctaves.toFixed(1)} octaves)`);
            
            if (Math.abs(difference) >= 12) {
              console.warn(`    ⚠️ OCTAVE MISMATCH DETECTED!`);
            }
          }
        }
      }
    }
  }
  
  console.log('═══════════════════════════════════════');
}

// FIX: Apply octave correction if we detect systematic transposition
function getActualMidiFromVisualPosition(osmd: any, graphicalNote: any): number {
  const sourceMidi = graphicalNote.sourceNote?.halfTone;
  if (sourceMidi === undefined) return 0;
  
  // Check if there's a systematic octave shift by examining the clef
  const staffIndex = 0; // adjust if needed
  const measureIndex = osmd.cursor?.iterator?.currentMeasureIndex || 0;
  const measure = osmd.GraphicSheet?.MeasureList?.[measureIndex]?.[staffIndex];
  
  if (!measure) return sourceMidi;
  
  // Get visual Y position
  const bounds = graphicalNote.PositionAndShape?.BoundingRectangle;
  const visualY = bounds?.y || graphicalNote.PositionAndShape?.RelativePosition?.y || 0;
  
  const stave = measure.stave;
  const staveY = stave?.y || 0;
  const lineSpacing = 10;
  
  // Determine clef
  const clef = measure.InitiallyActiveClef?.clefType || 0;
  
  // Calculate expected MIDI from visual position
  let expectedMidi;
  if (clef === 1) { // Treble clef - G clef, G4 on second line from bottom
    const referenceMidi = 67; // G4
    const referenceY = staveY + (3 * lineSpacing); // second line from bottom
    const diatonicSteps = Math.round((referenceY - visualY) / (lineSpacing / 2));
    // Convert diatonic steps to chromatic
    const chromaticSteps = Math.round(diatonicSteps * 1.7); // rough approximation
    expectedMidi = referenceMidi + chromaticSteps;
  } else { // Bass clef - F clef, F3 on second line from top
    const referenceMidi = 53; // F3
    const referenceY = staveY + (1 * lineSpacing); // second line from top
    const diatonicSteps = Math.round((referenceY - visualY) / (lineSpacing / 2));
    const chromaticSteps = Math.round(diatonicSteps * 1.7);
    expectedMidi = referenceMidi + chromaticSteps;
  }
  
  // If there's a systematic 12-note (octave) difference, correct it
  const difference = sourceMidi - expectedMidi;
  if (Math.abs(difference) === 12) {
    console.warn(`🔧 Correcting octave shift: ${sourceMidi} (${midiToNoteName(sourceMidi)}) → ${expectedMidi} (${midiToNoteName(expectedMidi)})`);
    return expectedMidi;
  }
  
  return sourceMidi;
}


  function highlightGraphicalNotePersistent(graphicalNote: any, isCorrect: boolean) {
    if (!graphicalNote?.getSVGGElement) return;
    
    const className = isCorrect ? 'vf-note-correct' : 'vf-note-incorrect';
    const group = graphicalNote.getSVGGElement();
    
    if (group) {
      group.classList.add(className);
      activeHighlightsRef.current.add(group);
    }
  }

  // ========== NEW: Draw ghost note with color coding ==========
  function drawGhostNote(osmd: any, midi: number, isCorrect: boolean) {
    if (!osmd?.cursor) return;

    const cursor = osmd.cursor;
    const svg = osmd.drawer?.backend?.getSvgElement?.() || osmd.drawer?.SVG;
    if (!svg) return;

    const measureIndex = cursor.iterator?.currentMeasureIndex || 0;
    const staffIndex = 0;
    const measure = osmd.GraphicSheet?.MeasureList?.[measureIndex]?.[staffIndex];
    
    if (!measure?.stave) return;

    const stave = measure.stave;
    const cursorElement = cursor.cursorElement;
    const cursorRect = cursorElement.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    const x = cursorRect.left - svgRect.left + 5;

    const lineSpacing = 10;
    const staveY = stave.y;
    
    const midiToDiatonic = (midi: number) => {
      const pitchClass = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
      const diatonicPitch = chromaticToDiatonic[pitchClass];
      return octave * 7 + diatonicPitch;
    };
    
    const clef = measure.InitiallyActiveClef?.clefType;
    let referenceDiatonic;
    let referenceY;
    
    if (clef === 1) {
      referenceDiatonic = midiToDiatonic(50);
      referenceY = staveY + (2 * lineSpacing);
    } else {
      referenceDiatonic = midiToDiatonic(71);
      referenceY = staveY + (2 * lineSpacing);
    }
    
    const noteDiatonic = midiToDiatonic(midi);
    const diatonicSteps = referenceDiatonic - noteDiatonic;
    const y = referenceY + (diatonicSteps * (lineSpacing / 2));

    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", x.toString());
    el.setAttribute("cy", y.toString());
    el.setAttribute("r", "8");
    
    // Color based on correctness
    if (isCorrect) {
      el.classList.add("midi-ghost-note-correct");
    } else {
      el.classList.add("midi-ghost-note-incorrect");
    }
    
    el.setAttribute("stroke-width", "2.5");
    
    svg.appendChild(el);
    activeHighlightsRef.current.add(el);
    
    // Don't remove - keep persistent
  }

  // ========== NEW: Clear all tracking and highlights ==========
  function clearAllTracking() {
    // Clear played notes array
    playedNotesRef.current = [];
    
    // Remove all highlight classes and ghost notes
    activeHighlightsRef.current.forEach((element) => {
      if (element.classList) {
        element.classList.remove('vf-note-correct', 'vf-note-incorrect');
      } else {
        // Ghost note circle - remove from DOM
        element.remove();
      }
    });
    
    activeHighlightsRef.current.clear();
    
    console.log('Cleared all note tracking and highlights');
  }

  // UI
  return (
    <>
      <CursorControls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        osmdRef={osmdRef}
        playModeRef={playModeRef}
        totalStepsRef={totalStepsRef}
        correctStepsRef={correctStepsRef}
        scoredStepsRef={scoredStepsRef}
        currentCursorStepRef={currentCursorStepRef}
        currentStepNotesRef={currentStepNotesRef}
        setPlayIndex={setPlayIndex}
        playIndex={playIndex}
        totalSteps={totalSteps}
        midiOutputs={midiOutputs}
        midiInRef={midiInRef}
        playbackMidiGuard={playbackMidiGuard}
        setCountdown={setCountdown}
        setHighScore={setHighScore}
        setLastScore={setLastScore}
        score={score ?? 0}
        highScore={highScore ?? 0}
        lastScore={lastScore}
        setCurrentStepNotes={setCurrentStepNotes}
        setScore={setScore}
        onProgressClick={onProgressClick}
        containerRef={containerRef}
        countdown={countdown}
        progressPercent={progressPercent}
        courseTitle={courseTitle}
      />
      
      {/* Debug button to clear highlights manually */}
      <button 
        onClick={clearAllTracking}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Clear Highlights
      </button>
    </>
  );
}

export default function Test2HybridFull() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Test2HybridFullContent />
    </Suspense>
  );
}