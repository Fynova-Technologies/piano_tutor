/* eslint-disable @typescript-eslint/no-explicit-any */
  export default function endPlayback(
    finalizeScore: (totalStepsRef: React.MutableRefObject<number>, correctStepsRef: React.MutableRefObject<number>) => number,
    osmdRef: React.RefObject<any>,
    setIsPlaying: (b: boolean) => void,
    playModeRef: React.MutableRefObject<boolean>,
    totalStepsRef: React.MutableRefObject<number>,
    correctStepsRef: React.MutableRefObject<number>,
    setPlayIndex: (n: number) => void,
    setHighScore: React.Dispatch<React.SetStateAction<number | null>>,
    setLastScore: React.Dispatch<React.SetStateAction<number | null>>,
    clearHighlight: (osmd: any) => void,
    replaceOsmdCursor: (osmd: any) => void,
    setScore: (score: number | null) => void
  )  {
    const osmd = osmdRef.current;
    if (!osmd) return;
    
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }
    // finalize score
    const finalScore = finalizeScore(totalStepsRef, correctStepsRef);
    setScore(finalScore);
    setLastScore(finalScore);
    localStorage.setItem("lastScore", String(finalScore));
  
    setHighScore(prev => {
      const best = Math.max(prev ?? 0, finalScore);
      localStorage.setItem("highScore", String(best));
      return best;
    });

    setIsPlaying(false);
    setPlayIndex(0);
    osmd.cursor.reset();
    playModeRef.current = false;
    
    // Re-apply custom cursor after reset
    setTimeout(() => {
      replaceOsmdCursor(osmd);
    }, 100);
    clearHighlight(osmd);
    document.querySelectorAll(".vf-note-highlight").forEach((el) => el.classList.remove("vf-note-highlight"));

  console.log("🏁 Playback finished. Final score:", finalScore);
}