/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useEffect,useRef, useState } from "react";
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
    playCount?: number;   // NEW
    tempo?: number;
    onPlay: () => void;    // NEW
    onPause: () => void;   // NEW
    onTempoChange?: (bpm: number) => void;   // NEW
}
type UnitLesson = {
  id: string, lessontitle: string, link: string, file: string 
};

function TempoControl({
  tempo,
  onTempoChange,
  disabled,
}: {
  tempo: number;
  onTempoChange?: (bpm: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on tap outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  // Close when playback starts
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const badge = (
    <>
      <span className="block text-sm font-semibold">{tempo}</span>
      <span className="block text-[10px] font-medium">BPM</span>
    </>
  );

  // No handler passed → static badge
  if (!onTempoChange) {
    return (
      <div className="h-10 rounded-lg bg-white px-2.5 text-[#0A0A0B] tabular-nums leading-tight text-center flex flex-col items-center justify-center shrink-0">
        {badge}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      {open && (
        <div
          className="absolute bottom-full left-0 mb-3 rounded-xl bg-[#0A0A0B] border border-white/15 shadow-lg p-3"
          style={{ width: "min(14rem, calc(100vw - 1.5rem))" }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-white/60 text-xs font-medium">Tempo</span>
            <span className="text-white text-sm font-semibold tabular-nums">{tempo} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={200}
            step={5}
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            aria-label="Tempo in BPM"
            className="w-full h-8 cursor-pointer accent-[#D4AF37]"
          />
          <div className="flex justify-between text-[10px] text-white/50 tabular-nums">
            <span>40</span>
            <span>200</span>
          </div>
          <div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 bg-[#0A0A0B] border-r border-b border-white/15" />
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Tempo ${tempo} BPM, tap to adjust`}
        className="h-10 rounded-lg bg-white px-2.5 text-[#0A0A0B] tabular-nums leading-tight text-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {badge}
      </button>
    </div>
  );
}



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
            maxMistakes = MAX_MISTAKES,  // Use default if not provided
            playCount = 0,        // NEW
            tempo = 100,
            onPlay,
                onTempoChange,
    onPause,
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
        const level = searchParams.get("level") || "1A";

const handlePlayToggle = () => {
  if (isPlaying) onPause();
  else onPlay();
};

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
    return (
  <div className="w-full max-w-full min-w-0 overflow-x-clip">
    {/* ===== HEADER ===== */}
    <div
      className={`bg-[#FEFEFE] w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 min-h-[72px] py-3 px-4 md:px-8 border-b border-black/5 ${isPlaying ? "hidden" : ""}`}
      style={{ boxShadow: "0 1px 0 rgba(10, 10, 11, 0.06)" }}
    >
      <div className="w-full sm:min-w-0 sm:flex-1">
        <span className="text-[#0A0A0B] font-medium text-base sm:text-lg md:text-2xl font-inter block truncate">
          {courseTitle}
        </span>
      </div>

      <div className="shrink-0 overflow-x-auto">
        <div className="flex items-center gap-x-4 md:gap-x-8 min-w-max">
          <div className="flex items-center gap-2 md:gap-3">
            <Image src="/Frame.svg" width={24} height={18} alt="" className="shrink-0" />
            <span className="font-semibold text-base md:text-2xl primary-color-text font-inter tabular-nums">{highScore}</span>
            <span className="font-medium primary-color-text text-xs md:text-base whitespace-nowrap">High Score</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Image src="/SVGRepo_iconCarrier (1).svg" width={22} height={18} alt="" className="shrink-0" />
            <span className="font-semibold text-base md:text-2xl primary-color-text font-inter tabular-nums">{lastScore ?? "—"}</span>
            <span className="font-medium primary-color-text text-xs md:text-base whitespace-nowrap">Last Score</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Image src="/autoplay (1).svg" width={24} height={18} alt="" className="shrink-0" />
            <span className="font-semibold text-base md:text-2xl primary-color-text font-inter tabular-nums">{playCount}</span>
            <span className="font-medium primary-color-text text-xs md:text-base whitespace-nowrap">Play Count</span>
          </div>
        </div>
      </div>
    </div>

    {/* ===== SHEET MUSIC ===== */}
    <section
      className="w-full box-border bg-[#EBEBEC] pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(6rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="w-full max-w-[1800px] mx-auto box-border px-2 sm:px-4 pt-4">
        <div
          className="mx-auto box-border w-full max-w-[1600px] overflow-x-auto my-4 bg-white min-h-[60vh]"
          style={{ border: "1px solid rgba(10, 10, 11, 0.12)" }}
        >
          <div
  ref={containerRef}
  id="osmd-container"
  className="box-border w-full min-w-0 max-w-full bg-white px-2 py-4 [&_svg]:max-w-none"
/>
        </div>
      </div>
    </section>

    {openDialogue && (
      <OptionPopup openDialogue={openDialogue} setOpenDialogue={setOpenDialogue} />
    )}

    {/* ===== DESKTOP BAR (lg+) ===== */}
    <div className="fixed bottom-0 left-0 right-0 z-50 hidden lg:grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 bg-[#0A0A0B] border-t border-white/10 h-[calc(5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Left */}
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex flex-col">
          <span className="text-white/70 font-medium text-sm">Score</span>
          <span className="text-white text-2xl font-bold leading-tight">100</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white/70 font-medium text-sm">Level</span>
          <span className="text-white text-2xl font-bold leading-tight">{level}</span>
        </div>
        <TempoControl tempo={tempo} onTempoChange={onTempoChange} disabled={isPlaying} />
      </div>

      {/* Center */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePlayToggle}
          className="cursor-pointer bg-[#D4AF37] rounded-[16px] h-14 w-[200px] flex items-center justify-center gap-3"
        >
          <span className="text-[20px] font-medium">{isPlaying ? "Pause" : "Play"}</span>
          <Image src="/Union.svg" width={15} height={15} alt="" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center justify-end gap-4 min-w-0">
        <StrikeIndicator mistakeCount={mistakeCount} maxMistakes={maxMistakes} />
        <Image
          src="/settings.svg" width={40} height={40} alt="Settings"
          className="cursor-pointer p-1 h-10 w-10 shrink-0"
          onClick={() => setOpenDialogue(!openDialogue)}
        />
      </div>
    </div>

    {/* ===== MOBILE / TABLET BAR (below lg) ===== */}
    <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden flex-col gap-3 px-4 pt-3 bg-[#0A0A0B] border-t border-white/10 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      {/* Row 1: Score / Level … Strikes / Settings */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-white/70 font-medium text-xs">Score</span>
            <span className="text-white text-lg font-bold leading-tight">100</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/70 font-medium text-xs">Level</span>
            <span className="text-white text-lg font-bold leading-tight">{level}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <StrikeIndicator mistakeCount={mistakeCount} maxMistakes={maxMistakes} />
          <Image
            src="/settings.svg" width={32} height={32} alt="Settings"
            className="cursor-pointer p-1 h-8 w-8 shrink-0"
            onClick={() => setOpenDialogue(!openDialogue)}
          />
        </div>
      </div>

      {/* Row 2: BPM + Play */}
      <div className="flex items-center justify-center gap-3">
        <TempoControl tempo={tempo} onTempoChange={onTempoChange} disabled={isPlaying} />
        <button
          type="button"
          onClick={handlePlayToggle}
          className="cursor-pointer bg-[#D4AF37] rounded-[16px] h-12 flex-1 max-w-[280px] flex items-center justify-center gap-3"
        >
          <span className="text-base font-medium">{isPlaying ? "Pause" : "Play"}</span>
          <Image src="/Union.svg" width={15} height={15} alt="" />
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
        </div>
    )
}