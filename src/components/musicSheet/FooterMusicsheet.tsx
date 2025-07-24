import Image from "next/image";
import { useEffect } from "react";
import FooterPlayButton from "./footerPlaybutton";


type FooterMusicsheetProps = {
  nextNoteTimeRef: React.MutableRefObject<number>;
  scheduleAheadTime: number;
  playClick: (time: number, isAccent: boolean, index: number) => void;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  currentBeatRef: React.MutableRefObject<number>;
  setSliderBeat: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  scheduler: () => void;
  timerID: React.MutableRefObject<NodeJS.Timeout | null>;
  isCountingIn: boolean;
  isMetronomeRunning: boolean;
  isPlaying: boolean;
  setBpm: (bpm: number | ((prev: number) => number)) => void;
  bpm: number;
  setIsCountingIn: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMetronomeRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setCapturedNotes: React.Dispatch<React.SetStateAction<CapturedNoteGroup[]>>;
  setPlayCount: React.Dispatch<React.SetStateAction<number>>;
  unitLessonsData: UnitLesson[],
  id:string,
  playBackgroundMusic: () => void;
  initializeAudioContext: () => Promise<void>;
};

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};


type UnitLesson = {

     id: string, lessontitle: string, link: string, pattern: string, patternkey: string 

};

export default function FooterMusicsheet({
  nextNoteTimeRef,
  scheduleAheadTime,
  playClick,
  audioContextRef,
  currentBeatRef,
  setSliderBeat,
  setIsPlaying,
  scheduler,
  timerID,
  isCountingIn,
  isMetronomeRunning,
  isPlaying,
  setBpm,
  bpm,
  setIsCountingIn,
  setIsMetronomeRunning,
  initializeAudioContext,
  setCapturedNotes,
  setPlayCount,
  unitLessonsData,
  id,
  playBackgroundMusic
  
}: FooterMusicsheetProps) {
    
    
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
      }, [isCountingIn, isMetronomeRunning, isPlaying, scheduler, timerID]);
    
    return(
    <div className={` flex fixed bottom-0 items-end justify-end bg-[#0a0a0a] w-full gap-2 p-4 ${isPlaying ? 'hidden' : ' '}`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex ml-8 items-center gap-4 w-full ">
          <button
            className="px-2 py-1 text-5xl text-[#FEFEFE] cursor-pointer"
            onClick={() => setBpm((prev) => Math.max(30, prev - 1))}
          > - </button>
          <div className="flex flex-col items-center gap-2">
            <div className="border-2 w-[67px] h-[56px] border-gray-300 bg-white text-[#0A0A0B] rounded-[4px] py-[6px] px-[8px] flex flex-col items-center">
              <span className="font-medium text-[14px]">{bpm}</span>
              <label className="font-medium text-[14px]">BPM:</label>
            </div>
            {/* <input
              type="range"
              min="30"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-40"
            /> */}
          </div>

          <button
            className="px-2 py-1 text-5xl text-[#FEFEFE] cursor-pointer"
            onClick={() => setBpm((prev) => Math.min(200, prev + 1))}
          >
            +
          </button>
        </div>
      
      <FooterPlayButton id={id} playBackgroundMusic={playBackgroundMusic} unitLessonsData={unitLessonsData} bpm={bpm} timerID={timerID}   setPlayCount={setPlayCount}   scheduler={scheduler}   audioContextRef={audioContextRef}  currentBeatRef={currentBeatRef} scheduleAheadTime={scheduleAheadTime}   nextNoteTimeRef={ nextNoteTimeRef} isCountingIn={isCountingIn} isPlaying={isPlaying} setIsPlaying={setIsPlaying} initializeAudioContext={initializeAudioContext} setIsCountingIn={setIsCountingIn} setSliderBeat={setSliderBeat} playClick={playClick} setIsMetronomeRunning={setIsMetronomeRunning} setCapturedNotes={setCapturedNotes} />
      
      <div className="Settings flex gap-4 mr-8 w-full items-end justify-end">
        <button className="bg-[#D4AF37] py-[6px] w-[101px] h-[48px] px-[16px] rounded-2xl flex gap-2 primary-color-text items-center text-[16px]"><Image src="/icon.svg" width={15} height={10} alt="icon"/>Learn</button>
        <Image src="/settings.svg" width={50} height={40} alt="icon"/>

      </div>
    </div>
    </div>
    )
}