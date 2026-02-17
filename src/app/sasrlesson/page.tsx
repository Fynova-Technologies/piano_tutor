/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import scoreNotePlayed from "@/features/scores/scorenoteplayed";
import SasrPlayControls from "../../features/components/sasrplaycontrol";
import { useSearchParams } from "next/navigation";
import { BeatCursor } from "@/features/playback/beatcursor";
import { saveSession} from "@/datastore/sessionstorage";
import { sasrDataStore } from "../../datastore/sasrdatastore";


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
  const source = searchparams.get("source") || "Method-1A";
  const hasInitializedOSMD = useRef(false);
  const scoreableNotesRef = useRef(0);
  // Session timing
  const sessionStartRef = useRef<number | null>(null);
  // Session attempts (restarts / replays)
  const attemptCountRef = useRef(0);
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
  const incorrectNotesRef = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const scoredStepsRef = useRef<Set<number>>(new Set());
  const currentCursorStepRef = useRef<number>(0);
  const playedNotesRef = useRef<PlayedNote[]>([]);
  const activeHighlightsRef = useRef<Set<any>>(new Set());
  const beatCursorRef = useRef<BeatCursor | null>(null);
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  
  // ✅ NEW: Mistake tracking and popup state
  const [showScorePopup, setShowScorePopup] = useState(false);
  const totalMistakesRef = useRef(0); // ✅ CHANGED: Track total mistakes, not consecutive
  const [mistakeCountState, setMistakeCountState] = useState(0); // ✅ State for UI updates
  const MAX_MISTAKES = 3;
  
  useEffect(() => {
    const hsStr = localStorage.getItem("highScore");
    const lsStr = localStorage.getItem("lastScore");
    
    // Only set if the value actually exists in localStorage
    if (hsStr !== null) {
      const hs = Number(hsStr);
      if (!Number.isNaN(hs)) setHighScore(hs);
    }
    
    if (lsStr !== null) {
      const ls = Number(lsStr);
      if (!Number.isNaN(ls)) setLastScore(ls);
    }
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
    attemptCountRef.current = 0;

    if (!containerRef.current) return;

      if (hasInitializedOSMD.current) {
    console.log('⚠️ OSMD already initialized, skipping');
    return;
  }
    
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
            currentCursorStepRef.current = 0; // ✅ FIX: Initialize this
            
            // Update current step notes
            const expectedMIDI = beatCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
            
            console.log(`✅ Beat cursor initialized: ${totalBeats} beats`);
            console.log(`Initial expected notes:`, expectedMIDI);
          } catch (error) {
            console.error("❌ Failed to create beat cursor:", error);
          }
        }, 200);
        
      } catch (e) {
        console.error("OSMD load/render error:", e);
      }
    })();
    
    const onResize = () => {
      try {
        if (!osmdRef.current) return;
        osmd.render();
        
        setTimeout(() => {
          if (beatCursorRef.current && osmdRef.current) {
            const currentIndex = beatCursorRef.current.getCurrentIndex();
            
            // ✅ FIX: Recreate cursor element after render (SVG gets replaced)
            beatCursorRef.current.destroy();
            const newCursor = new BeatCursor(osmdRef.current);
            newCursor.setPosition(currentIndex);
            beatCursorRef.current = newCursor;
            
            setTotalSteps(newCursor.getTotalBeats());
            
            const expectedMIDI = newCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
            
            console.log("Cursor recreated after resize at position", currentIndex);
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
  // New attempt starts
  attemptCountRef.current += 1;
  
  // ✅ Reset mistake counter
  totalMistakesRef.current = 0; // ✅ CHANGED: Reset total mistakes
  setMistakeCountState(0); // ✅ Reset state for UI

  beatCursorRef.current.reset();
  
  setCurrentBeatIndex(0);
  currentCursorStepRef.current = 0;
  setPlayIndex(0);
  
  setIsPlaying(true);
  playModeRef.current = true;
  
  // 🎯 Count scoreable notes (beats with isNoteStart = true)
  const totalBeats = beatCursorRef.current.getTotalBeats();
  let scoreableCount = 0;
  
  for (let i = 0; i < totalBeats; i++) {
    const beat = beatCursorRef.current.getBeatAt(i);
    if (beat?.isNoteStart && beat.expectedNotes.length > 0) {
      scoreableCount++;
    }
  }
  
  totalStepsRef.current = totalBeats; // For progress bar
  scoreableNotesRef.current = scoreableCount; // For score calculation
  correctStepsRef.current = 0;
  incorrectNotesRef.current = 0;
  scoredStepsRef.current.clear();
  
  console.log(`🎵 Playback started: ${totalBeats} beats, ${scoreableCount} scoreable notes`);
  
  const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
  setCurrentStepNotes(expectedMIDI);
  currentStepNotesRef.current = expectedMIDI;
  sessionStartRef.current = Date.now();

  
  setCountdown(3);
  let countdownValue = 3;
  const countdownInterval = setInterval(() => {
    countdownValue--;
    setCountdown(countdownValue);
    
    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      setCountdown(null);
      
      if (beatCursorRef.current) {
        beatCursorRef.current.startPlayback();
      }
      
      startAutomaticPlayback();
    }
  }, 1000);
}

  function startAutomaticPlayback() {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    
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
      
      const moved = beatCursorRef.current.next();
      if (moved) {
        const newIndex = beatCursorRef.current.getCurrentIndex();
        
        // ✅ FIX: Sync all state variables
        setCurrentBeatIndex(newIndex);
        currentCursorStepRef.current = newIndex;
        setPlayIndex(newIndex);
        
        const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
        setCurrentStepNotes(expectedMIDI);
        currentStepNotesRef.current = expectedMIDI;
        
        console.log(`⏭️ Auto-advanced to beat ${newIndex}`);
      } else {
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
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    if (beatCursorRef.current) {
      beatCursorRef.current.stopPlayback();
    }
    
    console.log("⏸️ Playback paused");
  }

  // ✅ NEW: Function to stop playback due to mistakes
  function stopPlaybackDueToMistakes() {
    console.log(`🛑 Stopping playback - ${MAX_MISTAKES} mistakes reached`);
    
    setIsPlaying(false);
    playModeRef.current = false;
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    if (beatCursorRef.current) {
      beatCursorRef.current.stopPlayback();
    }
    
    // Calculate and show score
    calculateAndShowScore();
  }

  // ✅ NEW: Separate function to calculate and show score
  function calculateAndShowScore() {
    const baseScore = scoreableNotesRef.current > 0
      ? (correctStepsRef.current / scoreableNotesRef.current) * 100
      : 0;
    
    const incorrectPenalty = incorrectNotesRef.current * 5;
    const finalScore = Math.max(0, Math.round(baseScore - incorrectPenalty));
    
    console.log('📊 Score Update:', {
      currentHighScore: highScore,
      currentLastScore: lastScore,
      newScore: finalScore,
      willUpdateHighScore: highScore === null || finalScore > highScore
    });
    
    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", finalScore.toString());
    
    if (highScore === null || finalScore > highScore) {
      console.log(`🏆 NEW HIGH SCORE! ${finalScore} (previous: ${highScore})`);
      setHighScore(finalScore);
      localStorage.setItem("highScore", finalScore.toString());
    } else {
      console.log(`📊 Score ${finalScore} did not beat high score of ${highScore}`);
    }

    const endTime = Date.now();
    const startTime = sessionStartRef.current ?? endTime;
    const durationSec = Math.round((endTime - startTime) / 1000);

    const accuracy = scoreableNotesRef.current > 0
      ? Math.round((correctStepsRef.current / scoreableNotesRef.current) * 100)
      : 0;

    const lessonId = searchparams.get("lessonid") || "0";
    const lessonUID = `SASR-${lessonId}`;

    const session = {
      id: crypto.randomUUID(),
      startedAt: startTime,
      endedAt: endTime,
      durationSec,
      lesson: {
        uid: lessonUID,
        id: lessonId,
        title: courseTitle,
        source: "SASR",
      },
      performance: {
        attempts: Math.max(1, attemptCountRef.current),
        score: finalScore,
        accuracy,
        correctNotes: correctStepsRef.current,
        incorrectNotes: incorrectNotesRef.current,
        totalScoreable: scoreableNotesRef.current,
      },
    };

    saveSession(session);
    
    // ✅ Show popup
    setShowScorePopup(true);
    
    console.log(`Correct notes: ${correctStepsRef.current}/${scoreableNotesRef.current}`);
    console.log(`Incorrect notes: ${incorrectNotesRef.current}`);
    console.log(`Base score: ${baseScore.toFixed(1)}%`);
    console.log(`Penalty: -${incorrectPenalty}%`);
    console.log(`Final score: ${finalScore}%`);
  }

function handleEndOfPiece() {
  setIsPlaying(false);
  playModeRef.current = false;
  
  if (playbackIntervalRef.current) {
    clearInterval(playbackIntervalRef.current);
    playbackIntervalRef.current = null;
  }
  
  if (beatCursorRef.current) {
    beatCursorRef.current.stopPlayback();
  }
  
  calculateAndShowScore();
}

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // ========== NOTE TRACKING ==========
  function trackAndHighlightNote(midi: number) {
  const actualCurrentBeatIndex = currentCursorStepRef.current;
  
  console.log('🔍 trackAndHighlightNote called:', {
    midi,
    playModeActive: playModeRef.current,
    cursorExists: !!beatCursorRef.current,
    currentBeatIndex: actualCurrentBeatIndex
  });
  
  if (!beatCursorRef.current || !playModeRef.current) {
    console.log('⚠️ Ignoring note - not in play mode or no cursor');
    return;
  }

  const currentBeat = beatCursorRef.current.getBeatAt(actualCurrentBeatIndex);
  if (!currentBeat) {
    console.log('❌ No beat found at index', actualCurrentBeatIndex);
    return;
  }
  
  const expectedMIDI = currentBeat.expectedNotes.map(ht => ht + 12);
  const noteName = midiToNoteName(midi);
  const expectedNames = expectedMIDI.map(m => midiToNoteName(m)).join(', ');
  
  const isNoteStart = currentBeat.isNoteStart === true;
  const exactMatch = expectedMIDI.includes(midi);
  const isCorrect = exactMatch && isNoteStart;

  // 🚫 Prevent double scoring
  if (scoredStepsRef.current.has(actualCurrentBeatIndex)) {
    return;
  }

  
  console.log('🎹 Note pressed:', {
    played: `${noteName} (${midi})`,
    beat: actualCurrentBeatIndex,
    beatX: currentBeat?.staffEntryX?.toFixed(2),
    expected: expectedNames || 'Rest',
    expectedMIDI: expectedMIDI,
    isNoteStart: isNoteStart
  });
    
  // ✅ SCORING LOGIC with mistake tracking (TOTAL, not consecutive)
  if (isNoteStart) {
    scoredStepsRef.current.add(actualCurrentBeatIndex);

    if (isCorrect) {
      correctStepsRef.current += 1;
      // ✅ CHANGED: Don't reset mistake counter on correct notes
      console.log(`✅ CORRECT: ${correctStepsRef.current}`);
    } else {
      incorrectNotesRef.current += 1;
      totalMistakesRef.current += 1; // ✅ CHANGED: Increment total mistake counter
      setMistakeCountState(totalMistakesRef.current); // ✅ Update state immediately for UI
      console.log(`❌ INCORRECT at beat ${actualCurrentBeatIndex} (Total Mistakes: ${totalMistakesRef.current}/${MAX_MISTAKES})`);
      
      // ✅ Check if max mistakes reached
      if (totalMistakesRef.current >= MAX_MISTAKES) {
        stopPlaybackDueToMistakes();
        return; // Stop processing this note
      }
    }

  } else if (!exactMatch) {
    // Wrong note during sustain
    incorrectNotesRef.current += 1;
    totalMistakesRef.current += 1; // ✅ CHANGED: Count all mistakes
    setMistakeCountState(totalMistakesRef.current); // ✅ Update state immediately for UI
    console.log(`❌ Wrong sustain note (Total Mistakes: ${totalMistakesRef.current}/${MAX_MISTAKES})`);
    
    // ✅ Check if max mistakes reached
    if (totalMistakesRef.current >= MAX_MISTAKES) {
      stopPlaybackDueToMistakes();
      return;
    }
  }
  
  // Find graphical notes for highlighting
  let graphicalNotes: any[] = [];
  
  if (isCorrect) {
    graphicalNotes = beatCursorRef.current.findGraphicalNotesAtCurrentBeat(midi);
    console.log(`🔍 Found ${graphicalNotes.length} graphical notes for highlighting`);
  }
  
  const playedNote: PlayedNote = {
    midi,
    timestamp: Date.now(),
    cursorStep: actualCurrentBeatIndex,
    wasCorrect: isCorrect,
    graphicalNotes: graphicalNotes
  };
  
  playedNotesRef.current.push(playedNote);
  
  if (!isNoteStart && exactMatch) {
    console.log(`⚠️ Correct note but wrong timing (continuation beat) - marking as incorrect`);
  }
  
  console.log(`${isCorrect ? '✅' : '❌'} Drawing feedback`);
  
  drawFeedbackDot(osmdRef.current, midi, isCorrect, currentBeat, graphicalNotes);
}

  function midiToNoteName(midi: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const noteName = noteNames[midi % 12];
    return `${noteName}${octave}`;
  }

function drawFeedbackDot(
  osmd: any, 
  midi: number, 
  isCorrect: boolean, 
  beat: any,
  graphicalNotes?: any[]
) {
  if (!osmd?.drawer?.backend) {
    console.warn('⚠️ No OSMD backend');
    return;
  }

  const svg = osmd.drawer.backend.getSvgElement();
  if (!svg) {
    console.warn('⚠️ No SVG element');
    return;
  }

  const graphicSheet = osmd.GraphicSheet;
  
  // Calculate unit conversion
  let unitInPixels = 10;
  const innerElement = osmd.drawer?.backend?.getInnerElement?.();
  if (innerElement?.offsetWidth && graphicSheet?.ParentMusicSheet?.pageWidth) {
    unitInPixels = innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
  }

  // 🎯 METHOD 1: Use graphical notes if available (MOST ACCURATE)
  if (graphicalNotes && graphicalNotes.length > 0) {
    console.log(`✨ Drawing dots at graphical note positions`);
    
    for (const gNote of graphicalNotes) {
      const posAndShape = gNote.PositionAndShape;
      if (!posAndShape?.AbsolutePosition) {
        console.warn('⚠️ Graphical note missing position');
        continue;
      }
      
      const noteX = posAndShape.AbsolutePosition.x * unitInPixels;
      const noteY = posAndShape.AbsolutePosition.y * unitInPixels;
      
      const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      el.setAttribute("cx", noteX.toString());
      el.setAttribute("cy", noteY.toString());
      el.setAttribute("r", "8");
      el.classList.add(isCorrect ? "midi-ghost-note-correct" : "midi-ghost-note-incorrect");
      el.setAttribute("stroke-width", "2.5");
      
      svg.appendChild(el);
      activeHighlightsRef.current.add(el);
      
      console.log(`🔴 Dot drawn at ACTUAL NOTE position: X=${noteX.toFixed(1)}, Y=${noteY.toFixed(1)}, correct=${isCorrect}`);
    }
    
    return;
  }

  // 🎯 FALLBACK METHOD: Calculate position (less accurate)
  console.log(`⚠️ No graphical notes found, using fallback positioning`);
  
  if (!beat || beat.staffEntryX === undefined) {
    console.warn('⚠️ Cannot draw dot - invalid beat position');
    return;
  }

  const measureList = graphicSheet?.MeasureList?.[beat.measureIndex];
  const measure = measureList?.[0];
  
  if (!measure) {
    console.warn('⚠️ No measure found');
    return;
  }

  const lineSpacing = 10;
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
  
  if (clef === 1) {
    referenceDiatonic = midiToDiatonic(50);
    referenceY = measureY + (2 * lineSpacing);
  } else {
    referenceDiatonic = midiToDiatonic(71);
    referenceY = measureY + (2 * lineSpacing);
  }
  
  const noteDiatonic = midiToDiatonic(midi);
  const diatonicSteps = referenceDiatonic - noteDiatonic;
  const y = referenceY + (diatonicSteps * (lineSpacing / 2));

  const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  el.setAttribute("cx", beat.staffEntryX.toString());
  el.setAttribute("cy", y.toString());
  el.setAttribute("r", "8");
  el.classList.add(isCorrect ? "midi-ghost-note-correct" : "midi-ghost-note-incorrect");
  el.setAttribute("stroke-width", "2.5");
  
  svg.appendChild(el);
  activeHighlightsRef.current.add(el);
  
  console.log(`🔴 Fallback dot drawn at X=${beat.staffEntryX.toFixed(1)}, Y=${y.toFixed(1)}, correct=${isCorrect}`);
}

function clearAllTracking() {
  playedNotesRef.current = [];
  
  activeHighlightsRef.current.forEach((element) => {
    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (e) {
      console.warn('Failed to remove highlight:', e);
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
      <SasrPlayControls
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
            setPlayIndex(targetBeat);
            
            const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
            
            console.log(`📍 Seeked to beat ${targetBeat}`);
          }
        }}
        containerRef={containerRef}
        countdown={countdown}
        progressPercent={progressPercent}
        courseTitle={courseTitle}
        mistakeCount={mistakeCountState}
        maxMistakes={MAX_MISTAKES}
      />
      
      {/* ✅ NEW: Score Popup */}
      {showScorePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '32px', color: '#333' }}>
              {totalMistakesRef.current >= MAX_MISTAKES ? '🛑 Practice Stopped' : '🎉 Complete!'}
            </h2>
            
            {totalMistakesRef.current >= MAX_MISTAKES && (
              <p style={{ 
                fontSize: '18px', 
                color: '#f44336', 
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                {MAX_MISTAKES} mistakes made - Keep practicing!
              </p>
            )}
            
            <div style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: (score ?? 0) >= 80 ? '#4caf50' : (score ?? 0) >= 60 ? '#ff9800' : '#f44336',
              margin: '20px 0'
            }}>
              {score ?? 0}%
            </div>
            
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#4caf50' }}>✓ Correct: {correctStepsRef.current}</span>
                {' / '}
                <span style={{ color: '#f44336' }}>✗ Incorrect: {incorrectNotesRef.current}</span>
              </div>
              <div>Total Scoreable Notes: {scoreableNotesRef.current}</div>
              
              {highScore !== null && (score ?? 0) > highScore && (
                <div style={{ 
                  marginTop: '15px', 
                  fontSize: '20px', 
                  color: '#ffd700',
                  fontWeight: 'bold'
                }}>
                  🏆 NEW HIGH SCORE!
                </div>
              )}
              
              {highScore !== null && (
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  Previous High Score: {highScore}%
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowScorePopup(false);
                  startPlayback();
                }}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => setShowScorePopup(false)}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Debug Panel */}
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
        zIndex: 10000,
        maxWidth: '280px'
      }}>
        {(() => {
          const info = getCurrentBeatInfo();
          const currentScore = scoreableNotesRef.current > 0 
            ? Math.round((correctStepsRef.current / scoreableNotesRef.current) * 100) 
            : 0;
          const penalty = incorrectNotesRef.current * 5;
          const projectedScore = Math.max(0, currentScore - penalty);
          
          return info ? (
            <>
              <div style={{fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #444', paddingBottom: '4px'}}>
                🎵 Current Position
              </div>
              <div>Beat: {info.beatIndex + 1}/{totalSteps}</div>
              <div>Measure: {info.measure}, Beat: {info.beatInMeasure}</div>
              <div>Expected: {info.expectedNotes || 'Rest'}</div>
              
              <div style={{marginTop: '10px', fontWeight: 'bold', borderTop: '1px solid #444', paddingTop: '8px', borderBottom: '1px solid #444', paddingBottom: '4px'}}>
                📊 Scoring
              </div>
              <div>Scoreable Notes: {scoreableNotesRef.current}</div>
              <div style={{color: '#4caf50'}}>✓ Correct: {correctStepsRef.current}</div>
              <div style={{color: '#f44336'}}>✗ Incorrect: {incorrectNotesRef.current}</div>
              <div style={{
                color: totalMistakesRef.current >= 2 ? '#ff9800' : '#fff',
                fontWeight: totalMistakesRef.current >= 2 ? 'bold' : 'normal'
              }}>
                🚫 Total Mistakes: {totalMistakesRef.current}/{MAX_MISTAKES}
              </div>
              <div style={{marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #333'}}>
                Base Score: {currentScore}%
              </div>
              <div>Penalty: -{penalty}%</div>
              <div style={{fontWeight: 'bold', color: projectedScore >= 80 ? '#4caf50' : projectedScore >= 60 ? '#ff9800' : '#f44336'}}>
                Score: {projectedScore}%
              </div>
              
              <div style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '8px'}}>
                <div style={{fontSize: '11px'}}>
                  <div style={{color: '#ffd700'}}>🏆 High: {highScore !== null ? `${highScore}%` : 'None'}</div>
                  <div style={{color: '#90caf9', marginTop: '2px'}}>📝 Last: {lastScore !== null ? `${lastScore}%` : 'None'}</div>
                </div>
              </div>
              
              <div style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '8px'}}>
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