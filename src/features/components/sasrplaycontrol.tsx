/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useEffect, useState } from "react";
import playCursor from "../playback/playcursor";
import pauseCursor from "../playback/pausecursor";
import clearHighlight from "../notes/clearhighlight";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import OptionPopup from "@/components/optionPopup";
import { usePlaybackAudioSync } from "@/hooks/audio/usePlaybackAudioSync";
import StrikeIndicator from "./strike";


const MAX_MISTAKES = 3;

type CursorControlsProps = {
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    osmdRef: React.MutableRefObject<OpenSheetMusicDisplay>;
    playModeRef: React.MutableRefObject<boolean>;
    totalStepsRef: React.MutableRefObject<number>;
    correctStepsRef: React.MutableRefObject<number>;
    scoredStepsRef: React.MutableRefObject<Set<number>>;
    currentCursorStepRef: React.MutableRefObject<number>;
    currentStepNotesRef: React.MutableRefObject<number[]>;
    setPlayIndex: (index: number) => void;
    playIndex: number;
    totalSteps: number;
    midiOutputs: MIDIOutput[];
    midiInRef: React.RefObject<MIDIInput | null>;
    playbackMidiGuard: React.MutableRefObject<number>;
    setCountdown: (countdown: number | null) => void;
    setHighScore: React.Dispatch<React.SetStateAction<number | null>>;
    setLastScore:  React.Dispatch<React.SetStateAction<number | null>>;
    score: number;
    highScore: number;
    lastScore: number | null,
    setCurrentStepNotes: (notes: number[]) => void,
    setScore: (score: number | null) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onProgressClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, osmdRef: React.MutableRefObject<any>, setPlayIndex: (n: number) => void) => void,
    containerRef: React.RefObject<HTMLDivElement | null>,
    countdown: number | null,
    progressPercent: number,
    courseTitle: string,
    mistakeCount: number,
    maxMistakes?: number  // Made optional with default
}
type UnitLesson = {
  id: string, lessontitle: string, link: string, file: string 
};



export default function SasrPlayControls (props: CursorControlsProps) {
        const searchParams = useSearchParams();
        const router = useRouter();
        const [openDialogue, setOpenDialogue] = useState(false);

        const {
            isPlaying,
            setIsPlaying,
            osmdRef,
            playModeRef,
            totalStepsRef,
            correctStepsRef,
            scoredStepsRef,
            currentCursorStepRef,
            currentStepNotesRef,
            setPlayIndex,
            playIndex,
            totalSteps,
            midiOutputs,
            midiInRef,
            playbackMidiGuard,
            setCountdown,
            setHighScore,
            setLastScore,
            // score,
            highScore,
            lastScore,
            setCurrentStepNotes,
            setScore,
            onProgressClick,
            containerRef,
            countdown,
            progressPercent,
            courseTitle,
            mistakeCount,
            maxMistakes = MAX_MISTAKES  // Use default if not provided
        } =  props;

        usePlaybackAudioSync({
          isPlaying,
          isCountingIn: countdown !== null,
        });

        const [unitlessonsData, setUnitLessonsData] = useState<UnitLesson[]>([]);
        const unitId = searchParams.get("id");      
        const fileParam = searchParams.get("file");
        const lessonId = unitlessonsData.find(
          lesson => lesson.file === fileParam
        )?.id || searchParams.get("lessonId"); 
        const currentIndex = unitlessonsData.findIndex(
          lesson => lesson.id === lessonId
        );
        const hasPrevious = currentIndex > 0;
        const hasNext = currentIndex !== -1 && currentIndex < unitlessonsData.length - 1;

        const goToLesson = (lesson: UnitLesson) => {
  const params = new URLSearchParams({
    id: unitId ?? "", // Changed from unitId to id to match your searchParams.get("id")
    lessonId: lesson.id,
    title: lesson.lessontitle,
    file: lesson.file ?? ""
  });

  router.push(`/lessons?${params.toString()}`);
};

            useEffect(() => {
              fetch("/unitLessonsData2.json")
                .then(res => res.json())
                .then(data => {
                  const unit = data.Lessons.find(
                    (u: { fkid: string }) => u.fkid === unitId
                  );
                
                  if (unit) {
                    setUnitLessonsData(unit.unitlessons);
                  }
                });
              }, [unitId]);
    return(
        <>
          {/* ========== Original Controls ========== 
          <div className="text-sm text-white mb-4">
            <strong>Keyboard Controls:</strong> Space = Play/Pause | Piano keys: A W S E D F T G Y H U J K (C to C, white & black keys)
          </div>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: 12, color: "#fff" }}>Progress: {playIndex} / {totalSteps}</div>
            </div>

            <div style={{ marginLeft: "auto", fontSize: 13 }}>
              MIDI In: {midiInRef.current?.name || "none"} | Out: {midiOutputs.length > 0 ? midiOutputs[0].name : "none"}
            </div>
          </div> 
          */}

         {/* <div className="progress-bar" onClick={e => onProgressClick(e,osmdRef,setPlayIndex)} style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>

            <div>
              {/* <div style={{ display: "flex", gap: 16, fontSize: 16, marginBottom: 12 }}>
                <div>🎯 Score: <strong>{score}</strong></div>
                <div>🕘 Last: {lastScore ?? "-"}</div>
               <div>🏆 High: {highScore}</div>
              </div> 
          </div>
          */}

          <div className={`bg-[#FEFEFE] w-full h-auto sm:h-[20%] flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-0 px-4 sm:px-0 py-3 sm:py-0 ${isPlaying ? 'hidden' : ''}`} style={{
              boxShadow: '0 10px 30px rgba(50, 50, 93, 0.25)' // or use your own shadow
            }}>
                      <div className="sm:p-5 sm:flex-2 w-full sm:w-auto text-center sm:text-left">
                        <span className="text-[#0A0A0B] font-medium text-lg sm:text-[24px] sm:ml-10">{courseTitle}</span>
                      </div>
                      <div className="sm:p-4 sm:mr-12 w-full sm:w-auto">
                        <div className="flex flex-wrap justify-center sm:justify-end gap-x-4 sm:space-x-8 gap-y-2 items-center">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                              <Image src="/Frame.svg" width={28} height={20} alt="icon" className="w-5 h-4 sm:w-7 sm:h-5"/>
                              <span className="font-semibold text-lg sm:text-[24px] primary-color-text font-inter"> {highScore} </span>
                              <span className="font-medium primary-color-text text-xs sm:text-[16px] whitespace-nowrap">High Score</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                              <Image src="/SVGRepo_iconCarrier (1).svg" width={25} height={20} alt="icon" className="w-5 h-4 sm:w-[25px] sm:h-5"/>
                              <span className="font-semibold text-lg sm:text-[24px] primary-color-text font-inter"> {lastScore} </span>
                              <span className="font-medium primary-color-text text-xs sm:text-[16px] whitespace-nowrap">Last Score</span>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                              <Image src="/autoplay (1).svg" width={28} height={20} alt="icon" className="w-5 h-4 sm:w-7 sm:h-5"/>
                              <span className="font-semibold text-lg sm:text-[24px] primary-color-text font-inter"> playCount </span>
                              <span className="font-medium primary-color-text text-xs sm:text-[16px] whitespace-nowrap">Play Count</span>
                          </div>          
                        </div>
                      </div>
            </div>
          

      <section
        className="w-full box-border"
        style={{ background: "#EBEBEC", paddingBottom: 24 }}
      >
        <div
          className="mx-auto box-border overflow-x-auto"
          style={{
            marginTop: 16,
            marginBottom: 16,
            marginLeft: "max(16px, env(safe-area-inset-left, 0px))",
            marginRight: "max(16px, env(safe-area-inset-right, 0px))",
            maxWidth: 1200,
            background: "#FFFFFF",
            border: "1px solid rgba(10, 10, 11, 0.12)",
            minHeight: "60vh",
          }}
        >
          <div
            ref={containerRef}
            id="osmd-container"
            className="box-border"
            style={{
              width: "100%",
              minHeight: "60vh",
              padding: "16px 8px",
              background: "#FFFFFF",
            }}
          />
        </div>
      </section>
    
    {/* ✅ DESKTOP CONTROL BAR — completely untouched, just gated behind hidden sm:flex
        so the absolute-positioned layout (ml-72, left-4, right-4, transform) only
        ever renders at sm: and up, where those fixed offsets were designed to work. */}
    <div className="w-full h-20 hidden sm:flex items-center justify-center relative">
      {openDialogue && (
        <OptionPopup openDialogue={openDialogue} setOpenDialogue={setOpenDialogue} />
      )}
            
      <div className="absolute left-4 flex">
        <div className="flex space-x-[16px]">
          <div className="flex flex-col space-y-2">
          <span className="text-white font-medium text-[20px]">Score</span>
          <span className="text-[24px] font-bold">100</span>
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-white font-medium text-[20px] ml-2">Level</span>
          <span className="text-[24px] font-bold">1A</span>
        </div>
          
        </div>
        
        {/* Left Icon — Far Left */}
      <button className="ml-72 p-3 rounded-[4px] border border-solid shadow bg-white hover:shadow-lg" onClick={() => hasPrevious && !isPlaying && goToLesson(unitlessonsData[currentIndex - 1])}
                    disabled={!hasPrevious}>
                      <div className="flex flex-col items-center justify-center text-[14px] font-medium text-[#151517] gap-[12px] px-[6px]">
                            <span>100</span>
                            <span>BPM</span>
                      </div>

      </button>

      </div>
      


{/* Center Play Button */}
<div className="flex items-center justify-center w-full">
    <div className="flex items-center justify-center gap-2 w-full ">

      {/* Play/Pause Button */}
      <button
        className="cursor-pointer bg-[#D4AF37] rounded-[16px] py-[12px] px-[32px] h-[72px] max-w-[218px]  w-full"
        onClick={() => {
          if (isPlaying) {
            pauseCursor(osmdRef, setCountdown, setIsPlaying, playModeRef);
          } else {
            playCursor({
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
              midiOutputs: midiOutputs,
              playbackMidiGuard,
              setCountdown,
              setHighScore,
              setLastScore,
              clearHighlight,
            });
          }
        }}
      >
        <div className="space-x-4">
            <span className="text-[20px] font-medium">Play</span>
            <Image src="/Union.svg" width={15} height={15} alt="icon" className="" />
        </div>
         </button>

      <div className="flex mb-5 ml-20 transform -translate-x-1/2">
        <button className="mt-6 text-white px-6 py-2 bg-black rounded-lg hover:bg-green-700 transition">
          Play Note free left
        </button>
      </div>
    </div>
</div>
         
      {/* Right Icon — Far Right */}
      <div className="Settings absolute right-4 p-3 gap-4">
        <div className="flex items-center justify-end gap-4">
                  <StrikeIndicator 
                    mistakeCount={mistakeCount} 
                    maxMistakes={maxMistakes} 
                  />

              <Image src="/settings.svg" width={40} height={40} alt="icon" 
              className=" border-gray-300 cursor-pointer p-1"
                onClick={()=> setOpenDialogue(!openDialogue)}
              />
        </div>
              
        </div>

    </div>

    {/* ✅ MOBILE CONTROL BAR — new, simplified, stacked layout.
        Same controls, but reflowed into rows that actually fit a phone width.
        No absolute positioning, no fixed huge margins. */}
    <div className="flex sm:hidden flex-col gap-3 px-4 py-3 w-full relative">
      {openDialogue && (
        <OptionPopup openDialogue={openDialogue} setOpenDialogue={setOpenDialogue} />
      )}

      {/* Score / Level / BPM row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Score</span>
            <span className="text-lg font-bold">100</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">Level</span>
            <span className="text-lg font-bold">1A</span>
          </div>
        </div>

        <button
          className="p-2 rounded-[4px] border border-solid shadow bg-white hover:shadow-lg"
          onClick={() => hasPrevious && !isPlaying && goToLesson(unitlessonsData[currentIndex - 1])}
          disabled={!hasPrevious}
        >
          <div className="flex flex-col items-center justify-center text-xs font-medium text-[#151517] gap-1 px-1">
            <span>100</span>
            <span>BPM</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <StrikeIndicator
            mistakeCount={mistakeCount}
            maxMistakes={maxMistakes}
          />
          <Image src="/settings.svg" width={32} height={32} alt="icon"
            className="border-gray-300 cursor-pointer p-1"
            onClick={() => setOpenDialogue(!openDialogue)}
          />
        </div>
      </div>

      {/* Play button + secondary action, full width and stacked */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          className="cursor-pointer bg-[#D4AF37] rounded-[16px] py-[12px] px-[24px] h-[60px] w-full max-w-[280px]"
          onClick={() => {
            if (isPlaying) {
              pauseCursor(osmdRef, setCountdown, setIsPlaying, playModeRef);
            } else {
              playCursor({
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
                midiOutputs: midiOutputs,
                playbackMidiGuard,
                setCountdown,
                setHighScore,
                setLastScore,
                clearHighlight,
              });
            }
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-base font-medium">Play</span>
            <Image src="/Union.svg" width={15} height={15} alt="icon" />
          </div>
        </button>

        <button className="text-white px-5 py-2 bg-black rounded-lg hover:bg-green-700 transition text-sm">
          Play Note free left
        </button>
      </div>
    </div>
      
      {countdown !== null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "clamp(48px, 20vw, 96px)",
      color: "white",
      zIndex: 99999,
      fontWeight: "bold",
    }}
  >
    {countdown === 0 ? "GO!" : countdown}
  </div>
)}  
        </>
    )
}