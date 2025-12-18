import endPlayback from "./endplayback";
import getNotesAtCursor from "../notes/getNotesatcursor";
import finalizeScore from "../scores/finalscore";
/* eslint-disable @typescript-eslint/no-explicit-any */
type PlayCursorArgs = {
  osmdRef: React.RefObject<any>;
  setIsPlaying: (b: boolean) => void;
  playModeRef: React.MutableRefObject<boolean>;
  totalStepsRef: React.MutableRefObject<number>;
  correctStepsRef: React.MutableRefObject<number>;
  scoredStepsRef: React.MutableRefObject<Set<number>>;
  currentCursorStepRef: React.MutableRefObject<number>;
  currentStepNotesRef: React.MutableRefObject<any[]>;
  setPlayIndex: (n: number) => void;
  setCurrentStepNotes: (n: any[]) => void;
  setScore: (n: number | null) => void;
  midiOutputs: any;
  playbackMidiGuard: React.MutableRefObject<number>;
  setCountdown: (n: number | null) => void;
  setHighScore: React.Dispatch<React.SetStateAction<number | null>>;
  setLastScore: React.Dispatch<React.SetStateAction<number | null>>;
  clearHighlight: (osmd: any) => void;
  replaceOsmdCursor: (osmd: any) => void;
};

  export default function playCursor(args: PlayCursorArgs) {
    const {
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
    midiOutputs,
    playbackMidiGuard,
    setCountdown,
    setHighScore,
    setLastScore,
    clearHighlight,
    replaceOsmdCursor
    }   = args;

    const osmd = osmdRef.current;
    if (!osmd) return;
    const steps: number[] = (osmd as any)._playbackDurations ?? [];
    if (!steps.length) {
      console.warn("No playback steps built");
      return;
    }

    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }

      // Reset cursor and show FIRST position
    osmd.cursor.reset();
    osmd.cursor.show();
    setCountdown(3);
    let countdownValue = 3;
    const countdownInterval = setInterval(() => {
      countdownValue -= 1;
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        setCountdown(null);
      } else {
        setCountdown(countdownValue);
      }
    }, 1000);
  
    playModeRef.current = true;
    setTimeout(() => {
      setIsPlaying(true);
      playModeRef.current = true;
      totalStepsRef.current = 0;
      correctStepsRef.current = 0;
      scoredStepsRef.current.clear();
      setScore(null);

      const idx = 0; // Always start from 0 after countdown
      startActualPlayback(idx, steps);
    }, 3000); // 3 second countdown

    function startActualPlayback(startIdx: number, steps: number[]) {
      const osmd = osmdRef.current;
      if (!osmd) return;
      let idx = startIdx;

    const sendMidiForStep = (index: number) => {
      const it = osmd.cursor.iterator.clone();
      let i = 0;
      while (!it.EndReached && i < index) {
        it.moveToNext();
        i++;
      }
      const ves = it.CurrentVoiceEntries || [];
      for (const ve of ves) {
        for (const n of ve.Notes || []) {
          const half = n?.sourceNote?.halfTone;
          if (typeof half === "number") {
            const midiNote = half;
            
            const velocity = 0x50;
            
            try {
              if (midiOutputs.length > 0) {
                playbackMidiGuard.current += 1;
                midiOutputs[0].send([0x90, midiNote, velocity]);

                const offDelay = Math.max(100, (osmd as any)._playbackDurations?.[index] ?? 200);
                const when = window.performance.now() + offDelay;
                midiOutputs[0].send([0x80, midiNote, 0x40], when);

                setTimeout(() => {
                  playbackMidiGuard.current = Math.max(0, playbackMidiGuard.current - 1);
                }, offDelay + 20);
                
              }
            } catch (e) {
              console.warn("MIDI send error", e);
              playbackMidiGuard.current = Math.max(0, playbackMidiGuard.current - 1);
            }
          }
        }
      }
  
      
    };


    function step() {
      if (idx >= steps.length) {
          endPlayback(
    finalizeScore,
    osmdRef,
    setIsPlaying,
    playModeRef,
    totalStepsRef,
    correctStepsRef,
    setPlayIndex,
    setHighScore,
    setLastScore,
    clearHighlight,
    replaceOsmdCursor,
    setScore,
    
    );
        return;
      }
      currentCursorStepRef.current = idx;
      // 👇 count this step as a question
      totalStepsRef.current += 1;
      // allow scoring for this step
      scoredStepsRef.current.delete(idx);
      const stepNotes = getNotesAtCursor(osmd);
      setCurrentStepNotes(stepNotes);
      currentStepNotesRef.current = stepNotes;

      scoredStepsRef.current.delete(idx);
      sendMidiForStep(idx);
      sendMidiForStep(idx);

      const delay = steps[idx] ?? 200;
      setPlayIndex(idx);

      idx++;

      // Move cursor AFTER the delay, not before
      osmd._playTimer = setTimeout(() => {
        osmd.cursor.next();
        step();
      }, delay);
    }

    step();
  }
}