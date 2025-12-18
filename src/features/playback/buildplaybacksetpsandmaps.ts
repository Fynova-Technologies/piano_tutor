/* eslint-disable @typescript-eslint/no-explicit-any */
export default function buildPlaybackStepsAndMaps(osmd: any,setTotalSteps: (n: number) => void,setPlayIndex: (n: number) => void) {
    const it = osmd.cursor.iterator.clone();
    const durations: number[] = [];
    const midiToIndex = new Map<number, number>();
    let idx = 0;

    while (!it.EndReached) {

      const measure = it.CurrentMeasure;
      const bpm =
        typeof measure?.TempoInBPM === "number"
          ? measure.TempoInBPM
          : osmd.Sheet?.Rules?.DefaultTempoBPM ?? 120;

      const quarterMs = (60 / bpm) * 1000;

      const ves = it.CurrentVoiceEntries || [];
      const realVals = ves.map((ve: any) => ve?.Duration?.RealValue ?? 0.25);
      const smallest = realVals.length ? Math.min(...realVals) : 0.25;
      const delayMs = Math.max(50, smallest * 4 * quarterMs);
      durations.push(delayMs);

      for (const ve of ves) {
        for (const note of ve.Notes || []) {
          const half = (note as any)?.sourceNote?.halfTone ?? (note as any)?.midi;
          if (typeof half === "number" && !midiToIndex.has(half)) {
            midiToIndex.set(half, idx);
          }
        }
      }
      idx++;
      it.moveToNext();
    }

    (osmd as any)._playbackDurations = durations;
    (osmd as any)._playbackMidiMap = midiToIndex;
    (osmd as any)._playbackTotal = durations.length;
    setTotalSteps(durations.length);
    setPlayIndex(0);
  }
