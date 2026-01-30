/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import scoreNotePlayed from "@/features/scores/scorenoteplayed";
import CursorControls from "@/features/components/cursorcontrols";
import { useSearchParams } from "next/navigation";
import { BeatCursor } from "@/features/playback/beatcursor";

interface PlayedNote {
  midi: number;
  timestamp: number;
  cursorStep: number;
  wasCorrect: boolean;
  graphicalNotes?: any[];
}

function Test2HybridFullContent() {
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const samplerRef = useRef<Sampler | null>(null);
  const searchparams = useSearchParams();
  const courseTitle = searchparams.get("title") || "Lesson";
  const fileName = searchparams.get("file") || "Wholenotes.mxl";
  
  const fallbackXml = "/songs/" + fileName;
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
  
  const playedNotesRef = useRef<PlayedNote[]>([]);
  const activeHighlightsRef = useRef<Set<any>>(new Set());
  const beatCursorRef = useRef<BeatCursor | null>(null);
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  
  useEffect(() => {
    const hs = Number(localStorage.getItem("highScore"));
    const ls = Number(localStorage.getItem("lastScore"));
    if (!Number.isNaN(hs)) setHighScore(hs);
    if (!Number.isNaN(ls)) setLastScore(ls);
  }, []);
  
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
    `;
    document.head.appendChild(style);
  }, []);

  // ========== FIXED OSMD SETUP ==========
  useEffect(() => {
    if (!containerRef.current) return;
    
    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      backend: "svg",
      autoResize: true,
      drawingParameters: "default",
      followCursor: false,
    });
    
    let cancelled = false;
    
    (async () => {
      try {
        await osmd.load(xml);
        
        const rules = osmd.EngravingRules;
        rules.MinimumDistanceBetweenSystems = 5;
        rules.MeasureLeftMargin = 12;
        rules.MeasureRightMargin = 12;
        rules.ClefLeftMargin = 12;
        rules.ClefRightMargin = 12;
        rules.PageLeftMargin = 4;
        rules.KeyRightMargin = 6;
        rules.MinNoteDistance = 6;
        rules.VoiceSpacingMultiplierVexflow = 2.25;
        rules.StaffHeight = 12;
        
        await osmd.render();
        
        if (cancelled) return;
        
        osmdRef.current = osmd;
        
        // Hide default cursor
        if (osmd.cursor) {
          osmd.cursor.hide();
        }
        
        // IMPORTANT: Wait for render to complete and layout to stabilize
        setTimeout(() => {
          if (cancelled || !osmdRef.current) return;
          
          console.log("=== Creating Beat Cursor ===");
          console.log("GraphicSheet exists:", !!osmdRef.current.GraphicSheet);
          console.log("Measures:", osmdRef.current.GraphicSheet?.MeasureList?.length);
          
          try {
            const beatCursor = new BeatCursor(osmdRef.current);
            beatCursorRef.current = beatCursor;
            
            const totalBeats = beatCursor.getTotalBeats();
            setTotalSteps(totalBeats);
            totalStepsRef.current = totalBeats;
            setCurrentBeatIndex(0);
            
            // Update current step notes
            const expectedMIDI = beatCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
            
            console.log(`✅ Beat cursor initialized: ${totalBeats} beats`);
            console.log(`Initial expected notes:`, expectedMIDI);
          } catch (error) {
            console.error("❌ Failed to create beat cursor:", error);
          }
        }, 200); // Increased delay to ensure full render
        
      } catch (e) {
        console.error("OSMD load/render error:", e);
      }
    })();
    
    const onResize = () => {
      try {
        if (!osmdRef.current) return;
        osmd.render();
        
        // Don't recreate cursor during active playback - just refresh positions
        setTimeout(() => {
          if (beatCursorRef.current && osmdRef.current) {
            const currentIndex = beatCursorRef.current.getCurrentIndex();
            
            // Only recreate if not playing, otherwise just refresh
            if (!playModeRef.current) {
              beatCursorRef.current.destroy();
              const newCursor = new BeatCursor(osmdRef.current);
              newCursor.setPosition(currentIndex);
              beatCursorRef.current = newCursor;
              console.log("Cursor recreated after resize at position", currentIndex);
            } else {
              // Just refresh positions without recreating
              beatCursorRef.current.refreshPositions();
              console.log("Cursor positions refreshed during playback");
            }
          }
        }, 200);
      } catch (e) {
        console.error("Resize error:", e);
      }
    };
    
    window.addEventListener("resize", onResize);
    
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (beatCursorRef.current) {
        beatCursorRef.current.destroy();
      }
    };
  }, [xml]);

  // ========== SAMPLER SETUP ==========
  useEffect(() => {
    let mounted = true;
    async function createSampler() {
      const sampler = new Sampler({
        urls: {
          A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
          A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
          A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
          A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
          A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
          A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
          A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
          A7: "A7.mp3", C8: "C8.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1
      }).toDestination();

      for (let i = 0; i < 200; i++) {
        if (sampler.loaded) break;
        await new Promise(r => setTimeout(r, 50));
      }

      if (!mounted) { 
        try { sampler.dispose(); } catch (e) {}
        return; 
      }
      samplerRef.current = sampler;
    }

    createSampler();
    return () => { mounted = false; };
  }, []);

  // ========== MIDI SETUP ==========
  useEffect(() => {
    if (!("requestMIDIAccess" in navigator)) return;
    let active = true;
    let midiAccess: MIDIAccess | null = null;

    navigator.requestMIDIAccess({ sysex: false })
      .then((m) => {
        if (!active) return;
        midiAccess = m;
        
        const outs: MIDIOutput[] = [];
        m.outputs.forEach((o) => outs.push(o));
        setMidiOutputs(outs);

        let inputCount = 0;
        for (const input of m.inputs.values()) {
          inputCount++;
          if (inputCount === 1) midiInRef.current = input;
          
          input.onmidimessage = async (ev) => {
            const [status, key, velocity] = ev.data as Uint8Array;
            const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;

            if (playbackMidiGuard.current > 0) return;

            if (isNoteOn) {
              if (samplerRef.current && Tone.context.state !== 'running') {
                await Tone.start();
              }
              
              if (samplerRef.current) {
                const noteName = midiToName(key);
                samplerRef.current.triggerAttackRelease(noteName, "8n");
              }

              if (playModeRef.current) {
                scoreNotePlayed(key, playModeRef, currentCursorStepRef, scoredStepsRef, 
                               currentStepNotesRef, correctStepsRef);
                trackAndHighlightNote(key);
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

  const progressPercent = totalSteps ? Math.round((currentBeatIndex / Math.max(1, totalSteps - 1)) * 100) : 0;
  
  function midiToName(num: number) {
    const octave = Math.floor(num / 12) - 1;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return names[(num % 12 + 12) % 12] + octave;
  }

  // ========== KEYBOARD HANDLER ==========
  useEffect(() => {
    const keyToMidi: Record<string, number> = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
      't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71, 'k': 72,
    };

    const onKey = async (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (isPlaying) {
          pausePlayback();
        } else {
          startPlayback();
        }
        return;
      }

      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat) {
        ev.preventDefault();
        
        if (samplerRef.current && Tone.context.state !== 'running') {
          await Tone.start();
        }
        
        if (samplerRef.current) {
          const noteName = midiToName(midiNote);
          samplerRef.current.triggerAttackRelease(noteName, "8n");
        }
        
        if (playModeRef.current) {
          trackAndHighlightNote(midiNote);
        }
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlaying]);

  // ========== PLAYBACK CONTROL ==========
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tempo, setTempo] = useState(120); // BPM

  function startPlayback() {
    if (!beatCursorRef.current) {
      console.error("Cannot start - beat cursor not initialized");
      return;
    }
    
    clearAllTracking();
    playedNotesAtBeatRef.current.clear(); // Clear the tracking map
    beatCursorRef.current.reset();
    setCurrentBeatIndex(0);
    setIsPlaying(true);
    playModeRef.current = true;
    
    totalStepsRef.current = beatCursorRef.current.getTotalBeats();
    correctStepsRef.current = 0;
    scoredStepsRef.current.clear();
    currentCursorStepRef.current = 0;
    
    // Update expected notes for first beat
    const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
    setCurrentStepNotes(expectedMIDI);
    currentStepNotesRef.current = expectedMIDI;
    
    setCountdown(3);
    let countdownValue = 3;
    const countdownInterval = setInterval(() => {
      countdownValue--;
      setCountdown(countdownValue);
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        setCountdown(null);
        
        // Tell cursor that playback is starting
        if (beatCursorRef.current) {
          beatCursorRef.current.startPlayback();
        }
        
        // Start automatic beat advancement
        startAutomaticPlayback();
      }
    }, 1000);
    
    console.log("🎵 Playback started");
  }

  function startAutomaticPlayback() {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    
    // Calculate beat duration in milliseconds
    const beatDuration = (60 / tempo) * 1000;
    
    console.log(`🎵 Starting automatic playback at ${tempo} BPM (${beatDuration}ms per beat)`);
    
    playbackIntervalRef.current = setInterval(() => {
      if (!playModeRef.current || !beatCursorRef.current) {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        return;
      }
      
      const currentIdx = beatCursorRef.current.getCurrentIndex();
      console.log(`⏱️ Auto-advance from beat ${currentIdx}`);
      
      // Before advancing, check if the current beat had expected notes that weren't played
      const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
      const playedAtThisBeat = playedNotesAtBeatRef.current.get(currentIdx) || new Set();
      
      // Draw feedback for expected notes that weren't played
      for (const expectedNote of expectedMIDI) {
        if (!playedAtThisBeat.has(expectedNote)) {
          console.log(`❌ Missed note at beat ${currentIdx}: ${midiToNoteName(expectedNote)}`);
          // Draw red dot for missed note
          drawFeedbackDotForBeat(osmdRef.current, expectedNote, false, beatCursorRef.current.getCurrentBeat());
        }
      }
      
      // Advance cursor automatically
      const moved = beatCursorRef.current.next();
      if (moved) {
        const newIndex = beatCursorRef.current.getCurrentIndex();
        
        // Sanity check: make sure we're moving forward
        if (newIndex <= currentIdx) {
          console.error(`❌ Cursor moved backwards! ${currentIdx} -> ${newIndex}`);
          return;
        }
        
        setCurrentBeatIndex(newIndex);
        currentCursorStepRef.current = newIndex;
        setPlayIndex(newIndex);
        
        const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
        setCurrentStepNotes(expectedMIDI);
        currentStepNotesRef.current = expectedMIDI;
        
        console.log(`⏭️ Auto-advanced to beat ${newIndex}`);
      } else {
        // End of piece - check last beat too
        const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
        const playedAtThisBeat = playedNotesAtBeatRef.current.get(currentIdx) || new Set();
        for (const expectedNote of expectedMIDI) {
          if (!playedAtThisBeat.has(expectedNote)) {
            drawFeedbackDotForBeat(osmdRef.current, expectedNote, false, beatCursorRef.current.getCurrentBeat());
          }
        }
        
        console.log('🏁 Reached end of piece');
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        handleEndOfPiece();
      }
    }, beatDuration);
  }

  function pausePlayback() {
    setIsPlaying(false);
    playModeRef.current = false;
    
    // Stop automatic playback
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    // Tell cursor that playback stopped
    if (beatCursorRef.current) {
      beatCursorRef.current.stopPlayback();
    }
    
    console.log("⏸️ Playback paused");
  }

  function handleEndOfPiece() {
    setIsPlaying(false);
    playModeRef.current = false;
    
    // Stop automatic playback
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    // Tell cursor that playback stopped
    if (beatCursorRef.current) {
      beatCursorRef.current.stopPlayback();
    }
    
    const finalScore = totalStepsRef.current > 0
      ? Math.round((correctStepsRef.current / totalStepsRef.current) * 100)
      : 0;
    
    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", finalScore.toString());
    
    if (highScore === null || finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("highScore", finalScore.toString());
    }
    
    console.log(`🎉 Piece complete! Score: ${finalScore}%`);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // ========== NOTE TRACKING ==========
  const playedNotesAtBeatRef = useRef<Map<number, Set<number>>>(new Map());
  
  function trackAndHighlightNote(midi: number) {
    if (!beatCursorRef.current || !playModeRef.current) return;

    const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
    const noteName = midiToNoteName(midi);
    const expectedNames = expectedMIDI.map(m => midiToNoteName(m)).join(', ');
    
    const currentBeat = beatCursorRef.current.getCurrentBeat();
    console.log('🎹 Note Analysis:', {
      played: `${noteName} (${midi})`,
      beat: currentBeatIndex,
      beatX: currentBeat?.staffEntryX?.toFixed(2),
      expected: expectedNames || 'Rest',
      expectedMIDI: expectedMIDI
    });
    
    const exactMatch = expectedMIDI.includes(midi);
    const isCorrect = exactMatch;
    
    // Track which notes were played at this beat
    if (!playedNotesAtBeatRef.current.has(currentBeatIndex)) {
      playedNotesAtBeatRef.current.set(currentBeatIndex, new Set());
    }
    playedNotesAtBeatRef.current.get(currentBeatIndex)!.add(midi);
    
    const playedNote: PlayedNote = {
      midi,
      timestamp: Date.now(),
      cursorStep: currentBeatIndex,
      wasCorrect: isCorrect,
      graphicalNotes: undefined
    };
    
    playedNotesRef.current.push(playedNote);
    
    // Always draw a dot at the cursor position for visual feedback
    console.log(`${isCorrect ? '✅' : '❌'} Drawing feedback dot at cursor position`);
    drawFeedbackDot(osmdRef.current, midi, isCorrect);
    
    // Note: We don't advance cursor here anymore - it moves automatically
    // Just track if the note was correct for scoring
    if (isCorrect) {
      console.log('✅ Correct note played!');
    } else {
      console.log('❌ Incorrect note');
    }
  }

  function advanceCursor() {
    if (!beatCursorRef.current) return;
    
    const moved = beatCursorRef.current.next();
    if (moved) {
      const newIndex = beatCursorRef.current.getCurrentIndex();
      setCurrentBeatIndex(newIndex);
      currentCursorStepRef.current = newIndex;
      setPlayIndex(newIndex); // ADD THIS - updates progress bar and triggers re-render
      
      const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
      setCurrentStepNotes(expectedMIDI);
      currentStepNotesRef.current = expectedMIDI;
      
      console.log(`➡️ Advanced to beat ${newIndex}`, {
        x: beatCursorRef.current.getCurrentBeat()?.staffEntryX,
        expectedNotes: expectedMIDI
      });
    } else {
      console.log('🏁 Reached end of piece');
      handleEndOfPiece();
    }
  }

  function midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteName = noteNames[midi % 12];
    return `${noteName}${octave}`;
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

  // NEW FUNCTION: Draw feedback dot at the cursor position
  function drawFeedbackDot(osmd: any, midi: number, isCorrect: boolean) {
    if (!beatCursorRef.current) return;
    const beat = beatCursorRef.current.getCurrentBeat();
    drawFeedbackDotForBeat(osmd, midi, isCorrect, beat);
  }

  // Helper function to draw feedback dot at a specific beat
  function drawFeedbackDotForBeat(osmd: any, midi: number, isCorrect: boolean, beat: any) {
    if (!beat || beat.staffEntryX === undefined) return;

    const svg = osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) return;

    const graphicSheet = osmd.GraphicSheet;
    const measureList = graphicSheet?.MeasureList?.[beat.measureIndex];
    const measure = measureList?.[0];
    
    if (!measure) return;

    const lineSpacing = 10;
    
    // Get unit conversion
    const unitInPixels = osmd.drawer?.backend?.getInnerElement?.()?.offsetWidth 
      ? osmd.drawer.backend.getInnerElement().offsetWidth / graphicSheet.ParentMusicSheet.pageWidth
      : 10;
    
    const measureY = (measure.PositionAndShape?.AbsolutePosition?.y ?? 0) * unitInPixels;
    
    const midiToDiatonic = (midi: number) => {
      const pitchClass = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
      const diatonicPitch = chromaticToDiatonic[pitchClass];
      return octave * 7 + diatonicPitch;
    };
    
    const clef = measure.InitiallyActiveClef?.clefType;
    let referenceDiatonic, referenceY;
    
    if (clef === 1) { // Treble
      referenceDiatonic = midiToDiatonic(50);
      referenceY = measureY + (2 * lineSpacing);
    } else { // Bass
      referenceDiatonic = midiToDiatonic(71);
      referenceY = measureY + (2 * lineSpacing);
    }
    
    const noteDiatonic = midiToDiatonic(midi);
    const diatonicSteps = referenceDiatonic - noteDiatonic;
    const y = referenceY + (diatonicSteps * (lineSpacing / 2));

    // KEY FIX: Use the cursor's X position (beat.staffEntryX) instead of note position
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("cx", beat.staffEntryX.toString());
    el.setAttribute("cy", y.toString());
    el.setAttribute("r", "8");
    el.classList.add(isCorrect ? "midi-ghost-note-correct" : "midi-ghost-note-incorrect");
    el.setAttribute("stroke-width", "2.5");
    
    svg.appendChild(el);
    activeHighlightsRef.current.add(el);
    
    console.log(`🔴 Dot drawn at X=${beat.staffEntryX.toFixed(1)}, Y=${y.toFixed(1)}, correct=${isCorrect}`);
  }

  function drawGhostNote(osmd: any, midi: number, isCorrect: boolean) {
    // This is now just a wrapper - keeping for backwards compatibility
    drawFeedbackDot(osmd, midi, isCorrect);
  }

  function clearAllTracking() {
    playedNotesRef.current = [];
    
    activeHighlightsRef.current.forEach((element) => {
      if (element.classList) {
        element.classList.remove('vf-note-correct', 'vf-note-incorrect');
      } else {
        element.remove();
      }
    });
    
    activeHighlightsRef.current.clear();
    console.log('🧹 Cleared all tracking and highlights');
  }

  function getCurrentBeatInfo() {
    if (!beatCursorRef.current) return null;
    
    const beat = beatCursorRef.current.getCurrentBeat();
    if (!beat) return null;
    
    return {
      beatIndex: beat.index,
      measure: beat.measureIndex + 1,
      beatInMeasure: beat.beatInMeasure + 1,
      expectedNotes: beatCursorRef.current.getCurrentExpectedMIDI()
        .map(m => midiToNoteName(m))
        .join(', ')
    };
  }

  // ========== UI ==========
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
        playIndex={currentBeatIndex}
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
        onProgressClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          const targetBeat = Math.floor(percent * totalSteps);
          
          if (beatCursorRef.current) {
            beatCursorRef.current.setPosition(targetBeat);
            setCurrentBeatIndex(targetBeat);
            currentCursorStepRef.current = targetBeat;
            
            const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
          }
        }}
        containerRef={containerRef}
        countdown={countdown}
        progressPercent={progressPercent}
        courseTitle={courseTitle}
      />
      
      {/* Debug info */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 10000
      }}>
        {(() => {
          const info = getCurrentBeatInfo();
          return info ? (
            <>
              <div>Beat: {info.beatIndex + 1}/{totalSteps}</div>
              <div>Measure: {info.measure}, Beat: {info.beatInMeasure}</div>
              <div>Expected: {info.expectedNotes || 'Rest'}</div>
              <div style={{marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px'}}>
                Cursor X: {beatCursorRef.current?.getCurrentBeat()?.staffEntryX?.toFixed(1)}
              </div>
              <div style={{marginTop: '5px', borderTop: '1px solid #444', paddingTop: '5px'}}>
                <label style={{display: 'block', marginBottom: '4px'}}>Tempo: {tempo} BPM</label>
                <input 
                  type="range" 
                  min="40" 
                  max="200" 
                  value={tempo} 
                  onChange={(e) => setTempo(Number(e.target.value))}
                  style={{width: '100%'}}
                  disabled={isPlaying}
                />
              </div>
            </>
          ) : (
            <div>Initializing...</div>
          );
        })()}
      </div>
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