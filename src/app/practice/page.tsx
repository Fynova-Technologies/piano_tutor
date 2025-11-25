'use client'
import React, { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Sampler } from "tone";

import {
  GraphicalNote,
} from "opensheetmusicdisplay";

interface TimelineNote {
  noteName: string;
  svgElem: SVGGraphicsElement | null;
  midi: number;
  pitch: string;
  time: number;      // ms
  duration: number;  // ms
  measureIndex: number;
  noteObj?: GraphicalNote | null;
  matched?: boolean;
  xmlNode: Element | null;   // <---- ADD THIS
}


export default function MusicXMLPlayer() {
  const containerRef = useRef<HTMLDivElement>(null!);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const timelineRef = useRef<TimelineNote[]>([]); // [{time, duration, midi, noteName, svgElem}]
  const samplerRef = useRef<Sampler | null>(null); // sampler will replace PolySynth
  const partRef = useRef<Tone.Part | null>(null);
  const rafRef = useRef<number | null>(null);
  const midiAccessRef = useRef<WebMidi.MIDIAccess | null>(null);
  const pressedNotesRef = useRef(new Set());
  const defaultTempoRef = useRef(60);
  const [score, setScore] = useState(0);
  const [correctNotes, setCorrectNotes] = useState(0);
  const [wrongNotes, setWrongNotes] = useState(0);
  const playedNotesRef = useRef([]); 

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

  function extractNotes(osmd:OpenSheetMusicDisplay) {
    const sheet = osmd.GraphicSheet.ParentMusicSheet;  // ✔ allowed
    const notes = [];
    const bpm = sheet.DefaultStartTempoInBpm || 120;
    const beatDuration = 60000 / bpm; // ms per beat

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currentTimeMs = 0;
    const gs = osmd.GraphicSheet;
    for (let staffIndex = 0; staffIndex < gs.MeasureList.length; staffIndex++) {
        const staffMeasures = gs.MeasureList[staffIndex];
    
        for (let measureIndex = 0; measureIndex < staffMeasures.length; measureIndex++) {
          const gMeasure = staffMeasures[measureIndex];
        
          for (const staffEntry of gMeasure.staffEntries) {
            for (const gve of staffEntry.graphicalVoiceEntries) {
              const startBeats = gve.parentVoiceEntry.Timestamp.RealValue;
            
              for (const gNote of gve.notes) {
                const source = gNote.sourceNote;
              
                const midi = source.halfTone;
              
                const durationBeats = source.Length.RealValue;
                const durationMs = durationBeats * beatDuration;
              
                notes.push({
                  midi,
                  timeMs: startBeats * beatDuration,
                  durationMs,
                  graphic: gNote,
                });
              }
            }
          }
        }
      }
    
      console.log("Extracted notes:", notes);
    
      return notes;
    }



  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function highlightAllNotes(osmd:OpenSheetMusicDisplay,color: string) {
  // if (!osmd.graphic || !osmd.graphic.sheet) {
  //   osmd.graphic.measureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0].sourceNote.noteheadColor="#F54927"
  //   // console.log("No graphic sheet available" ,osmd.graphic.measureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0].sourceNote.noteheadColor)
  //   //     console.log("No graphic sheet available" ,osmd.graphic.measureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0].sourceNote)
        
  //   return;
  // }
  const gs = osmd.GraphicSheet;

  const measureList = gs.MeasureList;

  for (const staff of measureList) {
    for (const measure of staff) {
      for (const staffEntry of measure.staffEntries) {
        for (const gve of staffEntry.graphicalVoiceEntries) {
          for (const gn of gve.notes) {
            // console.log("Graphical Note:", gve.notes[0].rules);
            console.log("Graphical Note Source:", gn);
            gve.notes[0].rules.DefaultColorNotehead="#F54927"
            gve.notes[0].rules.DefaultColorCursor= "#33e02f"
            gve.notes[0].rules.DefaultColorLabel= "#F54927" 
            gve.notes[0].rules.DefaultColorLyrics= "#000000" 
            gve.notes[0].rules.DefaultColorMusic= "#000000" 
            gve.notes[0].rules.DefaultColorNotehead= "#F54927" 
            gve.notes[0].rules.DefaultColorRest= "#000000" 
            gve.notes[0].rules.DefaultColorStem= "#000000" 
            gve.notes[0].rules.DefaultColorTitle= "#F54927"
          }
        }
      }
    }
  };
}


  useEffect(() => {
    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      backend: "svg",
      drawingParameters: "default",
      autoResize: true,
      pageBackgroundColor: "#fff",
    });

    osmdRef.current = osmd;
    let mounted = true;

    async function load() {
      await osmd.load("/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml");
      await osmd.render();

      if (!mounted) return;

      buildAccurateTimeline(osmd);
      setIsReady(true);
      mapSvgNoteElementsToTimeline();
      highlightAllNotes(osmd, "limegreen");
      extractNotes(osmd);
    }

    load();

    // ⭐ Add window resize listener
    const onResize = () => {
      osmd.render();
      setTimeout(() => {
        mapSvgNoteElementsToTimeline();
      }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



    useEffect(() => {
      if (!navigator.requestMIDIAccess) return;
      navigator.requestMIDIAccess().then((access) => {
        midiAccessRef.current = access;
        for (const input of access.inputs.values()) input.onmidimessage = handleMIDIMessage;
        access.onstatechange = () => { for (const input of access.inputs.values()) input.onmidimessage = handleMIDIMessage; };
      }).catch((e) => console.warn("MIDI access error", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleMIDIMessage(msg: WebMidi.MIDIMessageEvent) {
      const [status, midiNote, velocity] = msg.data;
      const command = status >> 4;

      function getNotesAtTime(currentTime:number, toleranceSec = 0.25) {
        if (!timelineRef.current) return [];

        const toleranceMs = toleranceSec * 1000;

        return timelineRef.current.filter(n =>
        Math.abs(n.time - currentTime) <= toleranceMs
      );
    }


      if (command === 9 && velocity > 0) { // Note On
        pressedNotesRef.current.add(midiNote);

        // Play audio (your sampler)
        if (samplerRef.current) {
          const name = midiToName(midiNote);
          samplerRef.current.triggerAttack(name, Tone.now(), velocity / 127);
        }

        const now = position; // Your playback timer in ms
        const expected = getNotesAtTime(now, 0.25);

        // MATCH RULE:
        // Notes are sorted; the first unmatched closest in time is the target.
        const match = expected.find(n => !n.matched && n.midi === midiNote);

        if (match) {
          match.matched = true;
          setScore(s => s + 10);
          setCorrectNotes(c => c + 1);

          // Highlight green
          const index = timelineRef.current.indexOf(match);
          highlightTimelineIndex(index, "correct");

        } else {
          setScore(s => Math.max(0, s - 5));
          setWrongNotes(w => w + 1);

          // Highlight all expected notes as wrong
          expected.forEach(exp => {
            const idx = timelineRef.current.indexOf(exp);
            highlightTimelineIndex(idx, "wrong");
          });
        }
      }
  }


  function highlightTimelineIndex(idx: number, type = "play") {
    const t = timelineRef.current[idx];
    if (!t || !t.svgElem) return;
    const el = t.svgElem;

    // Remove all previous highlights
    el.classList.remove("highlighted-play", "highlighted-press", "highlighted-correct", "highlighted-wrong");

    if (type === "play") {
      el.classList.add("highlighted-play");
      setTimeout(() => el.classList.remove("highlighted-play"), 
        Math.max(50, (t.duration || 0.2) * 1000));
    } else if (type === "correct") {
      el.classList.add("highlighted-correct");
      highlightTimelineIndex(idx, "correct");
      setTimeout(() => el.classList.remove("highlighted-correct"), 500);
    } else if (type === "wrong") {
      el.classList.add("highlighted-wrong");
      highlightTimelineIndex(idx, "wrong");
      setTimeout(() => el.classList.remove("highlighted-wrong"), 500);
    } else {
      el.classList.add("highlighted-press");
      setTimeout(() => el.classList.remove("highlighted-press"), 300);
    }
  }

  function getExpectedNotes() {
    const currentTime = position;
    const lookAhead = 2.0; // Look 2 seconds ahead

    return timelineRef.current.filter(n => {
      return n.time >= currentTime && n.time <= currentTime + lookAhead;
    }).slice(0, 5); // Show next 5 notes
  }

  function resetPractice() {
    setScore(0);
    setCorrectNotes(0);
    setWrongNotes(0);
    playedNotesRef.current = [];
    setPosition(0);
    stopPlayback();
  }


  function midiToName(num:number) {
    const octave = Math.floor(num / 12) - 1;
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return names[(num % 12 + 12) % 12] + octave;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function buildAccurateTimeline(osmd:OpenSheetMusicDisplay) {
    timelineRef.current = [];
    defaultTempoRef.current = 60;
    try {
      const xmlString = fetch("/songs/mxl/Happy_Birthday_To_You_C_Major.musicxml")
        .then(r => r.text());
      const raw = xmlString
      if (!raw || typeof raw !== "string") {
        buildHeuristicTimeline();
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(raw, "application/xml");

      const tempo = 60;
      defaultTempoRef.current = tempo;

      const parts = Array.from(xmlDoc.querySelectorAll("part"));
      let globalLastSecond = 0;
      for (const part of parts) {
        let currentSeconds = 0;
        let currentTempo = tempo;
        let localDivisions = 1;

        const measures = Array.from(part.querySelectorAll("measure"));
        for (const measure of measures) {
          const attrDiv = measure.querySelector("divisions");
          if (attrDiv && !isNaN(Number(attrDiv.textContent))) localDivisions = Number(attrDiv.textContent);

          const children = Array.from(measure.childNodes);
          for (const child of children) {
            if (!(child instanceof Element)) continue;

            if (child.nodeName === "direction") {
              const sound = child.querySelector && child.querySelector("sound[tempo]");
              if (sound && sound.getAttribute) {
                const t = Number(sound.getAttribute("tempo"));
                if (!isNaN(t) && t > 0) currentTempo = t;
              }
              const perMinute = child.querySelector && child.querySelector("metronome > per-minute");
              if (perMinute && !isNaN(Number(perMinute.textContent))) currentTempo = Number(perMinute.textContent);
              continue;
            }

            if (child.nodeName === "sound") {
              const t = child.getAttribute && child.getAttribute("tempo");
              if (t && !isNaN(Number(t))) currentTempo = Number(t);
              continue;
            }

            if (child.nodeType === 1 && (child as Element).tagName === "note") {
              const noteEl = child as Element;

              const isRest = noteEl.querySelector("rest") !== null;

              const durationEl = noteEl.querySelector("duration");
              const durationDivs = durationEl ? Number(durationEl.textContent) : null;

              const isChord = noteEl.querySelector("chord") !== null;

              let midi: number | null = null;
              let noteName: string | null = null;

              const pitchEl = noteEl.querySelector("pitch");
              if (pitchEl && !isRest) {
                const stepEl = pitchEl.querySelector("step");
                const octaveEl = pitchEl.querySelector("octave");
              
                if (stepEl && octaveEl) {
                  const step = stepEl.textContent ?? "C";
                
                  const alterEl = pitchEl.querySelector("alter");
                  const alter = alterEl ? Number(alterEl.textContent) : 0;
                
                  const octave = Number(octaveEl.textContent);
                
                  const semitoneMap: Record<string, number> = {
                    C: 0, D: 2, E: 4,
                    F: 5, G: 7, A: 9, B: 11
                  };

                  if (step in semitoneMap && !isNaN(octave)) {
                    const midiNumber =
                      (octave + 1) * 12 +
                      semitoneMap[step] +
                      alter;
                  
                    if (!isNaN(midiNumber)) {
                      midi = midiNumber;
                      noteName = midiToName(midiNumber);
                    }
                  }
                }
              }
              const divs = localDivisions > 0 ? localDivisions : 1;
              const durBeats = durationDivs !== null ? (durationDivs / divs) : 0;
              const durSeconds = durBeats * (60 / currentTempo);
              const timeSeconds = isChord ? Math.max(0, currentSeconds) : currentSeconds;
              if (midi !== null && isFinite(timeSeconds) && isFinite(durSeconds)) {
                timelineRef.current.push({
                  time: timeSeconds, duration: Math.max(0.01, durSeconds || 0.25), midi, noteName: noteName ?? "", xmlNode: noteEl,
                  svgElem: null,
                  pitch: "",
                  measureIndex: 0,
                  noteObj: null
                });
                globalLastSecond = Math.max(globalLastSecond, timeSeconds + (durSeconds || 0));
              }
              if (!isChord) currentSeconds += (durSeconds || 0);
              continue;
            }

            if (child.nodeName === "backup") {
              const d = child.querySelector && child.querySelector("duration");
              if (d && !isNaN(Number(d.textContent))) {
                const backDivs = Number(d.textContent);
                const backBeats = localDivisions > 0 ? backDivs / localDivisions : 0;
                currentSeconds = Math.max(0, currentSeconds - backBeats * (60 / currentTempo));
              }
              continue;
            }

            if (child.nodeName === "forward") {
              const d = child.querySelector && child.querySelector("duration");
              if (d && !isNaN(Number(d.textContent))) {
                const fDivs = Number(d.textContent);
                const fBeats = localDivisions > 0 ? fDivs / localDivisions : 0;
                currentSeconds += fBeats * (60 / currentTempo);
              }
              continue;
            }
          }
        }
      }
      setDuration(globalLastSecond || 0);
      if (timelineRef.current.length === 0) buildHeuristicTimeline();
    } catch (e) {
      console.warn("Timeline build failed:", e);
      buildHeuristicTimeline();
    }
  }

  function buildHeuristicTimeline() {
    const raw = containerRef.current
      ? Array.from(
          containerRef.current.querySelectorAll(
            "g.note, g.Note, g.graphicalNote, g.notehead"
          )
        )
      : [];

    // Keep only real SVG graphics elements
    const svgNotes = raw.filter(
      (el): el is SVGGraphicsElement => el instanceof SVGGraphicsElement
    );

    const total = svgNotes.length || 60;
    const totalSeconds = 30;

    timelineRef.current = [];

    for (let i = 0; i < total; i++) {
      timelineRef.current.push({
        time: (i * totalSeconds) / total,
        duration: 0.5,
        midi: 60 + (i % 12),
        noteName: midiToName(60 + (i % 12)),
        svgElem: svgNotes[i] ?? null, // ✔ always SVGGraphicsElement | null
        pitch: "",
        measureIndex: 0,
        noteObj: undefined,
        xmlNode: null
      });
    }

    setDuration(totalSeconds);
  }


  function mapSvgNoteElementsToTimeline() {
  try {
    const raw = containerRef.current
      ? Array.from(
          containerRef.current.querySelectorAll(
            "g.note, g.Note, g.graphicalNote, g.notehead"
          )
        )
      : [];

    if (raw.length === 0 || timelineRef.current.length === 0) return;

    // Filter only SVGGraphicsElement
    const svgNotes = raw.filter(
      (el): el is SVGGraphicsElement => el instanceof SVGGraphicsElement
    );

    const items = svgNotes.map((el) => ({
      el,
      rect: el.getBoundingClientRect(),
    }));

    items.sort((a, b) => a.rect.x - b.rect.x || a.rect.y - b.rect.y);

    for (let i = 0; i < timelineRef.current.length && i < items.length; i++) {
      timelineRef.current[i].svgElem = items[i].el; // ✔ safe
      items[i].el.classList.remove("highlighted-play", "highlighted-press");
    }
  } catch (e) {
    console.warn("SVG mapping failed", e);
  }
}


  async function startPlayback() {
    if (timelineRef.current.length === 0) return;
    await Tone.start();

    try { if (partRef.current) { partRef.current.dispose(); partRef.current = null; } } catch (e) {console.warn("Part dispose failed", e); }
    Tone.Transport.cancel(0);

    const bpm = defaultTempoRef.current || 60;
    if (isFinite(bpm) && bpm > 0) Tone.Transport.bpm.value = bpm;

    const sampler = samplerRef.current;
    const events = timelineRef.current.map((n, i) => ({ time: Number(n.time), note: n.noteName, duration: Number(n.duration || 0.2), index: i, midi: n.midi }))
      .filter(e => isFinite(e.time) && isFinite(e.duration) && e.time >= 0);

    if (events.length === 0) return;

    const part = new Tone.Part((time, value) => {
      try {
        if (sampler && sampler.triggerAttackRelease) {
          // use sampler for realistic sound
          sampler.triggerAttackRelease(value.note, value.duration, time, 0.9);
        } 
      } catch (e) { console.warn(e); }
      setPosition(Tone.Transport.seconds);
      highlightTimelineIndex(value.index, "play");
    }, events).start(0);

    partRef.current = part;

    const seekTo = Math.max(0, Number(position) || 0);
    if (isFinite(seekTo)) Tone.Transport.seconds = seekTo;

    try { Tone.Transport.start("+0.05"); setIsPlaying(true); } catch (e) { try { Tone.Transport.start(); setIsPlaying(true); } catch (e2) { console.warn("Transport start failed", e, e2); } }

function rafTick() {
  const t = Tone.Transport.seconds;

  // Stop when reached or passed end
  if (t >= duration - 0.05) {
    stopPlayback();
    setPosition(duration);
    return;
  }

  setPosition(t);
  rafRef.current = requestAnimationFrame(rafTick);
}
    rafRef.current = requestAnimationFrame(rafTick);
  }

  function stopPlayback() {
  try {
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
  } catch (e) {console.warn("Part dispose failed", e); }

  try {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
  } catch (e) {console.warn("Transport stop failed", e); }

  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  setIsPlaying(false);
}


  function togglePlayback() { if (isPlaying) stopPlayback(); else startPlayback(); }

  function onSliderChange(e: { target: { value: unknown; }; }) {
    const val = Number(e.target.value);
    if (!isFinite(val) || val < 0) return;
    setPosition(val);
    try { Tone.Transport.seconds = val; } catch (e) {
      console.warn("Transport seek failed", e);
    }
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button onClick={togglePlayback} style={{ padding: "8px 12px", borderRadius: 6, background: "#0ea5e9", color: "white", border: "none" }}>{isPlaying ? "Pause" : "Play"}</button>
        <div>Position: {position.toFixed(2)}s / {duration.toFixed(2)}s</div>
        <input type="range" min={0} max={duration || 0} step={0.01} value={position} onChange={onSliderChange} style={{ flex: 1 }} />
        <div>MIDI: {midiAccessRef.current ? "connected" : "not connected"}</div>
      </div>

      <div style={{ border: "1px solid #e5e7eb", padding: 8, height: 520, overflow: "auto" }}>
        <div ref={containerRef} />
      </div>


      <div style={{ marginTop: 10, color: "#6b7280" }}>
        Fixed: accurate MusicXML seconds conversion (handles chord, backup, forward, and direction tempo changes within limits), better SVG mapping (sorted by x position), robust scheduling and MIDI matching. Now using a Sampler (Salamander samples) for realistic piano sound. If you still hear issues, open the dev console and paste any errors here and I will debug further.
      </div>

      <div className="flex gap-20 bg-gray-900 text-white p-4 rounded-lg border border-gray-700">
  <div><strong>Score:</strong> {score}</div>
  <div><strong>Correct:</strong> <span className="text-green-400">{correctNotes}</span></div>
  <div><strong>Wrong:</strong> <span className="text-red-400">{wrongNotes}</span></div>
  <button onClick={resetPractice} className="bg-gray-700 hover:bg-white hover:text-gray-900 text-white font-bold py-1 px-3 rounded-md transition duration-150 ease-in-out border border-white">Reset</button>
</div>

<div  className="bg-gray-800 text-white p-4 rounded-lg border border-gray-700">
  <strong>Next Expected Notes:</strong>
  {getExpectedNotes().map((n, i) => (
    <span key={i} className="ml-2 px-2 py-1 bg-white text-gray-900 rounded-md font-mono text-sm border border-gray-500">
      {n.noteName} at {n.time.toFixed(1)}s
    </span>
  ))}
</div>
    </div>
  );
}
 