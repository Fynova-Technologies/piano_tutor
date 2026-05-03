/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import CursorControls from "@/features/components/cursorcontrols";
import { useSearchParams } from "next/navigation";
import { BeatCursor } from "@/features/playback/beatcursor";
import { saveSession } from "@/datastore/sessionstorage";
import {
  getSegmentEndBeat,
  getSegmentLabel,
  getSegmentColor,
} from "@/utils/segmentutil";
import { SectionSelector, useSectionSelector } from "@/components/library/sectionselector";

interface PlayedNote {
  midi: number;
  timestamp: number;
  cursorStep: number;
  wasCorrect: boolean;
  graphicalNotes?: any[];
}

function LibraryPlayerContent() {
  const searchparams = useSearchParams();

  const courseTitle = searchparams.get("title")      || "Lesson";
  const fileName    = searchparams.get("file")       || "";
  const source      = searchparams.get("source")     || "library";
  const cursorType  = (searchparams.get("cursor")    || "whole").toLowerCase();
  const difficulty  = searchparams.get("difficulty") || "";

  const xml = fileName;

  // ── Refs & State ────────────────────────────────────────────────────────────
  const containerRef         = useRef<HTMLDivElement | null>(null);
  const osmdRef              = useRef<any>(null);
  const hasInitializedOSMD   = useRef(false);
  const scoreableNotesRef    = useRef(0);
  const sessionStartRef      = useRef<number | null>(null);
  const attemptCountRef      = useRef(0);
  const samplerRef           = useRef<Sampler | null>(null);
  const midiInRef            = useRef<MIDIInput | null>(null);
  const beatCursorRef        = useRef<BeatCursor | null>(null);
  const playModeRef          = useRef<boolean>(false);
  const currentStepNotesRef  = useRef<number[]>([]);
  const currentCursorStepRef = useRef<number>(0);
  const playbackMidiGuard    = useRef<number>(0);
  const totalStepsRef        = useRef(0);
  const correctStepsRef      = useRef(0);
  const incorrectNotesRef    = useRef(0);
  const scoredStepsRef       = useRef<Set<number>>(new Set());
  const playedNotesRef       = useRef<PlayedNote[]>([]);
  const activeHighlightsRef  = useRef<Set<any>>(new Set());
  const playbackIntervalRef  = useRef<NodeJS.Timeout | null>(null);
  const rafRef               = useRef<number | null>(null);
  const beatStartTimeRef     = useRef<number>(0);
  const beatAdvancedRef      = useRef<boolean>(false);
  const tempoRef             = useRef(100);
  // Legacy ref kept for drawSegmentOverlay (cursorType-based segments)
  const segmentEndBeatRef    = useRef<number>(0);

  const [isPlaying, setIsPlaying]               = useState(false);
  const [playIndex, setPlayIndex]               = useState(0);
  const [totalSteps, setTotalSteps]             = useState(0);
  const [midiOutputs, setMidiOutputs]           = useState<MIDIOutput[]>([]);
  const [currentStepNotes, setCurrentStepNotes] = useState<number[]>([]);
  const [score, setScore]                       = useState<number | null>(null);
  const [countdown, setCountdown]               = useState<number | null>(null);
  const [highScore, setHighScore]               = useState<number | null>(null);
  const [lastScore, setLastScore]               = useState<number | null>(null);
  const [currentBeatIndex, setCurrentBeatIndex] = useState<number>(0);
  const [tempo, setTempo]                       = useState(100);
  const [segmentLabel, setSegmentLabel]         = useState<string>("");

  // ── Section selector ────────────────────────────────────────────────────────
  const {
    section,
    sectionRef,        // ← always-current; use this inside RAF/interval
    setSection,
    drawSectionHighlight,
    clearSectionHighlight,
  } = useSectionSelector(totalSteps, osmdRef, beatCursorRef);

  useEffect(() => { tempoRef.current = tempo; }, [tempo]);

  // ── Persist high/last score ─────────────────────────────────────────────────
  useEffect(() => {
    const hsStr = localStorage.getItem("highScore");
    const lsStr = localStorage.getItem("lastScore");
    if (hsStr !== null) { const hs = Number(hsStr); if (!Number.isNaN(hs)) setHighScore(hs); }
    if (lsStr !== null) { const ls = Number(lsStr); if (!Number.isNaN(ls)) setLastScore(ls); }
  }, []);

  // ── Inject highlight CSS ────────────────────────────────────────────────────
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

  // ── OSMD init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    attemptCountRef.current = 0;
    if (!containerRef.current) return;
    if (hasInitializedOSMD.current) return;
    if (!xml) { console.error("No file param provided"); return; }

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
        rules.MinimumDistanceBetweenSystems  = 5;
        rules.MeasureLeftMargin              = 12;
        rules.MeasureRightMargin             = 12;
        rules.ClefLeftMargin                 = 12;
        rules.ClefRightMargin                = 12;
        rules.PageLeftMargin                 = 4;
        rules.KeyRightMargin                 = 6;
        rules.MinNoteDistance                = 6;
        rules.VoiceSpacingMultiplierVexflow  = 2.25;
        rules.StaffHeight                    = 12;

        await osmd.render();
        if (cancelled) return;

        osmdRef.current = osmd;
        hasInitializedOSMD.current = true;
        if (osmd.cursor) osmd.cursor.hide();

        setTimeout(() => {
          if (cancelled || !osmdRef.current) return;
          try {
            const beatCursor = new BeatCursor(osmdRef.current);
            beatCursorRef.current = beatCursor;

            const totalBeats = beatCursor.getTotalBeats();
            const segEnd     = getSegmentEndBeat(totalBeats, cursorType);
            segmentEndBeatRef.current = segEnd;

            setTotalSteps(segEnd);
            totalStepsRef.current = segEnd;

            setSegmentLabel(getSegmentLabel(cursorType));
            setCurrentBeatIndex(0);
            currentCursorStepRef.current = 0;

            const expectedMIDI = beatCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;

            setTimeout(() => {
              drawSegmentOverlay();
              // Draw initial section highlight using the default (full) range
              drawSectionHighlight({ startBeat: 0, endBeat: segEnd });
            }, 120);
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

            const totalBeats = newCursor.getTotalBeats();
            const segEnd     = getSegmentEndBeat(totalBeats, cursorType);
            segmentEndBeatRef.current = segEnd;
            setTotalSteps(segEnd);
            totalStepsRef.current = segEnd;

            const expectedMIDI = newCursor.getCurrentExpectedMIDI();
            setCurrentStepNotes(expectedMIDI);
            currentStepNotesRef.current = expectedMIDI;

            setTimeout(() => {
              drawSegmentOverlay();
              drawSectionHighlight(sectionRef.current);
            }, 100);
          }
        }, 200);
      } catch (e) { console.error("Resize error:", e); }
    };

    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (beatCursorRef.current) beatCursorRef.current.destroy();
    };
  }, [xml, cursorType]);

  // ── Sampler setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function createSampler() {
      const sampler = new Sampler({
        urls: {
          A0: "A0.mp3",   C1: "C1.mp3",   "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
          A1: "A1.mp3",   C2: "C2.mp3",   "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
          A2: "A2.mp3",   C3: "C3.mp3",   "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
          A3: "A3.mp3",   C4: "C4.mp3",   "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
          A4: "A4.mp3",   C5: "C5.mp3",   "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
          A5: "A5.mp3",   C6: "C6.mp3",   "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
          A6: "A6.mp3",   C7: "C7.mp3",   "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
          A7: "A7.mp3",   C8: "C8.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1,
      }).toDestination();

      for (let i = 0; i < 200; i++) {
        if (sampler.loaded) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!mounted) { try { sampler.dispose(); } catch (e) {} return; }
      samplerRef.current = sampler;
    }
    createSampler();
    return () => { mounted = false; };
  }, []);

  // ── MIDI setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("requestMIDIAccess" in navigator)) return;
    let active = true;
    navigator.requestMIDIAccess({ sysex: false }).then((m) => {
      if (!active) return;
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
          if (isNoteOn && playModeRef.current) trackAndHighlightNote(key);
        };
      }
    }).catch((e) => console.warn("No MIDI access", e));
    return () => {
      active = false;
      try { if (midiInRef.current) midiInRef.current.onmidimessage = null; } catch {}
    };
  }, []);

  // ── Keyboard handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const keyToMidi: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65,
      t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
    };
    const onKey = async (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (isPlaying) pausePlayback(); else startPlayback();
        return;
      }
      const midiNote = keyToMidi[ev.key.toLowerCase()];
      if (midiNote && !ev.repeat) {
        ev.preventDefault();
        if (samplerRef.current && Tone.context.state !== "running") await Tone.start();
        if (samplerRef.current) samplerRef.current.triggerAttackRelease(midiToName(midiNote), "8n");
        if (playModeRef.current) trackAndHighlightNote(midiNote);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Playback ────────────────────────────────────────────────────────────────
  function startPlayback() {
    if (!beatCursorRef.current) return;

    clearAllTracking();
    attemptCountRef.current += 1;

    // ── Read start/end from sectionRef (never stale) ─────────────────────────
    const segStart = sectionRef.current.startBeat;
    const segEnd   = sectionRef.current.endBeat || totalStepsRef.current;

    // Redraw overlays after tracking is cleared
    setTimeout(() => {
      drawSegmentOverlay();
      drawSectionHighlight(sectionRef.current);
    }, 50);

    // Reset cursor to the section start, not always beat 0
    beatCursorRef.current.setPosition(segStart);
    setCurrentBeatIndex(segStart);
    currentCursorStepRef.current = segStart;
    setPlayIndex(segStart);
    setIsPlaying(true);
    playModeRef.current = true;

    // Count scoreable notes only within the section
    let scoreableCount = 0;
    beatAdvancedRef.current = false;
    beatStartTimeRef.current = 0;

    for (let i = segStart; i < segEnd; i++) {
      const beat = beatCursorRef.current.getBeatAt(i);
      if (beat?.isNoteStart && beat.expectedNotes.length > 0) scoreableCount++;
    }

    scoreableNotesRef.current = scoreableCount;
    correctStepsRef.current   = 0;
    incorrectNotesRef.current = 0;
    scoredStepsRef.current.clear();

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
        if (beatCursorRef.current) beatCursorRef.current.startPlayback();
        startAutomaticPlayback();
      }
    }, 1000);
  }

  function startAutomaticPlayback() {
    if (playbackIntervalRef.current) { clearInterval(playbackIntervalRef.current); playbackIntervalRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    beatStartTimeRef.current = performance.now();

    function tick(now: number) {
      if (!playModeRef.current || !beatCursorRef.current) return;

      const beatDuration = (60 / tempoRef.current) * 1000;
      const elapsed      = now - beatStartTimeRef.current;

      beatCursorRef.current.setInterpolatedPosition(elapsed / beatDuration);

      const MOVE_FRACTION = 0.7;
      if (elapsed >= beatDuration * MOVE_FRACTION && !beatAdvancedRef.current) {
        beatAdvancedRef.current = true;
        const nextIndex = beatCursorRef.current.getCurrentIndex() + 1;

        // ── Use sectionRef — always current, safe inside RAF ─────────────────
        const segEnd = sectionRef.current.endBeat;
        if (segEnd > 0 && nextIndex >= segEnd) {
          // At last beat of section — don't peek further
        } else {
          const nextBeat = beatCursorRef.current.getBeatAt(nextIndex);
          if (nextBeat) {
            const nextMIDI = nextBeat.expectedNotes.map((ht: number) => ht + 12);
            setCurrentStepNotes(nextMIDI);
            currentStepNotesRef.current = nextMIDI;
            currentCursorStepRef.current = nextIndex;
            beatCursorRef.current.setDefaultColor(nextIndex);
          }
        }
      }

      if (elapsed >= beatDuration) {
        beatStartTimeRef.current = now;
        beatAdvancedRef.current = false;
        const moved = beatCursorRef.current.next();

        if (moved) {
          const newIndex = beatCursorRef.current.getCurrentIndex();

          // ── Section boundary check using sectionRef ──────────────────────
          const segEnd = sectionRef.current.endBeat;
          if (segEnd > 0 && newIndex >= segEnd) {
            handleEndOfPiece();
            return;
          }

          setCurrentBeatIndex(newIndex);
          setPlayIndex(newIndex);
        } else {
          handleEndOfPiece();
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function pausePlayback() {
    setIsPlaying(false);
    playModeRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (playbackIntervalRef.current) { clearInterval(playbackIntervalRef.current); playbackIntervalRef.current = null; }
    if (beatCursorRef.current) beatCursorRef.current.stopPlayback();
  }

  function handleEndOfPiece() {
    setIsPlaying(false);
    playModeRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (beatCursorRef.current) beatCursorRef.current.stopPlayback();

    const correct   = correctStepsRef.current;
    const incorrect = incorrectNotesRef.current;
    const scoreable = scoreableNotesRef.current;
    let finalScore  = 0;

    if (scoreable > 0) {
      const precision = correct + incorrect > 0 ? correct / (correct + incorrect) : 0;
      const recall    = correct / scoreable;
      finalScore      = Math.round(precision * recall * 100);
    }

    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", finalScore.toString());

    if (highScore === null || finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("highScore", finalScore.toString());
    }

    const endTime     = Date.now();
    const startTime   = sessionStartRef.current ?? endTime;
    const durationSec = Math.round((endTime - startTime) / 1000);

    const lessonId  = searchparams.get("lessonid") || "0";
    const lessonUID = `${source}-${lessonId}`;

    saveSession({
      id: crypto.randomUUID(),
      startedAt: startTime,
      endedAt: endTime,
      durationSec,
      lesson: { uid: lessonUID, id: lessonId, title: courseTitle, source },
      performance: {
        attempts: Math.max(1, attemptCountRef.current),
        score: finalScore,
      },
    });
  }

  useEffect(() => {
    return () => { if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current); };
  }, []);

  // ── Note tracking ───────────────────────────────────────────────────────────
  function trackAndHighlightNote(midi: number) {
    const actualCurrentBeatIndex = currentCursorStepRef.current;
    if (!beatCursorRef.current || !playModeRef.current) return;

    const currentBeat = beatCursorRef.current.getBeatAt(actualCurrentBeatIndex);
    if (!currentBeat) return;

    const expectedMIDI = beatCursorRef.current.getCurrentExpectedMIDI();
    const isNoteStart  = currentBeat.isNoteStart === true;
    const exactMatch   = expectedMIDI.includes(midi);
    const isCorrect    = exactMatch && isNoteStart;

    if (scoredStepsRef.current.has(actualCurrentBeatIndex)) return;

    if (isNoteStart) {
      scoredStepsRef.current.add(actualCurrentBeatIndex);
      if (isCorrect) {
        correctStepsRef.current += 1;
        beatCursorRef.current.flashCorrect();
      } else {
        incorrectNotesRef.current += 1;
        beatCursorRef.current.flashIncorrect();
      }
    } else if (!exactMatch) {
      incorrectNotesRef.current += 1;
      beatCursorRef.current.flashIncorrect();
    }

    let graphicalNotes: any[] = [];
    if (isCorrect) {
      graphicalNotes = beatCursorRef.current.findGraphicalNotesAtCurrentBeat(midi);
    }

    playedNotesRef.current.push({ midi, timestamp: Date.now(), cursorStep: actualCurrentBeatIndex, wasCorrect: isCorrect, graphicalNotes });
    drawFeedbackDot(osmdRef.current, midi, isCorrect, currentBeat, graphicalNotes);
  }

  function midiToName(num: number) {
    const octave = Math.floor(num / 12) - 1;
    const names  = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return names[(num % 12 + 12) % 12] + octave;
  }

  function midiToNoteName(midi: number): string {
    const noteNames = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    return `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }

  function drawFeedbackDot(osmd: any, midi: number, isCorrect: boolean, beat: any, graphicalNotes?: any[]) {
    if (!osmd?.drawer?.backend) return;
    const svg = osmd.drawer.backend.getSvgElement();
    if (!svg) return;

    const graphicSheet = osmd.GraphicSheet;
    const measureList  = graphicSheet.MeasureList;

    if (isCorrect && graphicalNotes?.length) {
      for (const gNote of graphicalNotes) {
        const vfNote = Array.isArray(gNote?.vfnote) ? gNote.vfnote[0] : gNote?.vfnote ?? gNote?.VexFlowNote;
        const noteEl: SVGGraphicsElement | null = vfNote?.attrs?.el ?? null;
        if (!noteEl) continue;
        const notehead =
          (noteEl.querySelector(".vf-notehead") as SVGGraphicsElement) ??
          (noteEl.querySelector("path")         as SVGGraphicsElement) ??
          (noteEl.querySelector("use")          as SVGGraphicsElement);
        const bbox = (notehead ?? noteEl).getBBox();
        const el   = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        el.setAttribute("cx", (bbox.x + bbox.width / 2).toString());
        el.setAttribute("cy", (bbox.y + bbox.height / 2).toString());
        el.setAttribute("r",  "5");
        el.classList.add("midi-ghost-note-correct");
        el.setAttribute("stroke-width", "2");
        svg.appendChild(el);
        activeHighlightsRef.current.add(el);
      }
      return;
    }

    if (!beat?.staffEntryX) return;

    const osmdHT  = midi - 12;
    const EPSILON = 1e-6;
    const beatTime = beat.timestamp?.RealValue ?? 0;

    function halfToneToDiatonic(ht: number): number {
      const map = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
      const oct = Math.floor(ht / 12);
      const chr = ((ht % 12) + 12) % 12;
      return oct * 7 + map[chr];
    }

    const numStavesTotal = measureList[0]?.length ?? 1;
    const staffPitchRanges: { min: number; max: number }[] = [];
    for (let s = 0; s < numStavesTotal; s++) {
      let min = Infinity, max = -Infinity;
      for (let m = 0; m < measureList.length; m++) {
        for (const se of measureList[m]?.[s]?.staffEntries ?? []) {
          for (const gve of se.graphicalVoiceEntries ?? []) {
            for (const gn of gve.notes ?? []) {
              const ht = gn.sourceNote?.halfTone;
              if (ht == null || gn.sourceNote?.isRest?.()) continue;
              if (ht < min) min = ht;
              if (ht > max) max = ht;
            }
          }
        }
      }
      staffPitchRanges[s] = { min, max };
    }

    let staffIndex = 0, bestDist = Infinity;
    for (let s = 0; s < staffPitchRanges.length; s++) {
      const { min, max } = staffPitchRanges[s];
      if (min === Infinity) continue;
      const dist = Math.abs((min + max) / 2 - osmdHT);
      if (dist < bestDist) { bestDist = dist; staffIndex = s; }
    }

    const targetMeasure   = measureList[beat.measureIndex]?.[staffIndex];
    const parentStaffLine = targetMeasure?.parentStaffLine;

    type NoteRef = { ht: number; y: number; beatDist: number; vf: any };
    let bestAnchor: NoteRef | null = null;

    for (let m = 0; m < measureList.length; m++) {
      const measure = measureList[m]?.[staffIndex];
      if (!measure || measure.parentStaffLine !== parentStaffLine) continue;
      for (const staffEntry of measure.staffEntries ?? []) {
        const entryBeat = staffEntry.sourceStaffEntry?.Timestamp?.RealValue;
        if (entryBeat == null) continue;
        const dist = Math.abs(entryBeat - beatTime);
        for (const gve of staffEntry.graphicalVoiceEntries ?? []) {
          for (const gn of gve.notes ?? []) {
            if (gn.sourceNote?.isRest?.()) continue;
            const ht = gn.sourceNote?.halfTone;
            if (ht == null) continue;
            const vf = Array.isArray(gn.vfnote) ? gn.vfnote[0] : gn.vfnote;
            if (!vf) continue;
            const noteEl: SVGGraphicsElement | null = vf?.attrs?.el ?? null;
            if (!noteEl) continue;
            const notehead =
              (noteEl.querySelector(".vf-notehead") as SVGGraphicsElement) ??
              (noteEl.querySelector("path")         as SVGGraphicsElement) ??
              (noteEl.querySelector("use")          as SVGGraphicsElement);
            const bbox          = (notehead ?? noteEl).getBBox();
            const anchorCenterY = bbox.y + bbox.height / 2;
            if (!bestAnchor || dist < bestAnchor.beatDist - EPSILON) {
              bestAnchor = { ht, y: anchorCenterY, beatDist: dist, vf };
            }
          }
        }
      }
    }

    if (!bestAnchor) return;

    const currentMeasureRow       = measureList[beat.measureIndex];
    const currentSystemStaffLines: any[] = [];
    for (let s = 0; s < (currentMeasureRow?.length ?? 0); s++) {
      currentSystemStaffLines[s] = currentMeasureRow[s]?.parentStaffLine ?? null;
    }

    const systemStavesBySlot: any[] = [];
    for (let s = 0; s < (currentMeasureRow?.length ?? 0); s++) {
      const targetStaffLine = currentSystemStaffLines[s];
      for (let m = 0; m < measureList.length; m++) {
        const ms = measureList[m]?.[s];
        if (!ms) continue;
        if (targetStaffLine && ms.parentStaffLine !== targetStaffLine) continue;
        if (ms.stave?.y != null) { systemStavesBySlot[s] = ms.stave; break; }
        for (const se of ms.staffEntries ?? []) {
          for (const gve of se.graphicalVoiceEntries ?? []) {
            for (const gn of gve.notes ?? []) {
              const vf = Array.isArray(gn.vfnote) ? gn.vfnote[0] : gn.vfnote;
              if (vf?.stave?.y != null) { systemStavesBySlot[s] = vf.stave; break; }
            }
            if (systemStavesBySlot[s]) break;
          }
          if (systemStavesBySlot[s]) break;
        }
        if (systemStavesBySlot[s]) break;
      }
    }

    const sortedStaves   = systemStavesBySlot.filter(Boolean).sort((a, b) => a.y - b.y);
    const trebleStaveObj = sortedStaves[0];
    const bassStaveObj   = sortedStaves[sortedStaves.length - 1];

    const nD = halfToneToDiatonic(osmdHT);
    let cy: number;

    if (bassStaveObj && bassStaveObj.y !== trebleStaveObj?.y && osmdHT < 48) {
      const bassTopLineY = bassStaveObj.getYForLine(0);
      const bassStep     = (bassStaveObj.getYForLine(4) - bassTopLineY) / 4 / 2;
      cy = bassTopLineY + (halfToneToDiatonic(43) - nD) * bassStep + bassStep * 0.9;
    } else {
      const trebleTopLineY = trebleStaveObj.getYForLine(0);
      const trebleStep     = (trebleStaveObj.getYForLine(4) - trebleTopLineY) / 4 / 2;
      cy = trebleTopLineY + (halfToneToDiatonic(64) - nD) * trebleStep + trebleStep * 0.95;
    }

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", beat.staffEntryX.toString());
    dot.setAttribute("cy", cy.toString());
    dot.setAttribute("r",  "5");
    dot.setAttribute("fill", "red");
    dot.setAttribute("opacity", "1");
    dot.classList.add("midi-ghost-note-incorrect");
    svg.appendChild(dot);
    activeHighlightsRef.current.add(dot);
  }

  // ── Segment overlay (cursorType-based solid line) ───────────────────────────
  // This is separate from the custom section highlight.
  function drawSegmentOverlay() {
    if (cursorType === "whole") return;
    if (!osmdRef.current?.drawer?.backend) return;

    const svg = osmdRef.current.drawer.backend.getSvgElement() as SVGSVGElement | null;
    if (!svg) return;

    svg.querySelectorAll(".segment-overlay-el").forEach((el) => el.remove());

    const beatCursor = beatCursorRef.current;
    if (!beatCursor) return;

    const segEnd = segmentEndBeatRef.current;
    if (!segEnd || segEnd <= 0) return;

    let cutX: number | null = null;
    for (let i = segEnd - 1; i >= 0; i--) {
      const beat = beatCursor.getBeatAt(i);
      if (beat?.staffEntryX != null) { cutX = beat.staffEntryX as number; break; }
    }
    if (cutX === null) return;
  }

  function clearAllTracking() {
    playedNotesRef.current = [];
    activeHighlightsRef.current.forEach((element) => {
      try { if (element.parentNode) element.parentNode.removeChild(element); } catch (e) {}
    });
    activeHighlightsRef.current.clear();
  }

  function getCurrentBeatInfo() {
    if (!beatCursorRef.current) return null;
    const beat = beatCursorRef.current.getCurrentBeat();
    if (!beat) return null;
    return {
      beatIndex:     beat.index,
      measure:       beat.measureIndex + 1,
      beatInMeasure: beat.beatInMeasure + 1,
      expectedNotes: beatCursorRef.current.getCurrentExpectedMIDI().map((m) => midiToNoteName(m)).join(", "),
    };
  }

  // Progress is relative to the active section
  const sectionLength   = section.endBeat - section.startBeat;
  const progressPercent = sectionLength > 0
    ? Math.round(((currentBeatIndex - section.startBeat) / Math.max(1, sectionLength - 1)) * 100)
    : 0;

  const segmentColor = getSegmentColor(cursorType);

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Segment badge */}
      {cursorType !== "whole" && segmentLabel && (
        <div style={{
          position: "fixed", top: "10px", left: "10px",
          background: segmentColor, color: "#fff",
          padding: "4px 12px", borderRadius: "20px",
          fontSize: "12px", fontWeight: 700, fontFamily: "monospace",
          zIndex: 10001, letterSpacing: "0.04em",
          boxShadow: `0 0 12px ${segmentColor}88`,
        }}>
          ✂️ {segmentLabel}
        </div>
      )}

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
          const rect      = e.currentTarget.getBoundingClientRect();
          const percent   = (e.clientX - rect.left) / rect.width;
          // Seek within the active section only
          const segStart  = sectionRef.current.startBeat;
          const segEnd    = sectionRef.current.endBeat || totalStepsRef.current;
          const targetBeat = Math.min(
            segStart + Math.floor(percent * (segEnd - segStart)),
            segEnd - 1
          );
          if (beatCursorRef.current) {
            beatCursorRef.current.setPosition(targetBeat);
            setCurrentBeatIndex(targetBeat);
            currentCursorStepRef.current = targetBeat;
            setPlayIndex(targetBeat);
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

      {/* Section selector — placed near CursorControls */}
      <SectionSelector
        totalBeats={totalSteps}
        section={section}
        setSection={(r) => {
          setSection(r);
          // Also keep segmentEndBeatRef in sync for drawSegmentOverlay
          segmentEndBeatRef.current = r.endBeat;
        }}
        onApply={(committed) => {
          // committed is the freshly set range — no stale-state issue
          segmentEndBeatRef.current = committed.endBeat;
          // Remove old segment-overlay-el line and redraw with committed range
          clearSectionHighlight();
          setTimeout(() => drawSectionHighlight(committed), 80);
        }}
        onReset={() => {
          segmentEndBeatRef.current = totalSteps;
          clearSectionHighlight();
          // Full piece — no custom highlight needed
        }}
        isPlaying={isPlaying}
        getMeasureForBeat={(beat) => {
          const b = beatCursorRef.current?.getBeatAt(beat);
          return b?.measureIndex != null ? b.measureIndex + 1 : beat + 1;
        }}
      />

      {/* Debug Panel */}
      <div style={{
        position: "fixed", top: "10px", right: "10px",
        background: "rgba(0,0,0,0.8)", color: "white",
        padding: "10px", borderRadius: "6px",
        fontSize: "12px", fontFamily: "monospace",
        zIndex: 10000, maxWidth: "280px",
      }}>
        {(() => {
          const info           = getCurrentBeatInfo();
          const currentScore   = scoreableNotesRef.current > 0
            ? Math.round((correctStepsRef.current / scoreableNotesRef.current) * 100)
            : 0;
          const penalty        = incorrectNotesRef.current * 5;
          const projectedScore = Math.max(0, currentScore - penalty);

          return info ? (
            <>
              <div style={{ fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #444", paddingBottom: "4px" }}>
                🎵 Current Position
              </div>
              <div>Beat: {info.beatIndex + 1}/{totalSteps}</div>
              <div>Measure: {info.measure}, Beat: {info.beatInMeasure}</div>
              <div>Expected: {info.expectedNotes || "Rest"}</div>

              {/* Active section info */}
              <div style={{ marginTop: "6px", fontSize: "10px", color: "#38bdf8", fontFamily: "monospace" }}>
                Section: b{section.startBeat + 1}–b{section.endBeat}
              </div>

              <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  background: segmentColor, color: "#fff",
                  padding: "1px 8px", borderRadius: "10px",
                  fontSize: "10px", fontWeight: 700,
                }}>
                  {segmentLabel || "Full Piece"}
                </span>
                {cursorType !== "whole" && (
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{difficulty}</span>
                )}
              </div>

              <div style={{ marginTop: "10px", fontWeight: "bold", borderTop: "1px solid #444", paddingTop: "8px", borderBottom: "1px solid #444", paddingBottom: "4px" }}>
                📊 Scoring
              </div>
              <div>Scoreable Notes: {scoreableNotesRef.current}</div>
              <div style={{ color: "#4caf50" }}>✓ Correct: {correctStepsRef.current}</div>
              <div style={{ color: "#f44336" }}>✗ Incorrect: {incorrectNotesRef.current}</div>
              <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #333" }}>
                Base Score: {currentScore}%
              </div>
              <div>Penalty: -{penalty}%</div>
              <div style={{ fontWeight: "bold", color: projectedScore >= 80 ? "#4caf50" : projectedScore >= 60 ? "#ff9800" : "#f44336" }}>
                Score: {projectedScore}%
              </div>

              <div style={{ marginTop: "10px", borderTop: "1px solid #444", paddingTop: "8px" }}>
                <div style={{ fontSize: "11px" }}>
                  <div style={{ color: "#ffd700" }}>🏆 High: {highScore !== null ? `${highScore}%` : "None"}</div>
                  <div style={{ color: "#90caf9", marginTop: "2px" }}>📝 Last: {lastScore !== null ? `${lastScore}%` : "None"}</div>
                </div>
              </div>

              <div style={{ marginTop: "10px", borderTop: "1px solid #444", paddingTop: "8px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Tempo: {tempo} BPM</label>
                <input
                  type="range" min="40" max="200" value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  style={{ width: "100%" }}
                  disabled={isPlaying}
                />
              </div>

              <div style={{ marginTop: "10px", borderTop: "1px solid #444", paddingTop: "8px", fontSize: "10px", color: "#64748b", wordBreak: "break-all" }}>
                📄 {fileName.split("/").pop()}
              </div>
            </>
          ) : (
            <div>{xml ? "Loading score…" : "⚠️ No file specified"}</div>
          );
        })()}
      </div>
    </>
  );
}

export default function LibraryPlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LibraryPlayerContent />
    </Suspense>
  );
}