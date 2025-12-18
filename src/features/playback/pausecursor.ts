/* eslint-disable @typescript-eslint/no-explicit-any */
export default function pauseCursor(osmdRef: React.RefObject<any>, setIsPlaying: (b: boolean) => void, playModeRef: React.MutableRefObject<boolean>) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (osmd._playTimer) {
      clearTimeout(osmd._playTimer);
      osmd._playTimer = null;
    }
    setIsPlaying(false);
    playModeRef.current = false;
  }