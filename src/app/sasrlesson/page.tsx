/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import scoreNotePlayed from "@/features/scores/scorenoteplayed";
import { useSearchParams } from "next/navigation";
import { BeatCursor } from "@/features/playback/beatcursor";
import SasrPlayControls from "@/features/components/sasrplaycontrol";
import StrikeIndicator from "@/features/components/strike";

interface PlayedNote {
  midi: number;
  timestamp: number;
  cursorStep: number;
  wasCorrect: boolean;
  graphicalNotes?: any[];
}

interface MistakeRecord {
  beatIndex: number;
  timestamp: number;
  expectedNotes: number[];
  playedNote: number;
  measure: number;
  beatInMeasure: number;
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
  
  // ===== MISTAKE TRACKING STATE =====
  const [mistakeCount, setMistakeCount] = useState(0);
  const mistakeCountRef = useRef(0);
  const mistakesRef = useRef<MistakeRecord[]>([]);
  const [showMistakeLimit, setShowMistakeLimit] = useState(false);
  const MAX_MISTAKES = 3;
  
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
        
        if (osmd.cursor) {
          osmd.cursor.hide();
        }
        
        setTimeout(() => {
          if (cancelled || !osmdRef.current) return;
          
          console.log("=== Creating Beat Cursor ===");
          
          try {
            const beatCursor = new BeatCursor(osmdRef.current);
            beatCursorRef.current = beatCursor;
            
            const totalBeats = beatCursor.getTotalBeats();
            setTotalSteps(totalBeats);
            totalStepsRef.current = totalBeats;
            setCurrentBeatIndex(0);
            
            const expectedMIDI = beatCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
            
            console.log(`✅ Beat cursor initialized: ${totalBeats} beats`);
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
            
            if (!playModeRef.current) {
              beatCursorRef.current.destroy();
              const newCursor = new BeatCursor(osmdRef.current);
              newCursor.setPosition(currentIndex);
              beatCursorRef.current = newCursor;
            } else {
              beatCursorRef.current.refreshPositions();
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
  const [tempo, setTempo] = useState(120);

  function startPlayback() {
    if (!beatCursorRef.current) {
      console.error("Cannot start - beat cursor not initialized");
      return;
    }
    
    clearAllTracking();
    beatCursorRef.current.reset();
    setCurrentBeatIndex(0);
    setIsPlaying(true);
    playModeRef.current = true;
    
    // Reset mistake tracking
    setMistakeCount(0);
    mistakeCountRef.current = 0;
    mistakesRef.current = [];
    setShowMistakeLimit(false);
    setScore(null);
    
    totalStepsRef.current = beatCursorRef.current.getTotalBeats();
    correctStepsRef.current = 0;
    scoredStepsRef.current.clear();
    currentCursorStepRef.current = 0;
    
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
        
        if (beatCursorRef.current) {
          beatCursorRef.current.startPlayback();
        }
        
        startAutomaticPlayback();
      }
    }, 1000);
    
    console.log("🎵 Playback started with 3-mistake limit");
  }

  function startAutomaticPlayback() {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    
    const beatDuration = (60 / tempo) * 1000;
    
    console.log(`🎵 Starting automatic playback at ${tempo} BPM (${beatDuration}ms per beat)`);
    
    playbackIntervalRef.current = setInterval(() => {
      // CRITICAL: Check mistake limit FIRST before any other actions
      if (mistakeCountRef.current >= MAX_MISTAKES) {
        console.log('🛑 Mistake limit reached - stopping playback');
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        handleMistakeLimitReached();
        return;
      }
      
      if (!playModeRef.current || !beatCursorRef.current) {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
        return;
      }
      
      const currentIdx = beatCursorRef.current.getCurrentIndex();
      
      const moved = beatCursorRef.current.next();
      if (moved) {
        const newIndex = beatCursorRef.current.getCurrentIndex();
        
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

  function handleMistakeLimitReached() {
    console.log('🛑 HANDLING MISTAKE LIMIT REACHED');
    
    // FORCE stop everything
    setIsPlaying(false);
    playModeRef.current = false;
    
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    
    if (beatCursorRef.current) {
      beatCursorRef.current.stopPlayback();
    }
    
    // Calculate score
    const beatsPlayed = currentBeatIndex + 1;
    const finalScore = beatsPlayed > 0
      ? Math.round((correctStepsRef.current / beatsPlayed) * 100)
      : 0;
    
    console.log('📊 Final Score Calculation:', {
      beatsPlayed,
      correctBeats: correctStepsRef.current,
      finalScore,
      mistakes: mistakesRef.current.length
    });
    
    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", finalScore.toString());
    
    // Show the modal
    setShowMistakeLimit(true);
    
    console.log('✅ Modal should now be visible');
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

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // ========== NOTE TRACKING WITH MISTAKE DETECTION ==========
  function trackAndHighlightNote(midi: number) {
    if (!beatCursorRef.current || !playModeRef.current) return;

    const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
    const noteName = midiToNoteName(midi);
    const expectedNames = expectedMIDI.map(m => midiToNoteName(m)).join(', ');
    
    const currentBeat = beatCursorRef.current.getCurrentBeat();
    console.log('🎹 Note Analysis:', {
      played: `${noteName} (${midi})`,
      beat: currentBeatIndex,
      expected: expectedNames || 'Rest',
      expectedMIDI: expectedMIDI
    });
    
    const exactMatch = expectedMIDI.includes(midi);
    const matchingNotes = beatCursorRef.current.findGraphicalNotesAtCurrentBeat(midi);
    const isCorrect = exactMatch && matchingNotes.length > 0;
    
    const playedNote: PlayedNote = {
      midi,
      timestamp: Date.now(),
      cursorStep: currentBeatIndex,
      wasCorrect: isCorrect,
      graphicalNotes: matchingNotes.length > 0 ? matchingNotes : undefined
    };
    
    playedNotesRef.current.push(playedNote);
    
    // Track mistakes - CRITICAL FIX: Only count as mistake if there ARE expected notes (not a rest)
    if (!isCorrect && expectedMIDI.length > 0) {
      const newMistakeCount = mistakeCountRef.current + 1;
      mistakeCountRef.current = newMistakeCount;
      setMistakeCount(newMistakeCount);
      
      const mistakeRecord: MistakeRecord = {
        beatIndex: currentBeatIndex,
        timestamp: Date.now(),
        expectedNotes: expectedMIDI,
        playedNote: midi,
        measure: currentBeat?.measureIndex ? currentBeat.measureIndex + 1 : 0,
        beatInMeasure: currentBeat?.beatInMeasure ? currentBeat.beatInMeasure + 1 : 0
      };
      
      mistakesRef.current.push(mistakeRecord);
      
      console.log(`❌ MISTAKE ${newMistakeCount}/${MAX_MISTAKES}:`, {
        expected: expectedNames,
        played: noteName,
        measure: mistakeRecord.measure,
        beat: mistakeRecord.beatInMeasure
      });
      
      // CRITICAL: Check if we've hit the limit immediately
      if (newMistakeCount >= MAX_MISTAKES) {
        console.log('🚨 MAX MISTAKES REACHED - Will stop on next interval');
        // The interval will catch this on its next tick
      }
    }
    
    if (matchingNotes.length > 0) {
      console.log(`${isCorrect ? '✅' : '❌'} Highlighting ${matchingNotes.length} note(s)`);
      matchingNotes.forEach((gn) => {
        highlightGraphicalNotePersistent(gn, isCorrect);
      });
    } else if (!exactMatch) {
      console.log('👻 Drawing ghost note (incorrect)');
      drawGhostNote(osmdRef.current, midi, false);
    }
    
    if (isCorrect) {
      console.log('✅ Correct note played!');
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

  function drawGhostNote(osmd: any, midi: number, isCorrect: boolean) {
    if (!beatCursorRef.current) return;
    
    const beat = beatCursorRef.current.getCurrentBeat();
    if (!beat || beat.staffEntryX === undefined) return;

    const svg = osmd.drawer?.backend?.getSvgElement?.();
    if (!svg) return;

    const graphicSheet = osmd.GraphicSheet;
    const measureList = graphicSheet?.MeasureList?.[beat.measureIndex];
    const measure = measureList?.[0];
    
    if (!measure) return;

    const lineSpacing = 10;
    
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

            const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;
          }
        } }
        containerRef={containerRef}
        countdown={countdown}
        progressPercent={progressPercent}
        courseTitle={courseTitle} mistakeCount={0} maxMistakes={0}      />
      
      {/* Strike Indicator */}
      {/* <StrikeIndicator mistakeCount={mistakeCount} maxMistakes={MAX_MISTAKES} /> */}
      
      {/* Mistake Limit Modal */}
      {showMistakeLimit && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{color: '#f44336', marginBottom: '20px', fontSize: '28px'}}>
              ⚠️ Practice Session Stopped
            </h2>
            <p style={{fontSize: '18px', marginBottom: '15px'}}>
              Youve made {MAX_MISTAKES} strikes
            </p>
            <p style={{marginBottom: '30px', color: '#666', fontSize: '16px'}}>
              Lets review what happened and try again!
            </p>
            
            <div style={{
              background: '#f5f5f5',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '25px'
            }}>
              <div style={{fontSize: '18px', marginBottom: '15px'}}>
                <strong>Your Performance:</strong>
              </div>
              <div style={{fontSize: '16px', color: '#666', marginBottom: '8px'}}>
                Beats Played: <strong>{currentBeatIndex + 1}</strong> / {totalSteps}
              </div>
              <div style={{fontSize: '16px', color: '#666', marginBottom: '8px'}}>
                Correct Notes: <strong style={{color: '#4caf50'}}>{correctStepsRef.current}</strong>
              </div>
              <div style={{fontSize: '16px', color: '#666', marginBottom: '15px'}}>
                Mistakes: <strong style={{color: '#f44336'}}>{mistakeCount}</strong>
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#4caf50',
                marginTop: '15px'
              }}>
                {score}%
              </div>
              <div style={{fontSize: '14px', color: '#999', marginTop: '5px'}}>
                FINAL SCORE
              </div>
            </div>
            
            <div style={{marginBottom: '25px', textAlign: 'left'}}>
              <strong style={{fontSize: '16px'}}>Mistakes Made:</strong>
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                marginTop: '12px',
                fontSize: '14px'
              }}>
                {mistakesRef.current.map((mistake, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    background: idx % 2 === 0 ? '#fafafa' : 'white',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    border: '1px solid #eee'
                  }}>
                    <div style={{marginBottom: '4px'}}>
                      <strong>Strike {idx + 1}:</strong> Measure {mistake.measure}, Beat {mistake.beatInMeasure}
                    </div>
                    <div style={{color: '#666', fontSize: '13px'}}>
                      Expected: <strong>{mistake.expectedNotes.map(m => midiToNoteName(m)).join(', ')}</strong>
                    </div>
                    <div style={{color: '#f44336', fontSize: '13px'}}>
                      Played: <strong>{midiToNoteName(mistake.playedNote)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button
                onClick={() => {
                  setShowMistakeLimit(false);
                  clearAllTracking();
                  if (beatCursorRef.current) {
                    beatCursorRef.current.reset();
                    setCurrentBeatIndex(0);
                  }
                  setMistakeCount(0);
                  mistakeCountRef.current = 0;
                  mistakesRef.current = [];
                  setScore(null);
                }}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#45a049'}
                onMouseOut={(e) => e.currentTarget.style.background = '#4caf50'}
              >
                Try Again
              </button>
              <button
                onClick={() => setShowMistakeLimit(false)}
                style={{
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#555'}
                onMouseOut={(e) => e.currentTarget.style.background = '#666'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                Mistakes: {mistakeCount}/{MAX_MISTAKES}
              </div>
              <div>Correct: {correctStepsRef.current} / {currentBeatIndex + 1}</div>
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