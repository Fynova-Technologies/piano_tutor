import Image from "next/image";
import { useEffect, useState } from "react";
import FooterPlayButton from "./footerPlaybutton";
import OptionPopup from "../optionPopup";

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
  unitLessonsData: UnitLesson[];
  id: string;
  initializeAudioContext: () => Promise<void>;
  backgroundSoundRef: React.MutableRefObject<HTMLAudioElement | null>;
};

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number;
};

type UnitLesson = {
  id: string;
  lessontitle: string;
  link: string;
  pattern: string;
  patternkey: string;
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
  backgroundSoundRef,
}: FooterMusicsheetProps) {
  useEffect(() => {
    if (!isMetronomeRunning) {
      return;
    }
    if (isPlaying || isCountingIn) {
      return () => {
        clearInterval(timerID.current as NodeJS.Timeout);
        timerID.current = setInterval(scheduler, 25);
      };
    }
    return () => clearInterval(timerID.current as NodeJS.Timeout);
  }, [isCountingIn, isMetronomeRunning, isPlaying, scheduler, timerID]);

  const [openDialogue, setOpenDialogue] = useState(false);

  return (
    <div
  className={`flex fixed bottom-0 items-end justify-end bg-[#0a0a0a] w-full gap-2 p-2 md:p-4 ${isPlaying ? "hidden" : ""}`}
>
  <div className="flex flex-wrap items-center justify-between w-full gap-2">
    <div className="flex flex-wrap ml-2 md:ml-8 items-center gap-2 md:gap-4 w-full md:w-auto">
      <div>
        {openDialogue && (
          <OptionPopup openDialogue={openDialogue} setOpenDialogue={setOpenDialogue} />
        )}
      </div>
      <button
        className="px-2 py-1 text-3xl md:text-5xl text-[#FEFEFE] cursor-pointer"
        onClick={() => setBpm((prev) => Math.max(30, prev - 1))}
      >
        {" "}
        -{" "}
      </button>
      <div className="flex flex-col items-center gap-2">
        <div className="border-2 w-[50px] h-[44px] md:w-[67px] md:h-[56px] border-gray-300 bg-white text-[#0A0A0B] rounded-[4px] py-[4px] px-[6px] md:py-[6px] md:px-[8px] flex flex-col items-center">
          <span className="font-medium text-[12px] md:text-[14px]">{bpm}</span>
          <label className="font-medium text-[12px] md:text-[14px]">BPM:</label>
        </div>
      </div>
      <button
        className="px-2 py-1 text-3xl md:text-5xl text-[#FEFEFE] cursor-pointer"
        onClick={() => setBpm((prev) => Math.min(200, prev + 1))}
      >
        +
      </button>
    </div>

    <FooterPlayButton
      id={id}
      backgroundSoundRef={backgroundSoundRef}
      unitLessonsData={unitLessonsData}
      bpm={bpm}
      timerID={timerID}
      setPlayCount={setPlayCount}
      scheduler={scheduler}
      audioContextRef={audioContextRef}
      currentBeatRef={currentBeatRef}
      scheduleAheadTime={scheduleAheadTime}
      nextNoteTimeRef={nextNoteTimeRef}
      isCountingIn={isCountingIn}
      isPlaying={isPlaying}
      setIsPlaying={setIsPlaying}
      initializeAudioContext={initializeAudioContext}
      setIsCountingIn={setIsCountingIn}
      setSliderBeat={setSliderBeat}
      playClick={playClick}
      setIsMetronomeRunning={setIsMetronomeRunning}
      setCapturedNotes={setCapturedNotes}
    />

    <div className="Settings flex gap-2 md:gap-4 mr-2 md:mr-8 items-end justify-end">
      <button className="bg-[#D4AF37] py-[4px] md:py-[6px] w-[80px] md:w-[101px] h-[40px] md:h-[48px] px-[10px] md:px-[16px] rounded-2xl flex gap-2 primary-color-text items-center text-[13px] md:text-[16px]">
        <Image src="/icon.svg" width={15} height={10} alt="icon" />
        Learn
      </button>
      <Image
        src="/settings.svg"
        width={50}
        height={40}
        alt="icon"
        className="w-[36px] h-[30px] md:w-[50px] md:h-[40px]"
        onClick={() => setOpenDialogue(!openDialogue)}
      />
    </div>
  </div>
</div>
  );
}
