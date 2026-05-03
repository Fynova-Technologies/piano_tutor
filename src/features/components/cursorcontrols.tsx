/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useEffect, useState } from "react";
import playCursor from "../playback/playcursor";
import pauseCursor from "../playback/pausecursor";
import clearHighlight from "../notes/clearhighlight";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import OptionPopup from "@/components/optionPopup";



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
    onPlay: () => void;
    incorrectNotesRef: React.MutableRefObject<number>;
    showScorePopup: boolean;
setShowScorePopup: (v: boolean) => void;
}
type UnitLesson = {
  id: string, lessontitle: string, link: string, file: string 
};



export default function CursorControls (props: CursorControlsProps) {
        const searchParams = useSearchParams();
        const router = useRouter();
        const [openDialogue, setOpenDialogue] = useState(false);
        const [backgroundVolume, setBackgroundVolume] = useState(100);
        const [metronomeVolume,setMetronomeVolume]=useState(100)


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
            courseTitle
        } =  props;

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

          <div  className={`bg-[#FEFEFE] w-full h-[20%] flex justify-between items-center ${isPlaying ? 'hidden' : ''}`} style={{
              boxShadow: '0 10px 30px rgba(50, 50, 93, 0.25)' // or use your own shadow
            }}>
                      <div className="p-5 flex-2">
                        <span className="text-[#0A0A0B] font-medium text-[24px] ml-10">{courseTitle}</span>
                      </div>
                      <div className="p-4 mr-12">
                        <div className="flex space-x-8 items-center">
                          <div className="flex items-center space-x-3">
                              <Image src="/Frame.svg" width={28} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> {highScore} </span>
                              <span className=" font-medium primary-color-text text-[16px]">  High Score</span>
                          </div>
                          <div className="flex items-center space-x-3">
                              <Image src="/SVGRepo_iconCarrier (1).svg" width={25} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> {lastScore} </span>
                              <span className="font-medium primary-color-text  text-[16px]">Last Score</span>
                          </div>
                          <div className="flex items-center space-x-3">
                              <Image src="/autoplay (1).svg" width={28} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> playCount </span>
                              <span className="font-medium primary-color-text  text-[16px]">Play Count</span>
                          </div>          
                        </div>
                      </div>
            </div>
          
<div style={{ paddingBottom: "80px", background: "white" }}>
      <div
        ref={containerRef}
        id="osmd-container"
        style={{ width: "100%", background: "white", borderTop: "1px solid #ddd" }}
      />
</div>
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full h-20 flex items-center justify-center bg-[#0A0A0B]">
    {isPlaying ? (
    /* ── Minimal playing state ── */
    <>
      <button
        className="px-5 py-4 rounded-full border border-solid hover:bg-zinc-100 cursor-pointer bg-white"
        onClick={() => pauseCursor(osmdRef, setIsPlaying, playModeRef)}>
        <FontAwesomeIcon icon={faPause} size="lg" color="#0A0A0B" />
      </button>

      <div className="absolute right-4 p-3">
        <Image src="/settings.svg" width={40} height={40} alt="settings"
          className="border-gray-300 cursor-pointer p-1"
          onClick={() => setOpenDialogue(!openDialogue)} />
      </div>
    </>
  ) : (
    <>
      {openDialogue && <OptionPopup openDialogue={openDialogue} setOpenDialogue={setOpenDialogue} backgroundVolume={backgroundVolume} setBackgroundVolume={setBackgroundVolume} metronomeVolume={metronomeVolume} setMetronomeVolume={setMetronomeVolume}  />}
      

      {/* Left Icon — Far Left */}
      <button className="absolute left-4 p-3 rounded-full border border-solid shadow bg-white hover:shadow-lg" onClick={() => hasPrevious && !isPlaying && goToLesson(unitlessonsData[currentIndex - 1])}
                    disabled={!hasPrevious}>
                            <Image src="/skip_previous_filled.png" width={45} height={20} alt="skip previous" className="ml-2" />
      </button>


{/* Center Play Button */}
<div className="flex items-center justify-center w-full">
    <div className="flex items-center justify-center gap-2 w-full ">
      
      {/* Previous Button */}
      <button
        className="bg-transparent p-0 border-0 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => hasPrevious && !isPlaying && goToLesson(unitlessonsData[currentIndex - 1])}
        disabled={!hasPrevious || isPlaying}
      >
        <Image src="/skip_previous_filled.svg" alt="skip previous" width={35} height={35} />
      </button>

      {/* Play/Pause Button */}
      <button
        className="px-5 py-4 text-white rounded-full border border-solid hover:bg-zinc-300 cursor-pointer bg-white"
        onClick={() => {
          if (isPlaying) {
            pauseCursor(osmdRef, setIsPlaying, playModeRef);
          } else {
            props.onPlay();
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
        <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="lg" color="#0A0A0B" />
      </button>

      {/* Next Button */}
      <button
        className="bg-transparent p-0 border-0 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!hasNext || isPlaying}
        onClick={() => hasNext && !isPlaying && goToLesson(unitlessonsData[currentIndex + 1])}
      >
        <Image src="/skip_next_filled.png" width={35} height={35} alt="skip next" />
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
            <button className="bg-[#D4AF37] py-[6px] w-[101px] h-[48px] px-[16px] rounded-2xl border border-solid flex gap-2 primary-color-text items-center text-[16px]">
                <Image src="/icon.svg" width={15} height={10} alt="icon"/> Learn
            </button>
              <Image src="/settings.svg" width={40} height={40} alt="icon" 
              className=" border-gray-300 cursor-pointer p-1"
                onClick={()=> setOpenDialogue(!openDialogue)}
              />
        </div>
              
        </div>
</>)} 
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
      fontSize: 96,
      color: "white",
      zIndex: 99999,
      fontWeight: "bold",
    }}
  >
    {countdown === 0 ? "GO!" : countdown}
  </div>
)}

{props.score > 0 && !isPlaying && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99998
  }}>
    <div style={{
      background: "white", borderRadius: "16px", padding: "32px 36px",
      width: "100%", maxWidth: "420px", border: "0.5px solid #e5e5e5"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF3DE",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="9" stroke="#3B6D11" strokeWidth="2"/>
          </svg>
        </div>
        <p style={{ fontSize: 24, color: "#0A0A0B", marginBottom: 4, fontWeight: 400 }}>{courseTitle}</p>
        <p style={{ fontSize: 18, color:"#0A0A0B" }}>Song complete</p>
      </div>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Score", value: `${props.score}%` },
          { label: "High score", value: `${highScore ?? 0}%` },
          { label: "Last score", value: `${lastScore ?? 0}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f5f5f5", borderRadius: 8, padding: 12, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#0A0A0B" , fontWeight: 500  }}>{label}</p>
            <p style={{ fontSize: 24,color: "#808080", fontWeight: 500 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Correct / Incorrect */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#3B6D11" }}>Correct</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#27500A", marginLeft: "auto" }}>{props.correctStepsRef.current}</p>
        </div>
        <div style={{ background: "#FCEBEB", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#A32D2D" }}>Incorrect</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: "#791F1F", marginLeft: "auto" }}>{props.incorrectNotesRef.current}</p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          style={{ padding: 12, borderRadius: 8, border: "0.5px solid #ddd", background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          onClick={() => { props.setScore(null); props.onPlay(); }}>
          Retry
        </button>
        <button
          style={{ padding: 12, borderRadius: 8, border: "none", background: "#D4AF37", fontSize: 14, fontWeight: 500, color: "#412402", cursor: "pointer" }}
          onClick={() => router.push("/library")}>
          Go to library
        </button>
      </div>
    </div>
  </div>
)}

{props.showScorePopup && !isPlaying && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99998
  }}>
    {/* ... same popup content ... */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <button
        style={{ padding: 12, borderRadius: 8, border: "0.5px solid #ddd", background: "white", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        onClick={() => { 
          props.setShowScorePopup(false);  // ← close popup first
          props.setScore(null); 
          props.onPlay(); 
        }}>
        Retry
      </button>
      <button
        style={{ padding: 12, borderRadius: 8, border: "none", background: "#D4AF37", fontSize: 14, fontWeight: 500, color: "#412402", cursor: "pointer" }}
        onClick={() => router.push("/method")}>
        Go to method
      </button>
    </div>
  </div>
)}
        </>
    )
}