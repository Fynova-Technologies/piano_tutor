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
import { saveSession } from "@/datastore/sessionstorage";

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

  useEffect(() => {
    const hsStr = localStorage.getItem("highScore");
    const lsStr = localStorage.getItem("lastScore");

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
      console.log("⚠️ OSMD already initialized, skipping");
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

        // Wait for render to complete and layout to stabilize
        setTimeout(() => {
          if (cancelled || !osmdRef.current) return;

          console.log("=== Creating Beat Cursor ===");
          console.log("GraphicSheet exists:", !!osmdRef.current.GraphicSheet);
          console.log(
            "Measures:",
            osmdRef.current.GraphicSheet?.MeasureList?.length
          );

          try {
            const beatCursor = new BeatCursor(osmdRef.current);
            beatCursorRef.current = beatCursor;

            const totalBeats = beatCursor.getTotalBeats();
            setTotalSteps(totalBeats);
            totalStepsRef.current = totalBeats;
            setCurrentBeatIndex(0);
            currentCursorStepRef.current = 0;

            const expectedMIDI = beatCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;

            console.log(`✅ Beat cursor initialized: ${totalBeats} beats`);
            console.log("Initial expected notes:", expectedMIDI);
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
          C8: "C8.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1,
      }).toDestination();

      for (let i = 0; i < 200; i++) {
        if (sampler.loaded) break;
        await new Promise((r) => setTimeout(r, 50));
      }

      if (!mounted) {
        try {
          sampler.dispose();
        } catch (e) {}
        return;
      }
      samplerRef.current = sampler;
    }

    createSampler();
    return () => {
      mounted = false;
    };
  }, []);

  // ========== MIDI SETUP ==========
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
          if (inputCount === 1) midiInRef.current = input;

          input.onmidimessage = async (ev) => {
            const [status, key, velocity] = ev.data as Uint8Array;
            const isNoteOn = (status & 0xf0) === 0x90 && velocity > 0;

            console.log("🎹 MIDI message received:", {
              status,
              key,
              velocity,
              isNoteOn,
            });

            if (playbackMidiGuard.current > 0) {
              console.log(
                "🚫 Blocked by playbackMidiGuard:",
                playbackMidiGuard.current
              );
              return;
            }

            if (isNoteOn) {
              console.log("🎵 Note ON:", key, "| playMode:", playModeRef.current, "| osmd:", !!osmdRef.current, "| beatCursor:", !!beatCursorRef.current);

              if (playModeRef.current) {
                console.log("📍 Calling trackAndHighlightNote...");
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

  const progressPercent = totalSteps
    ? Math.round((currentBeatIndex / Math.max(1, totalSteps - 1)) * 100)
    : 0;

  function midiToName(num: number) {
    const octave = Math.floor(num / 12) - 1;
    const names = [
      "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    return names[(num % 12 + 12) % 12] + octave;
  }

  // ========== KEYBOARD HANDLER ==========
  useEffect(() => {
    const keyToMidi: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65,
      t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
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

        if (
          samplerRef.current &&
          Tone.context.state !== "running"
        ) {
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
    attemptCountRef.current += 1;

    beatCursorRef.current.reset();

    setCurrentBeatIndex(0);
    currentCursorStepRef.current = 0;
    setPlayIndex(0);

    setIsPlaying(true);
    playModeRef.current = true;

    const totalBeats = beatCursorRef.current.getTotalBeats();
    let scoreableCount = 0;

    for (let i = 0; i < totalBeats; i++) {
      const beat = beatCursorRef.current.getBeatAt(i);
      if (beat?.isNoteStart && beat.expectedNotes.length > 0) {
        scoreableCount++;
      }
    }

    totalStepsRef.current = totalBeats;
    scoreableNotesRef.current = scoreableCount;
    correctStepsRef.current = 0;
    incorrectNotesRef.current = 0;
    scoredStepsRef.current.clear();

    console.log(
      `🎵 Playback started: ${totalBeats} beats, ${scoreableCount} scoreable notes`
    );

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
    console.log(
      `🎵 Starting automatic playback at ${tempo} BPM (${beatDuration}ms per beat)`
    );

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

        setCurrentBeatIndex(newIndex);
        currentCursorStepRef.current = newIndex;
        setPlayIndex(newIndex);

        const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
        setCurrentStepNotes(expectedMIDI);
        currentStepNotesRef.current = expectedMIDI;

        console.log(`⏭️ Auto-advanced to beat ${newIndex}`);
      } else {
        console.log("🏁 Reached end of piece");
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

    const baseScore =
      scoreableNotesRef.current > 0
        ? (correctStepsRef.current / scoreableNotesRef.current) * 100
        : 0;

    const incorrectPenalty = incorrectNotesRef.current * 5;
    const finalScore = Math.max(0, Math.round(baseScore - incorrectPenalty));

    console.log("📊 Score Update:", {
      currentHighScore: highScore,
      currentLastScore: lastScore,
      newScore: finalScore,
      willUpdateHighScore: highScore === null || finalScore > highScore,
    });

    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", finalScore.toString());

    if (highScore === null || finalScore > highScore) {
      console.log(`🏆 NEW HIGH SCORE! ${finalScore} (previous: ${highScore})`);
      setHighScore(finalScore);
      localStorage.setItem("highScore", finalScore.toString());
    } else {
      console.log(
        `📊 Score ${finalScore} did not beat high score of ${highScore}`
      );
    }

    const endTime = Date.now();
    const startTime = sessionStartRef.current ?? endTime;
    const durationSec = Math.round((endTime - startTime) / 1000);

    const accuracy =
      scoreableNotesRef.current > 0
        ? Math.round(
            (correctStepsRef.current / scoreableNotesRef.current) * 100
          )
        : 0;

    const lessonId = searchparams.get("lessonid") || "0";
    const lessonUID = `${source}-${lessonId}`;

    const session = {
      id: crypto.randomUUID(),
      startedAt: startTime,
      endedAt: endTime,
      durationSec,
      lesson: {
        uid: lessonUID,
        id: lessonId,
        title: courseTitle,
        source: source,
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

    console.log("🎉 Piece complete!");
    console.log(`   Correct notes: ${correctStepsRef.current}/${scoreableNotesRef.current}`);
    console.log(`   Incorrect notes: ${incorrectNotesRef.current}`);
    console.log(`   Base score: ${baseScore.toFixed(1)}%`);
    console.log(`   Penalty: -${incorrectPenalty}%`);
    console.log(`   Final score: ${finalScore}%`);
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
  if (!beatCursorRef.current || !playModeRef.current) return;

  const currentBeat = beatCursorRef.current.getBeatAt(actualCurrentBeatIndex);
  if (!currentBeat) return;

  const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
  const isNoteStart = currentBeat.isNoteStart === true;
  const exactMatch = expectedMIDI.includes(midi);
  const isCorrect = exactMatch && isNoteStart;

  if (scoredStepsRef.current.has(actualCurrentBeatIndex)) return;

  if (isNoteStart) {
    scoredStepsRef.current.add(actualCurrentBeatIndex);
    if (isCorrect) {
      correctStepsRef.current += 1;
    } else {
      incorrectNotesRef.current += 1;
    }
  } else if (!exactMatch) {
    incorrectNotesRef.current += 1;
  }

  let graphicalNotes: any[] = [];

  if (isCorrect) {
    graphicalNotes = beatCursorRef.current.findGraphicalNotesAtCurrentBeat(midi);
    console.log(`🔍 Correct: found ${graphicalNotes.length} graphical notes`);
  }
  // For incorrect notes: graphicalNotes stays empty → falls through to position calculation

  const playedNote: PlayedNote = {
    midi,
    timestamp: Date.now(),
    cursorStep: actualCurrentBeatIndex,
    wasCorrect: isCorrect,
    graphicalNotes,
  };

  playedNotesRef.current.push(playedNote);
  drawFeedbackDot(osmdRef.current, midi, isCorrect, currentBeat, graphicalNotes);
}

  function midiToNoteName(midi: number): string {
    const noteNames = [
      "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
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
  if (!osmd?.drawer?.backend) return;
  const svg = osmd.drawer.backend.getSvgElement();
  if (!svg) return;

  const graphicSheet = osmd.GraphicSheet;
  let unitInPixels = 10;
  const innerElement = osmd.drawer?.backend?.getInnerElement?.();
  if (innerElement?.offsetWidth && graphicSheet?.ParentMusicSheet?.pageWidth) {
    unitInPixels = innerElement.offsetWidth / graphicSheet.ParentMusicSheet.pageWidth;
  }

  // METHOD 1: SVG bbox — only for correct notes (exact graphical match)
  if (graphicalNotes && graphicalNotes.length > 0) {
    for (const gNote of graphicalNotes) {
      const vfNote = Array.isArray(gNote?.vfnote)
        ? gNote.vfnote[0]
        : (gNote?.vfnote ?? gNote?.VexFlowNote);
      const noteEl: SVGGraphicsElement | null = vfNote?.attrs?.el ?? null;
      if (!noteEl) continue;

      const noteheadEl =
        noteEl.querySelector('.vf-notehead') as SVGGraphicsElement ??
        noteEl.querySelector('path') as SVGGraphicsElement ??
        noteEl.querySelector('use') as SVGGraphicsElement;

      let cx: number, cy: number;
      if (noteheadEl) {
        const bbox = noteheadEl.getBBox();
        cx = bbox.x + bbox.width / 2;
        cy = bbox.y + bbox.height / 2;
      } else {
        const bbox = noteEl.getBBox();
        cx = bbox.x + bbox.width / 2;
        cy = bbox.y + bbox.height * 0.75;
      }

      const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      el.setAttribute("cx", cx.toString());
      el.setAttribute("cy", cy.toString());
      el.setAttribute("r", "7");
      el.classList.add("midi-ghost-note-correct");
      el.setAttribute("stroke-width", "2");
      const systemGroup = noteEl
  ? findSystemGroup(noteEl)
  : null;

(systemGroup ?? svg).appendChild(el);
      activeHighlightsRef.current.add(el);
    }
    return;
  }

  // METHOD 2: Incorrect notes — find closest rendered note as Y anchor
  if (!beat) return;

  // ✅ Determine which staff the played note belongs to
  // bass clef = staffIdx 1 (lower notes), treble = staffIdx 0 (higher notes)
  const staffIndex = midi < 60 ? 1 : 0;
  const osmdHalfTone = midi - 12; // BeatCursor transposeOffset = 12

  // ✅ Scan ALL notes in the whole piece on the correct staff
  // to build a halfTone→SVG_Y calibration map
  const calibration: { halfTone: number; cy: number }[] = [];

  for (let mIdx = 0; mIdx < graphicSheet.MeasureList.length; mIdx++) {
    const staffMeasures = graphicSheet.MeasureList[mIdx];
    const measure = staffMeasures?.[staffIndex];
    if (!measure) continue;

    for (const staffEntry of measure.staffEntries ?? []) {
      for (const gve of staffEntry.graphicalVoiceEntries ?? []) {
        for (const gn of gve.notes ?? []) {
          const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
          if (isRest) continue;
          const ht = gn.sourceNote?.halfTone;
          if (ht == null) continue;

          // Already have this pitch? skip
          if (calibration.find(c => c.halfTone === ht)) continue;

          const vfNote = Array.isArray(gn?.vfnote) ? gn.vfnote[0] : (gn?.vfnote ?? gn?.VexFlowNote);
          const noteEl: SVGGraphicsElement | null = vfNote?.attrs?.el ?? null;
          if (!noteEl) continue;

          const noteheadEl =
            noteEl.querySelector('.vf-notehead') as SVGGraphicsElement ??
            noteEl.querySelector('path') as SVGGraphicsElement ??
            noteEl.querySelector('use') as SVGGraphicsElement;

          const target = noteheadEl ?? noteEl;
          const bbox = target.getBBox();
          if (bbox.height === 0 && bbox.width === 0) continue;

          calibration.push({
            halfTone: ht,
            cy: bbox.y + bbox.height / 2,
          });
        }
      }
    }
  }

  console.log(`📊 Calibration (staff ${staffIndex}): ${calibration.length} points`, 
    calibration.sort((a,b) => a.halfTone - b.halfTone).map(c => `ht${c.halfTone}=Y${c.cy.toFixed(1)}`).join(', ')
  );

  if (calibration.length === 0) {
    console.warn(`⚠️ No calibration points for staff ${staffIndex}, cannot draw incorrect dot`);
    return;
  }

// ✅ Use X from beat position


let cy: number;

// Find the closest calibration point for the current osmdHalfTone
let noteEl: SVGGraphicsElement | null = null;
let minDist = Number.POSITIVE_INFINITY;
for (let mIdx = 0; mIdx < graphicSheet.MeasureList.length; mIdx++) {
  const staffMeasures = graphicSheet.MeasureList[mIdx];
  const measure = staffMeasures?.[staffIndex];
  if (!measure) continue;

  for (const staffEntry of measure.staffEntries ?? []) {
    for (const gve of staffEntry.graphicalVoiceEntries ?? []) {
      for (const gn of gve.notes ?? []) {
        const isRest = gn.sourceNote?.isRest?.() || gn.sourceNote?.IsRest || false;
        if (isRest) continue;
        const ht = gn.sourceNote?.halfTone;
        if (ht == null) continue;

        const dist = Math.abs(ht - osmdHalfTone);
        if (dist < minDist) {
          minDist = dist;
          const vfNote = Array.isArray(gn?.vfnote) ? gn.vfnote[0] : (gn?.vfnote ?? gn?.VexFlowNote);
          noteEl = vfNote?.attrs?.el ?? null;
        }
      }
    }
  }
}

// ✅ Exact match in calibration
const exact = calibration.find(c => c.halfTone === osmdHalfTone);
if (exact) {
  cy = exact.cy;
  console.log(`✅ Exact calibration: ht=${osmdHalfTone} → Y=${cy.toFixed(1)}`);
} else {
  // ✅ Interpolate between two nearest calibration points
  const sorted = [...calibration].sort((a, b) => a.halfTone - b.halfTone);

  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].halfTone <= osmdHalfTone && sorted[i + 1].halfTone >= osmdHalfTone) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  if (lower.halfTone === upper.halfTone) {
    cy = lower.cy;
  } else {
    // Higher halfTone = higher on staff = lower Y in SVG
    const t = (osmdHalfTone - lower.halfTone) / (upper.halfTone - lower.halfTone);
    cy = lower.cy + t * (upper.cy - lower.cy);
  }

  console.log(`📐 Interpolated: ht=${osmdHalfTone} between ht${lower.halfTone}(Y=${lower.cy.toFixed(1)}) and ht${upper.halfTone}(Y=${upper.cy.toFixed(1)}) → Y=${cy.toFixed(1)}`);
}

function getGroupTranslate(g: SVGGElement) {
  const tf = g.getAttribute("transform");
  if (!tf) return { x: 0, y: 0 };

  const match = tf.match(/translate\(([^,]+),\s*([^)]+)\)/);
  if (!match) return { x: 0, y: 0 };

  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
  };
}
if (!beat.staffEntryX) return;

let cx = beat.staffEntryX;
const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
el.setAttribute("cx", cx.toString());
el.setAttribute("cy", cy.toString());
el.setAttribute("r", "7");
el.classList.add("midi-ghost-note-incorrect");
el.setAttribute("stroke-width", "2");
const systemGroup = noteEl
  ? findSystemGroup(noteEl)
  : null;

(systemGroup ?? svg).appendChild(el);
activeHighlightsRef.current.add(el);


// Convert to local system coordinates
if (systemGroup) {
  const t = getGroupTranslate(systemGroup);
  cx = cx - t.x;
}

console.log(`🔴 Incorrect dot drawn: MIDI=${midi}, ht=${osmdHalfTone}, staff=${staffIndex}, X=${cx.toFixed(1)}, Y=${cy.toFixed(1)}`);
}

function findSystemGroup(el: SVGElement): SVGGElement | null {
  let node: Element | null = el;

  while (node) {
    if (node.tagName.toLowerCase() === "g") {
      const tf = node.getAttribute("transform");
      if (tf && tf.includes("translate")) {
        return node as SVGGElement;
      }
    }
    node = node.parentElement;
  }

  return null;
}

  function clearAllTracking() {
    playedNotesRef.current = [];

    activeHighlightsRef.current.forEach((element) => {
      try {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      } catch (e) {
        console.warn("Failed to remove highlight:", e);
      }
    });

    activeHighlightsRef.current.clear();
    console.log("🧹 Cleared all tracking and highlights");
  }

  function getCurrentBeatInfo() {
    if (!beatCursorRef.current) return null;

    const beat = beatCursorRef.current.getCurrentBeat();
    if (!beat) return null;

    return {
      beatIndex: beat.index,
      measure: beat.measureIndex + 1,
      beatInMeasure: beat.beatInMeasure + 1,
      expectedNotes: beatCursorRef.current
        .getCurrentExpectedMIDI()
        .map((m) => midiToNoteName(m))
        .join(", "),
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
      />

      {/* Debug Panel */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontFamily: "monospace",
          zIndex: 10000,
          maxWidth: "280px",
        }}
      >
        {(() => {
          const info = getCurrentBeatInfo();
          const currentScore =
            scoreableNotesRef.current > 0
              ? Math.round(
                  (correctStepsRef.current / scoreableNotesRef.current) * 100
                )
              : 0;
          const penalty = incorrectNotesRef.current * 5;
          const projectedScore = Math.max(0, currentScore - penalty);

          return info ? (
            <>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                  borderBottom: "1px solid #444",
                  paddingBottom: "4px",
                }}
              >
                🎵 Current Position
              </div>
              <div>
                Beat: {info.beatIndex + 1}/{totalSteps}
              </div>
              <div>
                Measure: {info.measure}, Beat: {info.beatInMeasure}
              </div>
              <div>Expected: {info.expectedNotes || "Rest"}</div>

              <div
                style={{
                  marginTop: "10px",
                  fontWeight: "bold",
                  borderTop: "1px solid #444",
                  paddingTop: "8px",
                  borderBottom: "1px solid #444",
                  paddingBottom: "4px",
                }}
              >
                📊 Scoring
              </div>
              <div>Scoreable Notes: {scoreableNotesRef.current}</div>
              <div style={{ color: "#4caf50" }}>
                ✓ Correct: {correctStepsRef.current}
              </div>
              <div style={{ color: "#f44336" }}>
                ✗ Incorrect: {incorrectNotesRef.current}
              </div>
              <div
                style={{
                  marginTop: "4px",
                  paddingTop: "4px",
                  borderTop: "1px solid #333",
                }}
              >
                Base Score: {currentScore}%
              </div>
              <div>Penalty: -{penalty}%</div>
              <div
                style={{
                  fontWeight: "bold",
                  color:
                    projectedScore >= 80
                      ? "#4caf50"
                      : projectedScore >= 60
                      ? "#ff9800"
                      : "#f44336",
                }}
              >
                Score: {projectedScore}%
              </div>

              <div
                style={{
                  marginTop: "10px",
                  borderTop: "1px solid #444",
                  paddingTop: "8px",
                }}
              >
                <div style={{ fontSize: "11px" }}>
                  <div style={{ color: "#ffd700" }}>
                    🏆 High:{" "}
                    {highScore !== null ? `${highScore}%` : "None"}
                  </div>
                  <div style={{ color: "#90caf9", marginTop: "2px" }}>
                    📝 Last:{" "}
                    {lastScore !== null ? `${lastScore}%` : "None"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  borderTop: "1px solid #444",
                  paddingTop: "8px",
                }}
              >
                <label style={{ display: "block", marginBottom: "4px" }}>
                  Tempo: {tempo} BPM
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  style={{ width: "100%" }}
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