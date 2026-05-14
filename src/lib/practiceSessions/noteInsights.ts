import type { PracticeSession } from "@/datastore/sessionstorage";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function midiToNoteName(midi: number): string {
  const n = NOTE_NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${n}${oct}`;
}

export function formatExpectedChord(expected: number[]): string {
  if (!expected?.length) return "—";
  return [...new Set(expected)]
    .sort((a, b) => a - b)
    .map(midiToNoteName)
    .join("+");
}

export type NoteMistakeInsights = {
  totalMistakeEvents: number;
  sessionsConsidered: number;
  sessionsWithMistakeTelemetry: number;
  /** Wrong MIDI keys pressed most often */
  wrongNotesPlayed: { midi: number; note: string; count: number }[];
  /** Expected chord/note vs what was played */
  expectedToPlayed: { expectedLabel: string; playedNote: string; count: number }[];
  /** Sliding-window hot spots per piece */
  laggingPhrases: {
    piece: string;
    source: string;
    measureStart: number;
    measureEnd: number;
    mistakesInWindow: number;
  }[];
};

const MEASURE_WINDOW = 4;

/**
 * Aggregate per-note mistakes from merged sessions (local + Supabase).
 * Skips recovery drills; includes method lessons, library songs, music library, SASR, etc.
 */
export function aggregateNoteMistakeInsights(sessions: PracticeSession[]): NoteMistakeInsights {
  const playedCounts = new Map<number, number>();
  const transitionCounts = new Map<
    string,
    { expectedLabel: string; playedNote: string; count: number }
  >();

  const lessonMeasureCounts = new Map<
    string,
    { title: string; source: string; byMeasure: Map<number, number> }
  >();

  let totalEvents = 0;
  let sessionsConsidered = 0;
  let sessionsWithMistakeTelemetry = 0;

  for (const s of sessions) {
    const cat = s.sessionCategory ?? "unspecified";
    if (cat === "recovery_drill") continue;

    sessionsConsidered++;
    const events = s.mistakeEvents;
    if (!events?.length) continue;

    sessionsWithMistakeTelemetry++;
    const lessonKey = `${s.lesson.uid}|||${s.lesson.title}|||${s.lesson.source}`;
    let lm = lessonMeasureCounts.get(lessonKey);
    if (!lm) {
      lm = {
        title: s.lesson.title?.trim() || "Untitled piece",
        source: (s.lesson.source ?? "").trim(),
        byMeasure: new Map(),
      };
      lessonMeasureCounts.set(lessonKey, lm);
    }

    for (const ev of events) {
      totalEvents++;

      const pm = typeof ev.playedMidi === "number" ? ev.playedMidi : null;
      if (pm != null) {
        playedCounts.set(pm, (playedCounts.get(pm) ?? 0) + 1);
      }

      const expected = Array.isArray(ev.expectedMidi) ? ev.expectedMidi : [];
      const expectedLabel = formatExpectedChord(expected);
      const playedNote = pm != null ? midiToNoteName(pm) : "?";
      const tKey = `${expectedLabel}→${playedNote}`;
      const prev = transitionCounts.get(tKey);
      if (prev) prev.count += 1;
      else transitionCounts.set(tKey, { expectedLabel, playedNote, count: 1 });

      const mi = ev.measureIndex;
      if (typeof mi === "number" && mi >= 0) {
        lm.byMeasure.set(mi, (lm.byMeasure.get(mi) ?? 0) + 1);
      }
    }
  }

  const wrongNotesPlayed = [...playedCounts.entries()]
    .map(([midi, count]) => ({ midi, note: midiToNoteName(midi), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const expectedToPlayed = [...transitionCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const laggingPhrases: NoteMistakeInsights["laggingPhrases"] = [];

  for (const lm of lessonMeasureCounts.values()) {
    const byM = lm.byMeasure;
    if (byM.size === 0) continue;

    const maxMeasure = Math.max(...byM.keys());
    let best = { start: 0, end: 0, sum: -1 };

    for (let start = 0; start <= maxMeasure; start++) {
      const end = Math.min(start + MEASURE_WINDOW - 1, maxMeasure);
      let sum = 0;
      for (let m = start; m <= end; m++) {
        sum += byM.get(m) ?? 0;
      }
      if (sum > best.sum) best = { start, end, sum };
    }

    if (best.sum > 0) {
      laggingPhrases.push({
        piece: lm.title,
        source: lm.source,
        measureStart: best.start + 1,
        measureEnd: best.end + 1,
        mistakesInWindow: best.sum,
      });
    }
  }

  laggingPhrases.sort((a, b) => b.mistakesInWindow - a.mistakesInWindow);
  const topPhrases = laggingPhrases.slice(0, 8);

  return {
    totalMistakeEvents: totalEvents,
    sessionsConsidered,
    sessionsWithMistakeTelemetry,
    wrongNotesPlayed,
    expectedToPlayed,
    laggingPhrases: topPhrases,
  };
}
