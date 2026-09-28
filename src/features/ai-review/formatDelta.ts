export type Delta = { text: string; dir: "up" | "down" | "neutral" };

/**
 * Turn a current/previous pair into real delta text for a StatCell.
 * Returns a neutral "not enough data" message when there's no prior period
 * to compare against, instead of a fabricated percentage.
 */
export function formatDelta(current: number, previous: number | null): Delta {
  if (previous == null || previous === 0) {
    return { text: "Not enough history yet", dir: "neutral" };
  }
  const diff = current - previous;
  if (diff === 0) {
    return { text: "Same as last period", dir: "neutral" };
  }
  const pct = Math.round((Math.abs(diff) / previous) * 100);
  return {
    // "previous sessions", not "last week" — previous/current here are a
    // count-based split (most recent 7 vs everything before), not a
    // calendar window, so the wording shouldn't imply a date range.
    text: `${pct}% ${diff > 0 ? "higher" : "lower"} than your earlier sessions`,
    dir: diff > 0 ? "up" : "down",
  };
}