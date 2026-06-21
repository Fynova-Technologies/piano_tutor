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
import { usePlaybackAudioSync } from "@/hooks/audio/usePlaybackAudioSync";



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
    /** Shown in the title bar (e.g. total plays for this lesson). */
    playCount?: number;
    /** When set with onTempoChange, footer shows − / BPM / + controls (Figma method bar). */
    tempo?: number;
    onTempoChange?: (bpm: number) => void;
}
type UnitLesson = {
  id: string, lessontitle: string, link: string, file: string 
};



export default function CursorControls (props: CursorControlsProps) {
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
            onPlay,
            incorrectNotesRef,
             showScorePopup,
             setShowScorePopup,
            playCount = 0,
            tempo = 100,
            onTempoChange,
        } =  props;

        usePlaybackAudioSync({
          isPlaying,
          isCountingIn: countdown !== null,
          tempo,
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

          <div
            className="bg-[#FEFEFE] w-full flex flex-wrap justify-between items-center gap-4 min-h-[72px] py-3 px-4 md:px-8 border-b border-black/5"
            style={{
              boxShadow: "0 1px 0 rgba(10, 10, 11, 0.06)",
            }}
          >
            <div className="min-w-0 flex-1">
              <span className="text-[#0A0A0B] font-medium text-base sm:text-lg md:text-2xl font-inter truncate block">
                {courseTitle}
              </span>
            </div>
            <div className="shrink-0">
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 md:gap-x-8">
                <div className="flex items-center gap-2 md:gap-3">
                  <Image src="/Frame.svg" width={24} height={18} alt="" className="shrink-0" />
                  <span className="font-semibold text-base sm:text-lg md:text-2xl primary-color-text font-inter tabular-nums">
                    {highScore}
                  </span>
                  <span className="font-medium primary-color-text text-xs sm:text-sm md:text-base whitespace-nowrap">
                    High Score
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Image src="/SVGRepo_iconCarrier (1).svg" width={22} height={18} alt="" className="shrink-0" />
                  <span className="font-semibold text-base sm:text-lg md:text-2xl primary-color-text font-inter tabular-nums">
                    {lastScore ?? "—"}
                  </span>
                  <span className="font-medium primary-color-text text-xs sm:text-sm md:text-base whitespace-nowrap">
                    Last Score
                  </span>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Image src="/autoplay (1).svg" width={24} height={18} alt="" className="shrink-0" />
                  <span className="font-semibold text-base sm:text-lg md:text-2xl primary-color-text font-inter tabular-nums">
                    {playCount}
                  </span>
                  <span className="font-medium primary-color-text text-xs sm:text-sm md:text-base whitespace-nowrap">
                    Play Count
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section
            className="w-full box-border pb-[220px] sm:pb-[100px] md:pb-[88px]"
            style={{
              background: "#EBEBEC",
            }}
          >
            <div className="w-full max-w-[1440px] mx-auto box-border px-2 sm:px-4 py-4">
              <div
                className="mx-auto box-border w-full max-w-[1200px] overflow-x-auto"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(10, 10, 11, 0.12)",
                }}
              >
                <div
                  ref={containerRef}
                  id="osmd-container"
                  className="box-border"
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            </div>
          </section>

          {openDialogue && (
            <OptionPopup
              openDialogue={openDialogue}
              setOpenDialogue={setOpenDialogue}
            />
          )}

          {/* ✅ Footer: stacks into rows on mobile instead of crushing 8 controls into one h-20 row.
              Each child gets w-full so its existing justify-start/center/end still aligns
              content left/center/right within its own full-width row when stacked. */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0B] border-t border-white/10 px-3 md:px-6 py-3 sm:py-0 sm:h-20 flex flex-col sm:grid sm:grid-cols-[1fr_minmax(auto,max-content)_1fr] items-stretch sm:items-center gap-2">
            {isPlaying ? (
              <>
                <div className="hidden sm:block" />
                <div className="flex justify-center w-full sm:w-auto">
                  <button
                    type="button"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-[#0A0A0B] bg-white hover:bg-zinc-100 cursor-pointer shadow-sm"
                    onClick={() => pauseCursor(osmdRef, setCountdown, setIsPlaying, playModeRef)}
                    aria-label="Pause"
                  >
                    <FontAwesomeIcon icon={faPause} size="lg" color="#0A0A0B" />
                  </button>
                </div>
                <div className="flex justify-end items-center gap-2 pr-1 w-full sm:w-auto">
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-white/10"
                    onClick={() => setOpenDialogue(!openDialogue)}
                    aria-label="Settings"
                  >
                    <Image src="/settings.svg" width={36} height={36} alt="" className="cursor-pointer" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-start gap-1.5 min-w-0 w-full sm:w-auto">
                  {onTempoChange ? (
                    <>
                      <button
                        type="button"
                        disabled={isPlaying}
                        className="h-9 w-9 shrink-0 rounded-lg border border-white/25 text-white text-lg font-medium hover:bg-white/10 disabled:opacity-40"
                        onClick={() => onTempoChange(Math.max(40, tempo - 5))}
                        aria-label="Decrease tempo"
                      >
                        −
                      </button>
                      <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#0A0A0B] tabular-nums min-w-[5.5rem] text-center">
                        {tempo} BPM
                      </div>
                      <button
                        type="button"
                        disabled={isPlaying}
                        className="h-9 w-9 shrink-0 rounded-lg border border-white/25 text-white text-lg font-medium hover:bg-white/10 disabled:opacity-40"
                        onClick={() => onTempoChange(Math.min(200, tempo + 5))}
                        aria-label="Increase tempo"
                      >
                        +
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="flex justify-center items-center gap-3 md:gap-5 w-full sm:w-auto">
                  <button
                    type="button"
                    className="bg-transparent p-0 border-0 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => hasPrevious && !isPlaying && goToLesson(unitlessonsData[currentIndex - 1])}
                    disabled={!hasPrevious || isPlaying}
                    aria-label="Previous lesson"
                  >
                    <Image src="/skip_previous_filled.svg" alt="" width={32} height={32} />
                  </button>

                  <button
                    type="button"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#0A0A0B] bg-white hover:bg-zinc-100 cursor-pointer shadow-md"
                    onClick={() => {
                      if (isPlaying) {
                        pauseCursor(osmdRef, setCountdown, setIsPlaying, playModeRef);
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
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="lg" color="#0A0A0B" />
                  </button>

                  <button
                    type="button"
                    className="bg-transparent p-0 border-0 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!hasNext || isPlaying}
                    onClick={() => hasNext && !isPlaying && goToLesson(unitlessonsData[currentIndex + 1])}
                    aria-label="Next lesson"
                  >
                    <Image src="/skip_next_filled.png" width={32} height={32} alt="" />
                  </button>
                </div>

                <div className="flex justify-end items-center gap-2 md:gap-3 pr-1 w-full sm:w-auto">
                  <button
                    type="button"
                    className="bg-[#D4AF37] h-11 min-w-[6.25rem] px-4 rounded-2xl border border-[#b8922c] flex gap-2 primary-color-text items-center justify-center text-[15px] font-medium shrink-0"
                  >
                    <Image src="/icon.svg" width={15} height={10} alt="" />
                    Learn
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-white/10 shrink-0"
                    onClick={() => setOpenDialogue(!openDialogue)}
                    aria-label="Settings"
                  >
                    <Image src="/settings.svg" width={36} height={36} alt="" className="cursor-pointer" />
                  </button>
                </div>
              </>
            )}
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

{props.score > 0 && !isPlaying && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99998,
    padding: "16px",
  }}>
    <div style={{
      background: "white", borderRadius: "16px", padding: "24px 20px",
      width: "100%", maxWidth: "420px", border: "0.5px solid #e5e5e5",
      maxHeight: "90vh", overflowY: "auto",
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
        <p style={{ fontSize: "clamp(18px, 5vw, 24px)", color: "#0A0A0B", marginBottom: 4, fontWeight: 400 }}>{courseTitle}</p>
        <p style={{ fontSize: 18, color:"#0A0A0B" }}>Song complete</p>
      </div>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Score", value: `${props.score}%` },
          { label: "High score", value: `${highScore ?? 0}%` },
          { label: "Last score", value: `${lastScore ?? 0}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f5f5f5", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#0A0A0B" , fontWeight: 500  }}>{label}</p>
            <p style={{ fontSize: "clamp(18px, 5vw, 24px)",color: "#808080", fontWeight: 500 }}>{value}</p>
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
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99998,
    padding: "16px",
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