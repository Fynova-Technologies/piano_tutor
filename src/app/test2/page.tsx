/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";
import replaceOsmdCursor from "@/features/utils/replaceOsmdCursor";
import scoreNotePlayed from "@/features/scores/scorenoteplayed";
import findNotesAtCursorByMidi from "@/features/notes/findNotesatcursor";
import highlightGraphicalNoteNative from "@/features/notes/highlightgraphicalnotes";
import buildPlaybackStepsAndMaps from "@/features/playback/buildplaybacksetpsandmaps";
import pauseCursor from "@/features/playback/pausecursor";
import playCursor from "@/features/playback/playcursor";
import clearHighlight from "@/features/notes/clearhighlight";
import { onProgressClick } from "@/features/utils/onProgressclick";
import RenderOpenMusicSheet from "@/features/components/renderopenmusicsheet";

export default function Test2HybridFull() {
  // ========== NEW: Upload State ==========
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const samplerRef = useRef<Sampler | null>(null); // sampler will replace PolySynth
  // Original xml path (fallback)
  const fallbackXml = "/songs/mxl/midi2musicxml.musicxml";
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
  // ===== SCORING STATE =====
  const [score, setScore] = useState<number | null>(null);
  // scoring counters
  const totalStepsRef = useRef(0);
  const correctStepsRef = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  // Track which cursor steps were already scored
  const scoredStepsRef = useRef<Set<number>>(new Set());
  const currentCursorStepRef = useRef<number>(0);
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

          // Small delay to ensure DOM is ready
          setTimeout(() => {
            replaceOsmdCursor(osmd);
          }, 100);

          buildPlaybackStepsAndMaps(osmd,setTotalSteps,setPlayIndex);
        }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml]); // ← IMPORTANT: Re-run when xml changes!


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

              if (playModeRef.current) {
                scoreNotePlayed(key,playModeRef,currentCursorStepRef,scoredStepsRef,currentStepNotesRef,correctStepsRef);
              }

              
              // Visual feedback only in play mode
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
        if (isPlaying) pauseCursor(osmdRef,setIsPlaying,playModeRef);
        else playCursor({
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
          replaceOsmdCursor
        });
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
            scoreNotePlayed(midiNote,playModeRef,currentCursorStepRef,scoredStepsRef,currentStepNotesRef,correctStepsRef);
          } else {
            const wrongNotes = findNotesAtCursorByMidi(osmdRef.current,Number(midiNote));
            wrongNotes.forEach((gn) => highlightGraphicalNoteNative(gn, 800));
          }
        }
      }
    };
    
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playIndex]);


  // UI
  return (
  <>
    <RenderOpenMusicSheet
      showUploadPanel={showUploadPanel}
      setShowUploadPanel={setShowUploadPanel}
      uploadError={uploadError}
      setUploadError={setUploadError}
      uploadLoading={uploadLoading}
      setUploadLoading={setUploadLoading}
      uploadedMusicXML={uploadedMusicXML}
      setUploadedMusicXML={setUploadedMusicXML}
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
      midiOutputs={midiOutputs as any}
      midiInRef={midiInRef}
      playbackMidiGuard={playbackMidiGuard}
      setCountdown={setCountdown}
      setHighScore={setHighScore}
      setLastScore={setLastScore}
      score={score ?? 0}
      highScore={highScore??0}
      lastScore={lastScore}
      setCurrentStepNotes={setCurrentStepNotes}
      setScore={setScore}
      onProgressClick={onProgressClick}
      containerRef={containerRef}
      countdown={countdown}
      progressPercent={progressPercent}
    />  
  </>
  );
}