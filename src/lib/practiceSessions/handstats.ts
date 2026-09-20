/**
 * Per-hand play tracking for a single practice run.
 *
 * Used by LessonPracticeWorkspace: create a tracker in startPlayback, call
 * recordHandPress() for every key press, then finalizeHandStats() in
 * handleEndOfPiece and save the result in session.progressMetrics.handStats.
 *
 * Hand convention (same as BeatCursor.getExpectedNotesByStaff): staff 0 = right hand,
 * staff 1+ = left hand. Pieces with a single staff are flagged twoStaff: false and
 * are ignored by the hand analysis.
 */

export type Hand = "left" | "right";

/** MIDI numbers per hand. */
export type HandNotes = { left: number[]; right: number[] };

export type HandCounts = {
  /** Notes that were supposed to start (one per note, not per beat). */
  expected: number;
  /** Expected notes that were pressed while the cursor was on their beat. */
  hit: number;
  /** Expected notes never pressed on their beat (expected - hit). */
  missed: number;
  /** Wrong pitches pressed on a note-start beat, attributed to the nearest hand. */
  wrong: number;
  /** Extra presses on a held / off-beat step, attributed to the nearest hand. */
  extra: number;
};

export type HandStats = {
  version: 1;
  /** False when the piece has one staff, so left/right cannot be told apart. */
  twoStaff: boolean;
  left: HandCounts;
  right: HandCounts;
};

export type HandTracker = {
  /** beatIndex -> set of correct MIDI notes pressed on that beat */
  hits: Map<number, Set<number>>;
  wrong: Record<Hand, number>;
  extra: Record<Hand, number>;
};

/** Beat data the tracker needs. BeatCursor.getHandNotesForBeat() returns this. */
export type BeatHandInfo = {
  isNoteStart: boolean;
  /** Notes that START on this beat, by hand. */
  start: HandNotes;
  /** Every note sounding on this beat (including held ones), by hand. */
  active: HandNotes;
};

const emptyCounts = (): HandCounts => ({ expected: 0, hit: 0, missed: 0, wrong: 0, extra: 0 });

export function createHandTracker(): HandTracker {
  return {
    hits: new Map(),
    wrong: { left: 0, right: 0 },
    extra: { left: 0, right: 0 },
  };
}

/** Which hand does a pitch most plausibly belong to? Nearest expected note wins. */
function nearestHand(midi: number, notes: HandNotes): Hand {
  let best: { hand: Hand; dist: number } | null = null;
  for (const hand of ["left", "right"] as const) {
    for (const n of notes[hand]) {
      const dist = Math.abs(n - midi);
      if (!best || dist < best.dist) best = { hand, dist };
    }
  }
  if (best) return best.hand;
  // No notes to compare against: fall back to the middle-C split.
  return midi < 60 ? "left" : "right";
}

/**
 * Record one key press. Call this BEFORE the "beat already scored" early return in
 * trackAndHighlightNote, so a chord beat (both hands) can register both notes.
 * Returns the hand the press is attributed to, for tagging the mistake event.
 */
export function recordHandPress(
  tracker: HandTracker,
  beatIndex: number,
  midi: number,
  beat: BeatHandInfo
): Hand {
  if (beat.isNoteStart) {
    const inStart = beat.start.left.includes(midi) || beat.start.right.includes(midi);
    if (inStart) {
      let set = tracker.hits.get(beatIndex);
      if (!set) {
        set = new Set();
        tracker.hits.set(beatIndex, set);
      }
      set.add(midi);
      return beat.start.left.includes(midi) ? "left" : "right";
    }
    const hand = nearestHand(midi, beat.start);
    tracker.wrong[hand] += 1;
    return hand;
  }

  // Held / off-beat step: only counts as extra if it is not a note that is sounding.
  const isActive = beat.active.left.includes(midi) || beat.active.right.includes(midi);
  const hand = nearestHand(midi, beat.active);
  if (!isActive) tracker.extra[hand] += 1;
  return hand;
}

/** Minimal shape of BeatCursor that finalizeHandStats needs. */
export type HandBeatSource = {
  getTotalBeats(): number;
  getHandNotesForBeat(index: number): BeatHandInfo | null;
  getStaffCount(): number;
};

/** Turn the tracker into the object that gets saved with the session. */
export function finalizeHandStats(tracker: HandTracker, source: HandBeatSource): HandStats {
  const left = emptyCounts();
  const right = emptyCounts();
  const byHand = { left, right };

  const total = source.getTotalBeats();
  for (let i = 0; i < total; i++) {
    const info = source.getHandNotesForBeat(i);
    if (!info || !info.isNoteStart) continue;
    const pressed = tracker.hits.get(i);
    for (const hand of ["left", "right"] as const) {
      for (const midi of info.start[hand]) {
        byHand[hand].expected += 1;
        if (pressed?.has(midi)) byHand[hand].hit += 1;
        else byHand[hand].missed += 1;
      }
    }
  }

  left.wrong = tracker.wrong.left;
  right.wrong = tracker.wrong.right;
  left.extra = tracker.extra.left;
  right.extra = tracker.extra.right;

  return { version: 1, twoStaff: source.getStaffCount() > 1, left, right };
}