// ── Segment configuration ────────────────────────────────────────────────────
// Maps cursor param → fraction of total beats to play
export const CURSOR_SEGMENT: Record<string, number> = {
  whole:   1.0,   // full piece
  chopped: 0.5,   // first half
  minced:  0.25,  // first quarter
};

/**
 * Returns the last beat index (exclusive) the player should run to.
 * e.g. totalBeats=200, cursor="chopped" → 100
 */
export function getSegmentEndBeat(totalBeats: number, cursor: string): number {
  const fraction = CURSOR_SEGMENT[cursor.toLowerCase()] ?? 1.0;
  return Math.ceil(totalBeats * fraction);
}

/** Human-readable label shown in the UI */
export function getSegmentLabel(cursor: string): string {
  const map: Record<string, string> = {
    whole:   "Full Piece",
    chopped: "First Half",
    minced:  "First Quarter",
  };
  return map[cursor.toLowerCase()] ?? "Full Piece";
}

/** Accent colour used for the segment badge */
export function getSegmentColor(cursor: string): string {
  const map: Record<string, string> = {
    whole:   "#4caf50",
    chopped: "#ff9800",
    minced:  "#e91e63",
  };
  return map[cursor.toLowerCase()] ?? "#4caf50";
}