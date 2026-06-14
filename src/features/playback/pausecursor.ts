/* eslint-disable @typescript-eslint/no-explicit-any */
import { notifyPlaybackStopped } from "@/lib/audio/audioEngine";

export default function pauseCursor(osmdRef: React.RefObject<any>, setCountdown: (n: number | null) => void, setIsPlaying: (b: boolean) => void, playModeRef: React.MutableRefObject<boolean>) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }
    // in pauseCursor
if (osmd._countdownInterval) {
  clearInterval(osmd._countdownInterval);
  osmd._countdownInterval = null;
}
if (osmd._countdownTimeout) {
  clearTimeout(osmd._countdownTimeout);
  osmd._countdownTimeout = null;
}
setCountdown(null);  // ← clear the 3 2 1 UI
    setIsPlaying(false);
    playModeRef.current = false;
    notifyPlaybackStopped();
  }