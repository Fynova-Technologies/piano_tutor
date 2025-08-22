"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import StatusbarMusicSheet from "@/components/musicSheet/StatusbarMusicSheet";
import FooterMusicsheet from "@/components/musicSheet/FooterMusicsheet";
import { useSearchParams } from 'next/navigation';
import { Suspense } from "react";
import { useMediaQuery } from "@/components/MediaQuery/useMediaQueryHook";
import ConnectMidiDevice from "@/hooks/connectMidiDevice";
import GetNoteYposition from "@/hooks/yPositionCalculations";
import CaptureChordGroup from "@/hooks/capturedChordGroup";
import OnPlayClick from "@/hooks/onPlayClick";
import Scheduler from "@/hooks/scheduler";
import { loadCountInSound } from '@/utils/loadCountInSound';
import NoteRenderer from "@/components/musicSheet/noteRenderer";
import CheckNotesRender from "@/components/musicSheet/notesCheckingforender";
import { drawSlider } from "@/utils/drawSlider";
import renderLedgerLines from "@/utils/renderLedgerLines";
import drawMeasureLinesLower from "@/utils/drawMeasurelinesLower";
import getSliderXForBeat from "@/hooks/xpositionCalculation";
import drawStaffLines from "@/utils/drawStaffLines";
import drawSvg from "@/utils/drawSvgUpper";


const STAFF_LINE_GAP = 20; // px 
const STAFF_WIDTH = 1620;
const CLEF_WIDTH = 40;
const THRESHOLD = 1;

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};

type correctNotes={
  systemIndex: number;
  x_pos : number,
  y_pos : number
}

type PatternItem = {
  whole?: [number, number];
  rest?: [number, number];
  imageSrc: string;
};

type PatternData = {
  [key: string]: {
    upper: PatternItem[];
    lower: PatternItem[];
  };
};

type UnitLesson = {
  id: string, lessontitle: string, link: string, pattern: string, patternkey: string 
};

export default function MusicSheetClient() {
  const [timeSignature] = useState({ top: 4, bottom: 4 });
  const [sliderBeat, setSliderBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [capturedNotes, setCapturedNotes] = useState<CapturedNoteGroup[]>([]);
  const [correctNotes,setCorrectNotes] = useState<correctNotes[]>([]);
  const [IncorrectNotes,setInCorrectNotes] = useState<correctNotes[]>([]);
  const activeNotes = React.useRef<Map<number, number>>(new Map()); // Track active notes and their sliderBeat
  const sliderBeatRef = useRef(sliderBeat);
  const [keyspositions, setKeysPositions] = useState<{ [key: string]: [number, number,number][] }>({});
  const [checking, setChecking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundSoundRef = useRef<HTMLAudioElement | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerID = useRef<NodeJS.Timeout | null>(null);
  const scheduleAheadTime = 0.2; // Schedule 100ms ahead
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const currentBeatRef = useRef(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const countInBuffers = React.useRef<(AudioBuffer | null)[]>([null, null, null, null]);
  const searchParams = useSearchParams();
  const pattern = searchParams?.get('pattern')||""
  const patternkey = searchParams?.get('patternkey')||""
  const coursetitle = searchParams?.get('title')||""
  const [wholeNotes, setWholeNotes] = useState<PatternItem[]>([]);
  const [restNotes, setRestNotes] = useState<PatternItem[]>([]);
  const [lowerwholeNotes, setLowerWholeNotes] = useState<PatternItem[]>([]);  
  const [lowerrestNotes, setLowerRestNotes] = useState<PatternItem[]>([]);
  const [UpperStaffpositions, setUpperStaffpositions]= useState<PatternItem[]>([]);
  const [LowerStaffpositions, setLowerStaffpositions]= useState<PatternItem[]>([]);
  const [playCount, setPlayCount] = useState(0);
  const [totalNotes, setTotalNotes] = useState<[number, number][]>([]);
  const [courseTitle,setCourseTitle] = useState("")
  const [unitLessonsData, setUnitLessonsData] = useState<UnitLesson[]>([]);
  const Id = searchParams?.get('id')||""
  const [id]=useState(Id)
  const upperClefRef = useRef<HTMLDivElement>(null);
  const lowerClefRef = useRef<HTMLDivElement>(null);
  const prevBeatRef = useRef<number>(-1);
  const mobileWidth = useMediaQuery('(max-width: 768px)')


  useEffect(() => {
      fetch("/unitLessonsData.json")
        .then((res) => res.json())
        .then((data) => {
          const unit = data.Lessons.find((u: { fkid: unknown; }) => u.fkid === id)
          setUnitLessonsData (unit.unitlessons)
        });
    }, [id, searchParams]);

  useEffect(() => {
  fetch(pattern)
    .then((res) => res.json())
    .then((data: PatternData) => {
      const upperPattern = data[patternkey].upper;
      const lowerPattern = data[patternkey].lower;

      const whole: PatternItem[] = [];
      const rest: PatternItem[] = [];
      const lowerwhole: PatternItem[] = [];
      const lowerrest: PatternItem[] = [];

      upperPattern.forEach((item) => {
        if (item.whole) whole.push(item);
        if (item.rest) rest.push(item);
      });

      lowerPattern.forEach((item) => {
        if (item.whole) lowerwhole.push(item);
        if (item.rest) lowerrest.push(item);
      });

      const totalNotePositions = [
        ...whole,
        ...lowerwhole
      ]
        .map(item => item.whole) // extract [x, y]
        .filter((pos): pos is [number, number] => !!pos); // filter out undefined

      setWholeNotes(whole);
      setRestNotes(rest);
      setLowerWholeNotes(lowerwhole);
      setLowerRestNotes(lowerrest);
      setUpperStaffpositions(upperPattern);
      setLowerStaffpositions(lowerPattern);
      setTotalNotes(totalNotePositions);
      setCourseTitle(coursetitle)
    })
    .catch((err) => console.error("Error loading patterns:", err));

}, [pattern, patternkey,coursetitle]);

 
  useEffect(() => {
      async function loadBuffers() {
        if (!audioContextRef.current) return;
        await loadCountInSound(audioContextRef.current, countInBuffers);
      }
      loadBuffers();
    }, []);

  const initializeAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.AudioContext)();
    }
  
    // Only load if any buffer is null
    if (countInBuffers.current.some(buffer => !buffer)) {
      await loadCountInSound(audioContextRef.current, countInBuffers);
    }
  };
     
  const scheduleNote = (beatNumber: number, time: number | undefined) => {
    playClick(time, beatNumber % 4 === 0); // Downbeat every 4 beats
  };
  
  
  const stopMetronome = () => {
    clearInterval(timerID.current as NodeJS.Timeout | undefined);
    timerID.current = null;
  };
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const beatsPerSystem = timeSignature.top * 4; // number of beats in each system
  
  useEffect(() => {
    const prev = prevBeatRef.current;
    const movedToLower = prev < beatsPerSystem && sliderBeat >= beatsPerSystem;
    const movedToUpper = prev >= beatsPerSystem && sliderBeat < beatsPerSystem;

    if (movedToLower && lowerClefRef.current) {
      lowerClefRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (movedToUpper && upperClefRef.current) {
      upperClefRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    prevBeatRef.current = sliderBeat;
  }, [beatsPerSystem, sliderBeat]);

  // Update ref whenever sliderBeat changes
  useEffect(() => {
    sliderBeatRef.current = sliderBeat;
  }, [sliderBeat]);
  
  function getStaffPositionsFromSemitones(semitoneDistance: number): number {
    return  semitoneDistance / 1.95;
  }  
   
  function getClefForNote(note: number): 'treble' | 'middle' | 'bass' {
    if (note >= 60 + 1) return 'treble'; // above Middle C
    if (note <= 60 - 1) return 'bass';   // below Middle C
    return 'middle'; // C4
  }
  const [metronomeVolume,setMetronomeVolume]=useState(100)
  const playClick = OnPlayClick({audioContextRef,countInBuffers,metronomeVolume});
  const getNoteY = GetNoteYposition({STAFF_LINE_GAP, getStaffPositionsFromSemitones });
  const getSliderXForBeatSimple = (beat: number, timeSignature: { top: number }) => getSliderXForBeat(beat, timeSignature, STAFF_WIDTH, CLEF_WIDTH);
  
  const captureChordGroup = CaptureChordGroup({ sliderBeatRef, getNoteY, activeNotes, setCapturedNotes,setKeysPositions,
    getSliderXForBeat: getSliderXForBeatSimple, timeSignature, getClefForNote  });
  
    const {getMIDIMessage} = ConnectMidiDevice({ isPlaying, captureChordGroup });
  const scheduler = Scheduler({audioContextRef,bpm,nextNoteTimeRef,scheduleAheadTime,currentBeatRef,scheduleNote,setSliderBeat})

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
 
  useEffect(() => {
    if (!isPlaying) {
      setCapturedNotes([]);
      setSliderBeat(0);
      stopMetronome()     
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
 

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="flex flex-col items-center">
      <StatusbarMusicSheet courseTitle={courseTitle} isPlaying={isPlaying} IncorrectNotes={IncorrectNotes} totalNotes={totalNotes} correctNotes={correctNotes}  playCount={playCount}/>
      <div className="flex items-center justify-center w-full md:w-full h-full inset-0 bg-[#F8F6F1]"> 
      <div className="flex flex-col items-center justify-center pb-32 w-full">
        
      <div className={`${mobileWidth?"w-[90%]":"w-[90%]"} border-4 my-10  border-white  bg-white p-12 flex flex-col items-center`} >
      <div ref={upperClefRef}>
      {drawSvg({
        STAFF_WIDTH, CLEF_WIDTH, STAFF_LINE_GAP, beatsPerSystem, timeSignature, wholeNotes,
          restNotes, sliderBeat, isPlaying, capturedNotes, checking, UpperStaffpositions,
          LowerStaffpositions, keyspositions, THRESHOLD, setCorrectNotes, setInCorrectNotes,
          setChecking, correctNotes, IncorrectNotes, getSliderXForBeat: (beat: number) => getSliderXForBeatSimple(beat, timeSignature),
          height:400, staffX1: 20, staffX2: 220,
      })}
    </div>
      <div ref={lowerClefRef}>
      <svg width="100%"   viewBox={`0 0 ${STAFF_WIDTH} 350`} height={420}  preserveAspectRatio="xMidYMid meet">

        {drawStaffLines(100,STAFF_WIDTH, STAFF_LINE_GAP)}
        {drawStaffLines(300,STAFF_WIDTH, STAFF_LINE_GAP)}

         {lowerwholeNotes.map((item, idx) => {
        const [x, y] = item.whole!;
        return (
          <image
            key={`whole-${idx}`}
            href={item.imageSrc}
            transform={`translate(${x-18}, ${y-26}) scale(0.6)`}
            width={60}
            height={60}
            className="transition duration-500 ease-in-out"
          />
        );
      })}

          {lowerrestNotes.map((item, idx) => {
        const [x, y] = item.rest!;
        return (
          <image
            key={`rest-${idx}`}
            href={item.imageSrc}
            transform={`translate(${x}, ${y}) scale(0.5)`}
            width={30}
            height={30}
            className="transition duration-300 ease-in"
          />
        );
      })}
        
        <text x={5} y={110 + 3 * STAFF_LINE_GAP} fontSize="90" stroke="black">𝄞</text>
        <text x={5} y={305 + 3 * STAFF_LINE_GAP} fontSize="80" stroke="black">𝄢</text>

        {drawMeasureLinesLower(100,timeSignature,STAFF_WIDTH, CLEF_WIDTH)}

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

        {drawSlider(1, beatsPerSystem, sliderBeat, STAFF_WIDTH, CLEF_WIDTH, STAFF_LINE_GAP)}
       
        <NoteRenderer
          capturedNotes={capturedNotes}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          systemIndex={1}
          getSliderXForBeat={getSliderXForBeatSimple}
          renderLedgerLines={renderLedgerLines}
        />      
        
        <CheckNotesRender capturedNotes={[]} timeSignature={{top: 0,bottom: 0}} isPlaying={isPlaying} systemIndex={1} 
    checking={checking}  UpperStaffpositions={UpperStaffpositions} LowerStaffpositions={LowerStaffpositions} 
    keyspositions={keyspositions} THRESHOLD={ THRESHOLD} setCorrectNotes={setCorrectNotes} setInCorrectNotes={setInCorrectNotes}
    setChecking={setChecking}correctNotes={correctNotes}IncorrectNotes={IncorrectNotes} 
  />
    </svg>
    </div>
    </div>          
    </div>
    </div>  
    <FooterMusicsheet  id={id}  unitLessonsData={unitLessonsData} nextNoteTimeRef={nextNoteTimeRef} scheduleAheadTime={scheduleAheadTime} 
      playClick={playClick} audioContextRef={audioContextRef} currentBeatRef={currentBeatRef} setSliderBeat={setSliderBeat} setIsPlaying={setIsPlaying} 
      scheduler={scheduler} timerID={timerID} isCountingIn={isCountingIn} isMetronomeRunning={isMetronomeRunning} isPlaying={isPlaying} initializeAudioContext={initializeAudioContext} 
      bpm={bpm} setBpm={setBpm} setIsCountingIn={setIsCountingIn} setIsMetronomeRunning={setIsMetronomeRunning}  setCapturedNotes={setCapturedNotes} setPlayCount={setPlayCount} backgroundSoundRef={backgroundSoundRef} metronomeVolume={metronomeVolume} setMetronomeVolume={setMetronomeVolume}/>
  </div>
  </Suspense>
  );
}