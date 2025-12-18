/* eslint-disable @typescript-eslint/no-explicit-any */
import seekTo from "./seekto";
export function onProgressClick(e: React.MouseEvent<HTMLDivElement>,osmdRef: React.RefObject<any>,setPlayIndex: (n: number) => void) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const total = (osmd as any)._playbackDurations?.length ?? 0;
    if (!total) return;
    const idx = Math.floor(pct * total);
    seekTo(idx,osmdRef,setPlayIndex);
  }

  