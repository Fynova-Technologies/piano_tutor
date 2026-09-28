/**
 * Hand-targeted recovery drills.
 *
 * Pure functions with no framework imports so they can be unit-tested on their own.
 * Used by app/api/practice/generate-recovery/route.ts.
 *
 * Convention (same as the player): staff 1 = right hand (treble), staff 2 = left hand (bass).
 */

export type Hand = "left" | "right";
export type HandFocusMode = "auto" | "left" | "right" | "both";
export type DrillFocus = Hand | "both";
/** "grand" = treble + bass staves in one piano part. "treble_only" = legacy single staff. */
export type DrillLayout = "grand" | "treble_only";

export type WeakNote = { midi: number; note: string; count: number };
export type HandWeakNotes = { left: WeakNote[]; right: WeakNote[] };

export type DrillMistakeEvent = {
  expectedMidi?: number[];
  playedMidi?: number;
  measureIndex?: number;
  hand?: Hand;
};

/** Structural subset of HandStats, so this file needs no imports. */
export type HandStatsLike = {
  twoStaff?: boolean;
  left?: { expected?: number; hit?: number };
  right?: { expected?: number; hit?: number };
  missedNotes?: { left?: Record<string, number>; right?: Record<string, number> };
};

export type FocusDecision = {
  focus: DrillFocus;
  layout: DrillLayout;
  /** The hand that gets the harder rhythm when both hands play. Also the "weaker" hand when known. */
  lead: Hand;
  reason: string;
};

const MIDDLE_C = 60;
const DEFAULT_POOL: Record<Hand, number[]> = {
  left: [48, 50, 52, 53, 55], // C3 D3 E3 F3 G3
  right: [60, 62, 64, 65, 67], // C4 D4 E4 F4 G4
};
const WHITE_KEYS = new Set([0, 2, 4, 5, 7, 9, 11]);

/** Need this many expected notes per hand (summed over sessions) before auto picks a hand. */
const MIN_NOTES_FOR_AUTO = 10;
/** Accuracy gap (points) between hands before auto picks one. */
const MIN_GAP_FOR_AUTO = 8;

/* ───────────── small parsing helpers (columns may arrive as JSON strings) ───────────── */

export function asObject(v: unknown): Record<string, unknown> | null {
  let x = v;
  if (typeof x === "string") {
    try {
      x = JSON.parse(x);
    } catch {
      return null;
    }
  }
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}

export function parseEvents(raw: unknown): DrillMistakeEvent[] {
  let x = raw;
  if (typeof x === "string") {
    try {
      x = JSON.parse(x);
    } catch {
      return [];
    }
  }
  return Array.isArray(x) ? (x as DrillMistakeEvent[]) : [];
}

export function extractHandStats(progressMetrics: unknown): HandStatsLike | null {
  const pm = asObject(progressMetrics);
  const hs = pm ? asObject(pm.handStats) : null;
  if (!hs || !asObject(hs.left) || !asObject(hs.right)) return null;
  return hs as HandStatsLike;
}

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function midiName(midi: number): string {
  return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/* ───────────── 1. weak notes per hand ───────────── */

function toWeak(map: Map<number, number>, limit: number): WeakNote[] {
  return [...map.entries()]
    .map(([midi, count]) => ({ midi, note: midiName(midi), count }))
    .sort((a, b) => b.count - a.count || a.midi - b.midi)
    .slice(0, limit);
}

/**
 * Rank the notes worth drilling, separately for each hand.
 *
 * Evidence, strongest first:
 *  - notes the hand never played (handStats.missedNotes), weight 1 each
 *  - wrong keys pressed, credited to the hand the press was attributed to, weight 1
 *  - the note that press was aiming at (nearest expected note), weight 0.5
 *
 * If a hand has none of that (older sessions, or a hand that was never pressed),
 * fall back to the other expected notes seen in mistake events, split at middle C.
 * That still comes from the lesson's real notes, unlike a generic default scale.
 */
export function rankWeakNotesByHand(
  events: DrillMistakeEvent[],
  statsList: HandStatsLike[],
  limit = 8
): HandWeakNotes {
  const main = { left: new Map<number, number>(), right: new Map<number, number>() };
  const context = { left: new Map<number, number>(), right: new Map<number, number>() };
  const bump = (m: Map<number, number>, midi: number, w: number) =>
    m.set(midi, (m.get(midi) ?? 0) + w);
  const sideOf = (midi: number): Hand => (midi < MIDDLE_C ? "left" : "right");

  for (const ev of events) {
    const played = typeof ev.playedMidi === "number" ? ev.playedMidi : null;
    const expected = (ev.expectedMidi ?? []).filter((n): n is number => typeof n === "number");
    const hand: Hand = ev.hand ?? (played != null ? sideOf(played) : sideOf(expected[0] ?? MIDDLE_C));

    let target: number | null = null;
    if (played != null) {
      bump(main[hand], played, 1);
      if (expected.length > 0) {
        target = expected.reduce((best, n) =>
          Math.abs(n - played) < Math.abs(best - played) ? n : best
        );
        bump(main[hand], target, 0.5);
      }
    }
    for (const n of expected) {
      if (n !== target) bump(context[sideOf(n)], n, 1);
    }
  }

  for (const s of statsList) {
    for (const hand of ["left", "right"] as const) {
      for (const [key, count] of Object.entries(s.missedNotes?.[hand] ?? {})) {
        const midi = Number(key);
        if (Number.isFinite(midi) && typeof count === "number") bump(main[hand], midi, count);
      }
    }
  }

  const pick = (hand: Hand) => toWeak(main[hand].size > 0 ? main[hand] : context[hand], limit);
  return { left: pick("left"), right: pick("right") };
}

/* ───────────── 2. which hand to drill ───────────── */

function median(xs: number[]): number {
  if (xs.length === 0) return MIDDLE_C;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function resolveHandFocus(
  mode: HandFocusMode,
  statsList: HandStatsLike[],
  weak: HandWeakNotes
): FocusDecision {
  const two = statsList.filter((s) => s.twoStaff);
  const sum = (hand: Hand) =>
    two.reduce(
      (a, s) => ({
        expected: a.expected + (s[hand]?.expected ?? 0),
        hit: a.hit + (s[hand]?.hit ?? 0),
      }),
      { expected: 0, hit: 0 }
    );
  const L = sum("left");
  const R = sum("right");
  const acc = (x: { expected: number; hit: number }) =>
    x.expected > 0 ? Math.round((x.hit / x.expected) * 100) : null;
  const la = acc(L);
  const ra = acc(R);

  const haveBoth = L.expected >= MIN_NOTES_FOR_AUTO && R.expected >= MIN_NOTES_FOR_AUTO;
  const weaker: Hand | null =
    haveBoth && la != null && ra != null && Math.abs(la - ra) >= MIN_GAP_FOR_AUTO
      ? la < ra
        ? "left"
        : "right"
      : null;

  const weight = (ws: WeakNote[]) => ws.reduce((a, w) => a + w.count, 0);
  const lead: Hand = weaker ?? (weight(weak.left) > weight(weak.right) ? "left" : "right");
  const n = two.length;
  const sessions = `${n} two-handed session${n === 1 ? "" : "s"}`;

  if (mode === "left" || mode === "right") {
    return { focus: mode, layout: "grand", lead: mode, reason: `You chose the ${mode} hand.` };
  }
  if (mode === "both") {
    return {
      focus: "both",
      layout: "grand",
      lead,
      reason: weaker
        ? `Both hands together, with the harder rhythm on your ${weaker} hand.`
        : "Both hands together.",
    };
  }

  // auto
  if (weaker && la != null && ra != null) {
    const [weakPct, strongPct] = weaker === "left" ? [la, ra] : [ra, la];
    return {
      focus: weaker,
      layout: "grand",
      lead: weaker,
      reason: `Your ${weaker} hand hit ${weakPct}% of its notes versus ${strongPct}% for the other hand over ${sessions} of this lesson.`,
    };
  }
  if (haveBoth) {
    return {
      focus: "both",
      layout: "grand",
      lead,
      reason: `Your hands are within ${MIN_GAP_FOR_AUTO} points of each other on this lesson, so this drill uses both.`,
    };
  }
  if (n === 0) {
    // No two-handed history at all: behave like the original generator.
    const all = [...weak.left, ...weak.right].map((w) => w.midi);
    const low = median(all) < 55;
    return {
      focus: low ? "left" : "right",
      layout: low ? "grand" : "treble_only",
      lead: low ? "left" : "right",
      reason: "This lesson has no two-handed history, so the drill targets the notes you missed.",
    };
  }
  return {
    focus: "both",
    layout: "grand",
    lead,
    reason: "Not enough two-handed history on this lesson yet to pick a hand, so this drill uses both.",
  };
}

/* ───────────── 3. deterministic drill generator ───────────── */

const STEP_ALTER: Record<number, [string, number]> = {
  0: ["C", 0], 1: ["C", 1], 2: ["D", 0], 3: ["D", 1], 4: ["E", 0], 5: ["F", 0],
  6: ["F", 1], 7: ["G", 0], 8: ["G", 1], 9: ["A", 0], 10: ["A", 1], 11: ["B", 0],
};

function scaleNeighbor(midi: number, dir: 1 | -1): number {
  let m = midi + dir;
  while (!WHITE_KEYS.has(((m % 12) + 12) % 12)) m += dir;
  return m;
}

function pitchXml(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const [step, alter] = STEP_ALTER[pc];
  const octave = Math.floor(midi / 12) - 1;
  return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch>`;
}

type Slot = { midi: number; weight: number };

function poolFor(hand: Hand, weak: HandWeakNotes): Slot[] {
  const list = weak[hand];
  if (list.length === 0) return DEFAULT_POOL[hand].map((midi) => ({ midi, weight: 1 }));
  return list.map((w) => ({ midi: w.midi, weight: w.count }));
}

/** Split `slots` measures across notes in proportion to their weight, at least one each. */
function apportion(weights: number[], slots: number): number[] {
  const n = Math.min(weights.length, slots);
  const w = weights.slice(0, n);
  const alloc = new Array<number>(n).fill(1);
  let extra = slots - n;
  const total = w.reduce((a, b) => a + b, 0) || 1;
  const quotas = w.map((x) => (x / total) * extra);
  quotas.forEach((q, i) => (alloc[i] += Math.floor(q)));
  extra -= quotas.reduce((a, q) => a + Math.floor(q), 0);
  const order = quotas.map((q, i) => [q - Math.floor(q), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < extra; k++) alloc[order[k % n][1]] += 1;
  return alloc;
}

/** One anchor note per measure: heavier notes get more measures, low to high. */
function anchorsFor(pool: Slot[], measures: number): number[] {
  const top = pool.slice(0, measures);
  const alloc = apportion(top.map((p) => p.weight), measures);
  const withCount = top.map((p, i) => ({ midi: p.midi, n: alloc[i] })).sort((a, b) => a.midi - b.midi);
  return withCount.flatMap((p) => new Array<number>(p.n).fill(p.midi));
}

const noteXml = (midi: number, dur: number, type: string, voice: number, staff: 1 | 2 | null) =>
  `<note>${pitchXml(midi)}<duration>${dur}</duration><voice>${voice}</voice><type>${type}</type>${staff ? `<staff>${staff}</staff>` : ""}</note>`;

const restXml = (voice: number, staff: 1 | 2 | null) =>
  `<note><rest measure="yes"/><duration>4</duration><voice>${voice}</voice><type>whole</type>${staff ? `<staff>${staff}</staff>` : ""}</note>`;

/**
 * Build the drill. Each measure is a neighbour-note figure around one weak note
 * (weak, step up, weak, step down), so the weakest notes come back most often and
 * the motion stays stepwise. The hand that isn't being drilled gets whole-measure
 * rests, so the grand staff stays readable and the cursor still moves.
 */
export function buildDrillXml(
  weak: HandWeakNotes,
  decision: FocusDecision,
  tempoBpm: number,
  measures = 8
): string {
  const grand = decision.layout === "grand";
  const active: Record<Hand, boolean> = {
    right: decision.focus !== "left",
    left: grand && decision.focus !== "right",
  };
  const quarterHand: Hand = decision.focus === "both" ? decision.lead : decision.focus;

  const anchors: Record<Hand, number[]> = {
    left: active.left ? anchorsFor(poolFor("left", weak), measures) : [],
    right: active.right ? anchorsFor(poolFor("right", weak), measures) : [],
  };

  const staffOf = (h: Hand): 1 | 2 | null => (grand ? (h === "right" ? 1 : 2) : null);
  const voiceOf = (h: Hand) => (h === "right" ? 1 : 2);

  const handXml = (hand: Hand, m: number): string => {
    if (!active[hand]) return restXml(voiceOf(hand), staffOf(hand));
    const w = anchors[hand][m];
    const up = scaleNeighbor(w, 1);
    const down = scaleNeighbor(w, -1);
    const v = voiceOf(hand);
    const s = staffOf(hand);
    if (decision.focus === "both" && hand !== quarterHand) {
      return noteXml(w, 2, "half", v, s) + noteXml(up, 2, "half", v, s);
    }
    return (
      noteXml(w, 1, "quarter", v, s) +
      noteXml(up, 1, "quarter", v, s) +
      noteXml(w, 1, "quarter", v, s) +
      noteXml(down, 1, "quarter", v, s)
    );
  };

  const attributes = `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time>${
    grand
      ? `<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>`
      : `<clef><sign>G</sign><line>2</line></clef>`
  }</attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempoBpm}</per-minute></metronome></direction-type></direction>`;

  const out: string[] = [];
  for (let m = 0; m < measures; m++) {
    const body = grand
      ? `${handXml("right", m)}<backup><duration>4</duration></backup>${handXml("left", m)}`
      : handXml("right", m);
    const final =
      m === measures - 1 ? `<barline location="right"><bar-style>light-heavy</bar-style></barline>` : "";
    out.push(`<measure number="${m + 1}">${m === 0 ? attributes : ""}${body}${final}</measure>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work><work-title>Recovery Drill</work-title></work>
  <identification><encoding><software>Learnkeys drill generator</software></encoding></identification>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    ${out.join("\n    ")}
  </part>
</score-partwise>`;
}

/* ───────────── 4. validation ───────────── */

/** Cheap structural check: catches truncated or unbalanced model output. Not full schema validation. */
export function isLikelyValidPartwiseXml(xml: string): boolean {
  if (!xml.includes("<score-partwise")) return false;
  if (!xml.trim().endsWith("</score-partwise>")) return false;
  const openM = (xml.match(/<measure[\s>]/g) ?? []).length;
  const closeM = (xml.match(/<\/measure>/g) ?? []).length;
  if (openM === 0 || openM !== closeM) return false;
  const openN = (xml.match(/<note[\s>]/g) ?? []).length;
  const closeN = (xml.match(/<\/note>/g) ?? []).length;
  return openN === closeN;
}

type MeasureStats = { dur: [number, number]; pitched: [number, number] };

function measureStats(xml: string): MeasureStats[] | null {
  const measures = xml.match(/<measure[\s>][\s\S]*?<\/measure>/g) ?? [];
  const result: MeasureStats[] = [];
  for (const m of measures) {
    const stats: MeasureStats = { dur: [0, 0], pitched: [0, 0] };
    for (const n of m.match(/<note[\s>][\s\S]*?<\/note>/g) ?? []) {
      const staff = Number(/<staff>(\d+)<\/staff>/.exec(n)?.[1] ?? 1);
      if (staff !== 1 && staff !== 2) return null;
      const i = staff - 1;
      if (/<pitch>/.test(n)) stats.pitched[i] += 1;
      if (/<chord\s*\/>/.test(n) || /<grace[\s/>]/.test(n)) continue;
      stats.dur[i] += Number(/<duration>(\d+)<\/duration>/.exec(n)?.[1] ?? 0);
    }
    result.push(stats);
  }
  return result;
}

/**
 * Check that a drill really does what the decision says: two staves that line up,
 * and pitched notes only on the hand(s) being drilled. Model output has to pass this
 * or the caller falls back to the deterministic generator.
 */
export function isValidDrillXml(xml: string, decision: FocusDecision): boolean {
  if (!isLikelyValidPartwiseXml(xml)) return false;
  if (decision.layout === "treble_only") return true;
  if (!/<staves>\s*2\s*<\/staves>/.test(xml)) return false;

  const stats = measureStats(xml);
  if (!stats || stats.length === 0) return false;

  for (const m of stats) {
    if (m.dur[0] === 0 || m.dur[0] !== m.dur[1]) return false;
  }
  const rightPitched = stats.reduce((a, m) => a + m.pitched[0], 0);
  const leftPitched = stats.reduce((a, m) => a + m.pitched[1], 0);

  if (decision.focus === "left") return leftPitched > 0 && rightPitched === 0;
  if (decision.focus === "right") return rightPitched > 0 && leftPitched === 0;
  return rightPitched > 0 && leftPitched > 0;
}

/* ───────────── 5. OpenAI prompt (grand staff) ───────────── */

export function buildGrandStaffSystemPrompt(decision: FocusDecision): string {
  const rest = (staff: 1 | 2) =>
    `<note><rest measure="yes"/><duration>4</duration><voice>${staff}</voice><type>whole</type><staff>${staff}</staff></note>`;

  let handRule: string;
  if (decision.focus === "left") {
    handRule = `Only the LEFT hand plays. Staff 2 has quarter notes built around the left-hand weak notes, moving by step and returning to those notes repeatedly, the most-missed ones most often. Staff 1 must contain ONLY whole-measure rests, exactly: ${rest(1)}`;
  } else if (decision.focus === "right") {
    handRule = `Only the RIGHT hand plays. Staff 1 has quarter notes built around the right-hand weak notes, moving by step and returning to those notes repeatedly, the most-missed ones most often. Staff 2 must contain ONLY whole-measure rests, exactly: ${rest(2)}`;
  } else {
    const [leadStaff, otherStaff] = decision.lead === "right" ? [1, 2] : [2, 1];
    handRule = `Both hands play together. The ${decision.lead.toUpperCase()} hand (staff ${leadStaff}) needs the most work: it plays quarter notes around its weak notes. The other hand (staff ${otherStaff}) plays two half notes per measure around its own weak notes. Use stepwise motion and return to the weak notes often.`;
  }

  return `You are a piano pedagogy assistant that outputs ONLY valid MusicXML 3.1 (partwise), no prose, no markdown fences.
Write an 8-measure recovery drill in 4/4 and C major for ONE piano part "P1" on a grand staff: staff 1 is the right hand (treble clef), staff 2 is the left hand (bass clef).

Required structure:
- Root tag <score-partwise version="3.1"> with a <part-list> and one <part id="P1">.
- In measure 1, <attributes> contains, in this order: <divisions>1</divisions>, <key><fifths>0</fifths></key>, <time>, <staves>2</staves>, <clef number="1"> (G, line 2), <clef number="2"> (F, line 4).
- In every measure, write all staff 1 notes first (<voice>1</voice>, <staff>1</staff>), then <backup><duration>4</duration></backup>, then all staff 2 notes (<voice>2</voice>, <staff>2</staff>).
- divisions is 1, so a quarter is duration 1, a half is 2, a whole is 4. Each staff must total exactly 4 per measure.
- Every <note> lists, in order: <pitch> (or <rest/>), <duration>, <voice>, <type>, <staff>. No chords, ties, tuplets or grace notes.

Hand rule for this drill: ${handRule}

Use the given weak MIDI notes (higher timesMissed = more often). Output nothing except the XML document.`;
}

export function buildDrillUserPayload(
  weak: HandWeakNotes,
  decision: FocusDecision,
  tempoBpm: number,
  lessonTitle: string
) {
  const shape = (ws: WeakNote[]) =>
    ws.map((w) => ({ midi: w.midi, note: w.note, timesMissed: Math.max(1, Math.round(w.count)) }));
  return {
    focus: decision.focus,
    leadHand: decision.lead,
    weakNotes: { left: shape(weak.left), right: shape(weak.right) },
    tempoBpm,
    lessonTitle,
  };
}