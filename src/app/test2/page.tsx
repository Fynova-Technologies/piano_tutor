/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
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

// ========== NEW: Note tracking types ==========
interface PlayedNote {
  midi: number;
  timestamp: number;
  cursorStep: number;
  wasCorrect: boolean; // true if it was at cursor position and in sheet
  graphicalNotes?: any[]; // reference to OSMD graphical notes if found
}

export default function Test2HybridFull() {
  // ========== NEW: Upload State ==========
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const samplerRef = useRef<Sampler | null>(null);
  
  const fallbackXml = "/songs/mxl/happybirthday2.mxl";
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

  // ========== NEW: Track and highlight played notes ==========
  function trackAndHighlightNote(midi: number) {
    if (!osmdRef.current || !playModeRef.current) return;

    const cursorNotes = currentStepNotesRef.current || [];
    
    // Check if this exact MIDI note is at cursor
    const exactMatch = cursorNotes.some(n => Number(n) === Number(midi));
    
    // Also check for octave variations (same pitch class, different octave)
    const pitchClass = midi % 12;
    const octaveMatch = cursorNotes.some(n => (Number(n) % 12) === pitchClass);
    
    console.log('🎹 Note Analysis:', {
      midi,
      cursorStep: currentCursorStepRef.current,
      cursorNotes,
      exactMatch,
      octaveMatch,
      pitchClass
    });
    
    // Find graphical notes - try exact match first
    let matchingNotes = findNotesAtCursorByMidi(osmdRef.current, Number(midi));
    let usedMidi = midi;
    
    // If no exact match but octave match exists, try to find the sheet note
    if (matchingNotes.length === 0 && octaveMatch) {
      const octaveVariant = cursorNotes.find(n => (Number(n) % 12) === pitchClass);
      if (octaveVariant) {
        console.log(`⚠️ Octave mismatch: played ${midi}, sheet has ${octaveVariant}`);
        matchingNotes = findNotesAtCursorByMidi(osmdRef.current, Number(octaveVariant));
        usedMidi = Number(octaveVariant);
      }
    }
    
    // If still no match, try finding ANY note with this MIDI in current measure
    if (matchingNotes.length === 0) {
      matchingNotes = findNoteInCurrentMeasure(osmdRef.current, midi);
      if (matchingNotes.length > 0) {
        console.log(`📍 Found note in measure (not at cursor): ${matchingNotes.length} note(s)`);
      }
    }
    
    // Determine if note is correct
    // Correct = at cursor position AND found in sheet
    const isCorrect = (exactMatch || octaveMatch) && matchingNotes.length > 0;
    
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
      // Note exists in sheet - highlight with appropriate color
      console.log(`✅ Highlighting ${matchingNotes.length} note(s) as ${isCorrect ? 'CORRECT (green)' : 'INCORRECT (red)'}`);
      matchingNotes.forEach((gn) => {
        highlightGraphicalNotePersistent(gn, isCorrect);
      });
    } else {
      // Note not in sheet at all - draw ghost marker (always red)
      console.log(`👻 Drawing ghost note as INCORRECT (not in sheet)`);
      drawGhostNote(osmdRef.current, Number(midi), false);
    }
    
    console.log('Tracked note:', playedNote);
  }

  // ========== NEW: Find note anywhere in current measure ==========
  function findNoteInCurrentMeasure(osmd: any, midi: number): any[] {
    if (!osmd?.cursor) return [];
    
    const measureIndex = osmd.cursor.iterator?.currentMeasureIndex || 0;
    const staffIndex = 0;
    const measure = osmd.GraphicSheet?.MeasureList?.[measureIndex]?.[staffIndex];
    
    if (!measure?.staffEntries) return [];
    
    const foundNotes: any[] = [];
    
    // Search all staff entries in the measure
    for (const entry of measure.staffEntries) {
      if (!entry?.graphicalVoiceEntries) continue;
      
      for (const voiceEntry of entry.graphicalVoiceEntries) {
        if (!voiceEntry?.notes) continue;
        
        for (const note of voiceEntry.notes) {
          const noteMidi = note.sourceNote?.halfTone;
          
          if (noteMidi === midi || noteMidi === midi + 12 || noteMidi === midi - 12) {
            foundNotes.push(note);
            console.log(`Found note in measure: MIDI ${noteMidi} at entry`);
          }
        }
      }
    }
    
    return foundNotes;
  }

  // ========== NEW: Persistent highlight (doesn't fade) ==========
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