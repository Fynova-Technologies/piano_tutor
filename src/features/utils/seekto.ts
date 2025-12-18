/* eslint-disable @typescript-eslint/no-explicit-any */
  export default function seekTo(index: number,osmdRef: React.RefObject<any>,setPlayIndex: (n: number) => void) {
    const osmd = osmdRef.current;
    if (!osmd) return;
    if (!((osmd as any)._playbackDurations?.length)) return;
    index = Math.max(0, Math.min(index, (osmd as any)._playbackDurations.length - 1));
    osmd.cursor.reset();
    for (let i = 0; i < index; ++i) osmd.cursor.next();
    setPlayIndex(index);
  }