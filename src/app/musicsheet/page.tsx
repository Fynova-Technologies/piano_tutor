"use client";

import React, { useCallback } from "react";
import { useState, useRef, useEffect, JSX } from "react";
import StatusbarMusicSheet from "@/components/musicSheet/StatusbarMusicSheet";
import FooterMusicsheet from "@/components/musicSheet/FooterMusicsheet";
const STAFF_LINE_GAP = 20; // px 
const STAFF_WIDTH = 1620;
const CLEF_WIDTH = 40;

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};
interface NoteRendererProps {
  capturedNotes: CapturedNoteGroup[];
  timeSignature: { top: number; bottom: number };
  isPlaying: boolean;
  systemIndex: 0 | 1; // Add systemIndex property
}

type correctNotes={
  systemIndex: number;
  x_pos : number,
  y_pos : number
}

type Note = { x_pos: number; y_pos: number; systemIndex: number };

const THRESHOLD = 1;

export default function SheetMusicPage() {
  const [timeSignature, setTimeSignature] = useState({ top: 4, bottom: 4 });
  const [sliderBeat, setSliderBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(60);
  // const subdivisionsPerBeat = 4; // e.g., 4 for 16th notes in 4/4 time
  const [capturedNotes, setCapturedNotes] = useState<CapturedNoteGroup[]>([]);
  const [correctNotes,setCorrectNotes] = useState<correctNotes[]>([]);
  const [IncorrectNotes,setInCorrectNotes] = useState<correctNotes[]>([]);
  const activeNotes = React.useRef<Map<number, number>>(new Map()); // Track active notes and their sliderBeat
  const sliderBeatRef = useRef(sliderBeat);
  const [keyspositions, setKeysPositions] = useState<{ [key: string]: [number, number,number][] }>({});
  const [checking, setChecking] = useState(false);
  const [randomPositions, setRandomPositions] = useState<[string, [number, number]][]>([]);
  const [lowerrandomPositions, setLowerRandomPositions] = useState<[string, [number, number]][]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerID = useRef<NodeJS.Timeout | null>(null);
  const scheduleAheadTime = 0.2; // Schedule 100ms ahead
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const currentBeatRef = useRef(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  // const countInBuffer = useRef<AudioBuffer | null>(null);
  const countInBuffers = useRef<(AudioBuffer | null)[]>([null, null, null, null]);





  
  const loadCountInSound = async () => {
    if (!audioContextRef.current) return;
  
    const soundUrls = [
      '/sound/one.mp3',
      '/sound/two.mp3',
      '/sound/three.mp3',
      '/sound/start.mp3',
    ];
  
    const promises = soundUrls.map(async (url, i) => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
      countInBuffers.current[i] = buffer;
    });
  
    await Promise.all(promises);
  };


  const initializeAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.AudioContext)();
    }
  
    // Only load if any buffer is null
    if (countInBuffers.current.some(buffer => !buffer)) {
      await loadCountInSound();
    }
  };

  

  const playClick = (time = 0, isDownbeat = false, countInIndex: number | null = null) => {
    if (!audioContextRef.current) return;
  
    if (countInIndex !== null && countInBuffers.current[countInIndex]) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = countInBuffers.current[countInIndex];
      source.connect(audioContextRef.current.destination);
      source.start(time);
      return;
    }
  
    // Regular metronome click
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
  
    osc.frequency.value = isDownbeat ? 1000 : 800;
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.1);
  
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
  
    osc.start(time);
    osc.stop(time + 0.06);
  };

   

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scheduleNote = (beatNumber: number, time: number | undefined) => {
    playClick(time, beatNumber % 4 === 0); // Downbeat every 4 beats
  };
  
  
  const stopMetronome = () => {
    clearInterval(timerID.current as NodeJS.Timeout | undefined);
    timerID.current = null;
  };


  const scheduler = useCallback(() => {
    while (
      audioContextRef.current &&
      nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime
    ) {
  
      // Sync slider movement (in real-time) with audio schedule
      const scheduledBeat = currentBeatRef.current;
      const scheduledTime = nextNoteTimeRef.current;
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);


  
      // This causes the slider to update at *exactly* the right time
      setTimeout(() => {
        setSliderBeat(scheduledBeat);
      }, (scheduledTime - audioContextRef.current!.currentTime) * 1000);
  
      nextNoteTimeRef.current += 60.0 / bpm;
      currentBeatRef.current++;
    }
  }, [scheduleNote, bpm]);

 


 
  
    // Clean up on component unmount
    useEffect(() => {
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };
    }, []);

  const beatsPerSystem = timeSignature.top * 4; // number of beats in each system

  const positions: { [key: string]: [number, number] } = {
    "1": [104.375, 120], 
    "2": [203.125, 120],
    "3": [301.875, 120],
    "4": [400.625, 120],
    "5": [499.375, 120],
    "6": [598.125, 120],
    "7": [696.875, 120],
    "8": [795.625, 120],
    "9": [894.375, 120],
    "10": [993.125, 120],
    "11": [1091.875, 120],
    "12": [1190.625, 120],
    "13": [1289.375, 120],
    "14": [1388.125, 120],
    "15": [1486.875, 120],
    "16": [1585.625, 120],
  };

  const positionslower : {[key: string]: [number , number]}={
    "17": [104.375, 202],
    "18": [203.125, 202],
    "19": [301.875, 202],
    "20": [400.625, 202],
    "21": [499.375, 202],
    "22": [598.125, 202],
    "23": [696.875, 202],
    "24": [795.625, 202],
    "25": [894.375, 202],
    "26": [993.125, 202],
    "27": [1091.875, 202],
    "28": [1190.625, 202],
    "29": [1289.375, 202],
    "30": [1388.125, 202],
    "31": [1486.875, 202],
    "32": [1585.625, 202],
  }

  const regenerateRandomLowerNotes = () => {
    setLowerRandomPositions(getRandomUniquePositions(positionslower, 5));
  };

  useEffect(() => {
    const rand = getRandomUniquePositions(positionslower, 5);
    setLowerRandomPositions(rand);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const regenerateRandomNotes = () => {
    setRandomPositions(getRandomUniquePositions(positions, 5));
  };
  
  function getRandomUniquePositions(
    posObj: { [key: string]: [number, number] },
    count: number
  ): [string, [number, number]][] {
    const entries = Object.entries(posObj);
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  useEffect(() => {
    const rand = getRandomUniquePositions(positions, 5);
    setRandomPositions(rand);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  


  // Update ref whenever sliderBeat changes
  useEffect(() => {
    sliderBeatRef.current = sliderBeat;
  }, [sliderBeat]);
  
  


  

  function getStaffPositionsFromSemitones(semitoneDistance: number): number {
    return semitoneDistance / 1.85;
  }
  
  function isAccidental(note: number): boolean {
    // C#, D#, F#, G#, A# (black keys on piano)
    const pitch = note % 12;
    return [1, 3, 6, 8, 10].includes(pitch);
  }

  function getAccidentalSymbol(note: number): string {
    const pitch = note % 12;
    
    // C#, D#, F#, G#, A#
    if ([1, 3, 6, 8, 10].includes(pitch)) {
      return "♯";
    }
    return "";
  }
  
  // Render ledger lines for notes that fall outside the staff
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderLedgerLines(x: number, y: number, isTreble: boolean, _note: number): JSX.Element[] {
    const lines: JSX.Element[] = [];
    const staffTop = isTreble ? 20 : 140;
    const staffBottom = staffTop + 4 * 20; // 4 spaces between 5 lines
    
    if (y < staffTop) {
      // Add ledger lines above the staff
      let lineY = staffTop;
      while (lineY >= y) {
        lines.push(
          <line
            key={`ledger-above-${lineY}`}
            x1={x - 10}
            y1={lineY}
            x2={x + 10}
            y2={lineY}
            stroke="black"
            strokeWidth="1"
          />
        );
        lineY -= 20; // Move up one staff line gap
      }
    } else if (y > staffBottom) {
      // Add ledger lines below the staff
      let lineY = staffBottom;
      while (lineY <= y) {
        lines.push(
          <line
            key={`ledger-below-${lineY}`}
            x1={x - 10}
            y1={lineY}
            x2={x + 10}
            y2={lineY}
            stroke="black"
            strokeWidth="1"
          />
        );
        lineY += 20; // Move down one staff line gap
      }
    }
    
    return lines;
  }

  

  const getNoteY = useCallback((
    note: number,
    clef: 'treble' | 'middle' | 'bass',
    systemIndex: number
  ): number => {
    const systemYOffset = systemIndex * 82;
  
    // Base Y per clef
    const baseY = clef === 'treble' ? 20 : clef === 'bass' ? 140 : 80; // middle ledger line ~80
    console.log("baseY",baseY)
    const baseYWithOffset = baseY + systemYOffset;
  
    const middleStaffLine = baseYWithOffset + 2 * STAFF_LINE_GAP;
  
    // Reference note per clef
    if(note>=65&&note<=71){
    const referenceNote =
      clef === 'treble' ? 71 :
      clef === 'bass' ? 50 :
      60; // Middle C
  
    const referenceY = middleStaffLine;
    const semitoneDistance = referenceNote - note;
    const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
  
    return referenceY + staffPositions * ((STAFF_LINE_GAP / 2)-1);}
    else if(note>72){
      const referenceNote =
        clef === 'treble' ? 69 :
        clef === 'bass' ? 50 :
        60; // Middle C
    
      const referenceY = middleStaffLine;
      const semitoneDistance = referenceNote - note;
      const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
    
      return referenceY + staffPositions * ((STAFF_LINE_GAP / 2)-5);}
    else{
      const referenceNote =
      clef === 'treble' ? 71.9 :
      clef === 'bass' ? 50 :
      60; // Middle C
  
    const referenceY = middleStaffLine;
    const semitoneDistance = referenceNote - note;
    const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
    return referenceY + staffPositions * (STAFF_LINE_GAP / 2);
    }
  }, []);
   
  function getClefForNote(note: number): 'treble' | 'middle' | 'bass' {
    if (note >= 60 + 1) return 'treble'; // above Middle C
    if (note <= 60 - 1) return 'bass';   // below Middle C
    return 'middle'; // C4
  }

 
  

  const getMIDIMessage = React.useCallback((midiMessage: WebMidi.MIDIMessageEvent) => {
    
    const [status, note, velocity] = midiMessage.data;
    const statusType = status & 0xF0;
  
    if (statusType === 0x80 || (statusType === 0x90 && velocity === 0)) {
      activeNotes.current.delete(note);
      return;
    }
  
    if (statusType === 0x90 && velocity > 0 && isPlaying) {
      if (!activeNotes.current.has(note)) {
        const currentSliderBeat = sliderBeatRef.current;
        const x_absolute = getSliderXForBeat(currentSliderBeat, timeSignature);
        console.log('x_absolute',x_absolute)
        const systemIndex = currentSliderBeat < timeSignature.top * 4 ? 0 : 1;
        const isTreble = systemIndex === 0;
        const clef = getClefForNote(note);
        const y = getNoteY(note, clef, systemIndex);
        console.log('y',y)
        setKeysPositions((prevPos) => {
          const currentPositions = prevPos[note] || [];
          const newPosition: [number, number,number] = [x_absolute, y,isTreble? 0:1];
    
          const alreadyExists = currentPositions.some(
            (pos) => pos[0] === newPosition[0] && pos[1] === newPosition[1] && pos[2] === newPosition[2]
          );
    
          if (alreadyExists) return prevPos;
    
          return {
            ...prevPos,
            [note]: [...currentPositions, newPosition],
          };
        });
    
        activeNotes.current.set(note, currentSliderBeat);
    
        // Capture with y
        setCapturedNotes((prev) => [
          ...prev,
          {
            beat: currentSliderBeat,
            notes: [note],
            x_position: x_absolute,
            y_position: y, // <-- add this
            systemIndex: isTreble ? 0 : 1, // Add systemIndex
          },
        ]);
      }
    }
    
  }, [getNoteY, isPlaying, timeSignature]);  // Remove sliderBeat from dependencies
  

// Setup MIDI event listener with cleanup
React.useEffect(() => {
    async function setupMIDI() {
        const midiAccess = await navigator.requestMIDIAccess(); // Assuming MIDI access is already obtained
        const inputs = midiAccess.inputs.values();
        for (const input of inputs) {
            const handler = (e: WebMidi.MIDIMessageEvent) => getMIDIMessage(e);
            input.addEventListener('midimessage', handler);
            return () => input.removeEventListener('midimessage', handler);
        }
    }
    setupMIDI();
}, [getMIDIMessage]);
  
  function onMIDIFailure() {
    console.log("Could not access your MIDI devices.");
  }
  useEffect(() => {
    const onMIDISuccess = (midiAccess: WebMidi.MIDIAccess) => {
      // eslint-disable-next-line prefer-const
      for (let input of midiAccess.inputs.values()) {
        input.onmidimessage = getMIDIMessage;
      }
    };
    
    
    if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
    
  }, [getMIDIMessage]);


  const drawStaffLines = (yStart: number) => {
    return new Array(5).fill(0).map((_, i) => (
      <line
        key={i}
        x1={10}
        y1={yStart + i * STAFF_LINE_GAP}
        x2={STAFF_WIDTH +100}
        y2={yStart + i * STAFF_LINE_GAP}
        stroke="black"
        strokeWidth="1"
    />    
    ));
  };



  // const drawSubdivisionLines = (yStart: number) => {
  //   const measureCount = 4;
  //   const totalBeats = timeSignature.top * measureCount;
  //   const beatWidth = (STAFF_WIDTH - CLEF_WIDTH) / totalBeats;
  //   const subWidth = beatWidth / subdivisionsPerBeat;
  
  //   const lines = [];
  
  //   for (let i = 0; i < totalBeats * subdivisionsPerBeat; i++) {
  //     // Skip if it's a main beat line (already drawn)
  //     if (i % subdivisionsPerBeat === 0) continue;
  
  //     const x = CLEF_WIDTH + i * subWidth;
  //     lines.push(
  //       <line
  //         key={`sub-${i}-${yStart}`}
  //         x1={x}
  //         y1={yStart}
  //         x2={x}
  //         y2={yStart + 4 * STAFF_LINE_GAP}
  //         stroke="gray"
  //         strokeWidth="0.5"
  //         strokeDasharray="2,2"
  //       />
  //     );
  //   }
  //   return lines;
  // };

  const NoteRenderer: React.FC<NoteRendererProps> = ({
    capturedNotes,
    timeSignature,
    systemIndex,
  }) => {
    const beatsPerSystem = timeSignature.top * 4;
  
    const notesInThisSystem = capturedNotes.filter(group =>
      systemIndex === 0
        ? group.beat < beatsPerSystem
        : group.beat >= beatsPerSystem
    );
    return (
      <>
        
        {notesInThisSystem.map((group, gi) =>
          group.notes.map((note, ni) => {
            const x = getSliderXForBeat(group.beat, timeSignature);
            const y = group.y_position; // Use precomputed Y
  
            const showAccidental = isAccidental(note);
            const accidentalSymbol = getAccidentalSymbol(note);
  
            return (
              <g key={`${systemIndex}-${gi}-${ni}`} className="note-group">
                {renderLedgerLines(x, y, systemIndex === 0, note)}
                {showAccidental && (
                  <text
                    x={x - 12}
                    y={y + 5}
                    fontSize="16"
                    fill="#64B5F6"
                    className="accidental"
                  >
                    {accidentalSymbol}
                  </text>
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#64B5F6"
                  className="note-head"
                />
              </g>
            );
          })
        )}
      </>
    );
  };
  

  const NoteRenderer2: React.FC<NoteRendererProps> = ({ systemIndex }) => {
    React.useEffect(() => {
      if (!isPlaying && checking) {
        const correct: Note[] = [];
        const incorrect: Note[] = [];
  
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const expectedUpper = randomPositions.map(([_, pos]) => pos);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const expectedLower = lowerrandomPositions.map(([_, pos]) => pos);
        const playedNotes: [number, number,number][] = Object.values(keyspositions).flat();
        console.log("keypostioions",keyspositions)
        console.log("played notes",playedNotes)
        // Upper system (treble)
        const usedUpper: boolean[] = new Array(expectedUpper.length).fill(false);
        playedNotes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, y,z]) => z === 0 )
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .forEach(([x, y,_]) => {
            let matched = -1;
            for (let i = 0; i < expectedUpper.length; i++) {
              if (usedUpper[i]) continue;
              const [ex, ey] = expectedUpper[i];
              if (Math.abs(x - ex) < THRESHOLD && Math.abs(y - ey) < THRESHOLD) {
                matched = i;
                break;
              }
            }
            if (matched !== -1) {
              const [mx, my] = expectedUpper[matched];
              correct.push({ x_pos: mx, y_pos: my, systemIndex: 0 });
              usedUpper[matched] = true;
            } else {
              incorrect.push({ x_pos: x, y_pos: y, systemIndex: 0 });
            }
          });
  
        // Lower system (bass)
        const usedLower: boolean[] = new Array(expectedLower.length).fill(false);
        playedNotes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, y,z]) => z === 1)
          .forEach(([x, y]) => {
            let matched = -1;
            for (let i = 0; i < expectedLower.length; i++) {
              if (usedLower[i]) continue;
              const [lx, ly] = expectedLower[i];
              if (Math.abs(x - lx) < THRESHOLD && Math.abs(y - ly) < THRESHOLD) {
                matched = i;
                break;
              }
            }
            if (matched !== -1) {
              const [mx, my] = expectedLower[matched];
              correct.push({ x_pos: mx, y_pos: my, systemIndex: 1 });
              usedLower[matched] = true;
            } else {
              incorrect.push({ x_pos: x, y_pos: y, systemIndex: 1 });
            }
          });
  
        setCorrectNotes(correct);
        setInCorrectNotes(incorrect);
        setChecking(false);
      }
    }, []);
  
    return (
      <>
        {correctNotes
          .filter((note) => note.systemIndex === systemIndex)
          .map((note, idx) => (
            <g key={`correct-${idx}`} className="note-group">
              <circle cx={note.x_pos} cy={note.y_pos} r={6} fill="green" />
            </g>
          ))}
        {IncorrectNotes
          .filter((note) => note.systemIndex === systemIndex)
          .map((note, idx) => (
            <g key={`incorrect-${idx}`} className="note-group">
              <circle cx={note.x_pos} cy={note.y_pos} r={4} fill="red" />
            </g>
          ))}
      </>
    );
  };
  

  

  function getSliderXForBeat(beat: number, timeSignature: { top: number }): number {
       // two systems of `beatsPerSystem` each
       const beatsPerSystem = timeSignature.top * 4;
       // where in its own system this beat falls
       const beatInSystem   = beat % beatsPerSystem;
       const beatWidth      = (STAFF_WIDTH - CLEF_WIDTH) / beatsPerSystem;
       return CLEF_WIDTH + 15 + beatInSystem * beatWidth + beatWidth / 2;
  }

  function drawSlider(systemIndex: 0 | 1): JSX.Element | null {
    const totalBeats = beatsPerSystem * 2;
    if (sliderBeat < 0 || sliderBeat >= totalBeats) return null;
  
    // are we drawing for the upper or lower system?
    const isUpper = (systemIndex === 0);
    const inUpper = sliderBeat < beatsPerSystem;
    if (isUpper !== inUpper) return null;  // only draw in the right system
  
    // compute beat‑within‑this‑system
    const beatInSystem = inUpper
      ? sliderBeat
      : sliderBeat - beatsPerSystem;
  
    const beatWidth = (STAFF_WIDTH - CLEF_WIDTH) / beatsPerSystem;
    const x = CLEF_WIDTH + 15 + beatInSystem * beatWidth + beatWidth / 2;
  
    // y‑ranges for each svg:
    if(isUpper){
    const y1 =  20 ;
    const y2 =  200 + 4 * STAFF_LINE_GAP + STAFF_LINE_GAP;
    return (
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke="red"
        strokeWidth="2"
      />
    );
    }
    else{
      const y1 =  100 ;
      const y2 =  280 + 4 * STAFF_LINE_GAP + STAFF_LINE_GAP;
      return (
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="red"
          strokeWidth="2"
        />
      );
    }
    
  }

  useEffect(() => {
    if (!isPlaying) {
      setCapturedNotes([]); // Clear previous notes
      setSliderBeat(0);
      stopMetronome()     // Start from beginning
    }
  }, [isPlaying]);



  useEffect(() => {
    if (!isMetronomeRunning) {
      return
    };
    if(isPlaying || isCountingIn){
      return()=> {
      clearInterval(timerID.current as NodeJS.Timeout);
      timerID.current = setInterval(scheduler, 25);
    }
    }
    return () => clearInterval(timerID.current as NodeJS.Timeout);
  }, [isCountingIn, isMetronomeRunning, isPlaying, scheduler]);


  useEffect(() => {
    const totalBeats     = beatsPerSystem * 2;  // two systems: upper + lower

  if (isPlaying) {
    intervalRef.current = setInterval(() => {
      setSliderBeat((prev) => {
        const next = prev + 1;
        if (next >= totalBeats) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          setChecking(true);
          return prev;
        }
        return next;
      });
    }, (60 / bpm) * 1000);
  } else {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  return () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
}, [isPlaying, bpm, timeSignature, beatsPerSystem]);
 

  function drawMeasureLines(yStart: number): JSX.Element[] {
    const measureCount = 4;
    const totalBeats = timeSignature.top * measureCount;
    const beatWidth = (STAFF_WIDTH + 29 - CLEF_WIDTH) / totalBeats;
  
    return new Array(measureCount + 1).fill(0).map((_, i) => {
      const x = CLEF_WIDTH - 30 + i * timeSignature.top * beatWidth;
      return (
        <line
          key={`measure-${i}-${yStart}`}
          x1={x}
          y1={yStart}
          x2={x}
          y2={300}
          stroke="black"
          strokeWidth="1"
        />
      );
    });
  }

  function drawMeasureLines2(yStart: number): JSX.Element[] {
    const measureCount = 4;
    const totalBeats = timeSignature.top * measureCount;
    const beatWidth = (STAFF_WIDTH + 29 - CLEF_WIDTH) / totalBeats;
  
    return new Array(measureCount + 1).fill(0).map((_, i) => {
      const x = CLEF_WIDTH -30 + i * timeSignature.top * beatWidth;
      return (
        <line
          key={`measure-${i}-${yStart}`}
          x1={x}
          y1={yStart}
          x2={x}
          y2={380}
          stroke="black"
          strokeWidth="1"
        />
      );
    });
  }

  return (
    //start of the main component
    <div className="flex flex-col items-center">
      <StatusbarMusicSheet isPlaying={isPlaying}/>
      <div className="flex items-center justify-center w-full h-full inset-0 bg-[#F8F6F1]"> 
      <div className="flex flex-col items-center justify-center pb-32">
        
      <div className="w-[1700px] border-4 border-white my-10 bg-white p-12 flex flex-col items-center">
        <div className={`flex flex-col items-center gap-2 ${isPlaying ? '' : 'hidden'}`}>
          <div className="flex items-center gap-2">
            <label className="text-lg text-[#0A0A0B]">Time Signature:</label>
            <input
              type="number"
              min="1"
              max="12"
              value={timeSignature.top}
              onChange={(e) =>
                setTimeSignature((prev) => ({ ...prev, top: parseInt(e.target.value) }))
              }
              className="w-12 border-2 border-primary-dark px-1 text-[#0A0A0B]"
            />
            <span className="text-lg text-primary-dark">/</span>
            <input
              type="number"
              min="1"
              max="16"
              value={timeSignature.bottom}
              onChange={(e) =>
                setTimeSignature((prev) => ({ ...prev, bottom: parseInt(e.target.value) }))
              }
              className="w-12 border-2 px-1 text-[#0A0A0B] border-primary-dark"
            />
          </div>
          <div className="space-x-10">
            <button onClick={() => { regenerateRandomNotes(); regenerateRandomLowerNotes(); }} className="px-2 py-1 bg-green-500 text-white rounded">
              Shuffle Notes
            </button>
          </div>
        </div>
      
      <svg width={STAFF_WIDTH} height={350}>
        {drawStaffLines(20)}
        {drawStaffLines(220)}
        {/* {drawSubdivisionLines(20)}
        {drawSubdivisionLines(140)} */}
        

        <text x={5} y={32 + 3 * STAFF_LINE_GAP} fontSize="90" stroke="black" className="">𝄞</text>
        <text x={5} y={225 + 3 * STAFF_LINE_GAP} fontSize="80" stroke="black">𝄢</text>

        {drawMeasureLines(20)}
        {/* {drawMeasureLines(220)} */}
        {randomPositions.map(([note, [x, y]]) => (
      <path
        key={note}
        d="M1140 2415 l0 -1225 -49 35 c-187 135 -441 152 -658 45 -269 -133
            -379 -445 -245 -694 37 -69 133 -169 201 -210 31 -19 92 -47 136 -62 70 -24
            95 -28 200 -28 108 0 129 3 205 30 198 69 341 222 379 402 8 37 11 480 11
            1492 l0 1440 -90 0 -90 0 0 -1225z"
        transform={`translate(${x - 10}, ${y - 10}) scale(0.01)`}
        fill="black"
      />
    ))}
        <text x={CLEF_WIDTH + 35} y={20 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text x={CLEF_WIDTH + 35 } y={20 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

        <text x={CLEF_WIDTH + 35 } y={220 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text x={CLEF_WIDTH + 35 } y={220 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

      {drawSlider(0)}
      
        
        
      <NoteRenderer
    capturedNotes={capturedNotes}
    timeSignature={timeSignature}
    isPlaying={isPlaying}
    systemIndex={0}
  />      <NoteRenderer2 capturedNotes={[]} timeSignature={{
          top: 0,
          bottom: 0
        }} isPlaying={isPlaying} systemIndex={0}/>
      </svg>

      <svg width={STAFF_WIDTH} height={450}>
        {drawStaffLines(100)}
        {drawStaffLines(300)}
        {/* {drawSubdivisionLines(100)}
        {drawSubdivisionLines(220)} */}
        
        {lowerrandomPositions.map(([note, [x, y]]) => (
      <path
        key={note}
        d="M1140 2415 l0 -1225 -49 35 c-187 135 -441 152 -658 45 -269 -133
            -379 -445 -245 -694 37 -69 133 -169 201 -210 31 -19 92 -47 136 -62 70 -24
            95 -28 200 -28 108 0 129 3 205 30 198 69 341 222 379 402 8 37 11 480 11
            1492 l0 1440 -90 0 -90 0 0 -1225z"
        transform={`translate(${x - 10}, ${y - 10}) scale(0.01)`}
        fill="black"
      />
    ))}
        <text x={5} y={110 + 3 * STAFF_LINE_GAP} fontSize="90" stroke="black">𝄞</text>
        <text x={5} y={305 + 3 * STAFF_LINE_GAP} fontSize="80" stroke="black">𝄢</text>

        {drawMeasureLines2(100)}
        {/* {drawMeasureLines(220)} */}

        <text x={CLEF_WIDTH + 35} y={100 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text  x={CLEF_WIDTH + 35} y={100 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

        <text x={CLEF_WIDTH + 35} y={300 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text x={CLEF_WIDTH + 35} y={300 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

        {drawSlider(1)}

        
        <NoteRenderer
          capturedNotes={capturedNotes}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          systemIndex={1}
        />      
        <NoteRenderer2
          capturedNotes={[]}
          timeSignature={{ top: 0, bottom: 0 }}
          isPlaying={isPlaying}
          systemIndex={1}
        />
    </svg>
    <div className="flex justify-between items-center mt-4">
      
      </div>
    </div>
            
    </div>
    </div>
    
    <FooterMusicsheet nextNoteTimeRef={nextNoteTimeRef} scheduleAheadTime={scheduleAheadTime} playClick={playClick} audioContextRef={audioContextRef} currentBeatRef={currentBeatRef} setSliderBeat={setSliderBeat} setIsPlaying={setIsPlaying} scheduler={scheduler} timerID={timerID} isCountingIn={isCountingIn} isMetronomeRunning={isMetronomeRunning} isPlaying={isPlaying} initializeAudioContext={initializeAudioContext} bpm={bpm} setBpm={setBpm} setIsCountingIn={setIsCountingIn} setIsMetronomeRunning={setIsMetronomeRunning}/>
    
  </div>
  );
}


