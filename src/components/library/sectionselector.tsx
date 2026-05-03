"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface SectionRange {
  startBeat: number;
  endBeat: number;
}

interface UseSectionSelectorReturn {
  section: SectionRange;
  sectionRef: React.MutableRefObject<SectionRange>;
  setSection: (r: SectionRange) => void;
  drawSectionHighlight: (range: SectionRange) => void;
  clearSectionHighlight: () => void;
}

export function useSectionSelector(
  totalBeats: number,
  osmdRef: React.MutableRefObject<any>,
  beatCursorRef: React.MutableRefObject<any>
): UseSectionSelectorReturn {
  const [section, setSectionState] = useState<SectionRange>({ startBeat: 0, endBeat: 0 });
  const sectionRef = useRef<SectionRange>({ startBeat: 0, endBeat: 0 });

  const setSection = useCallback((r: SectionRange) => {
    sectionRef.current = r;
    setSectionState(r);
  }, []);

  const didInit = useRef(false);
  useEffect(() => {
    if (totalBeats > 0 && !didInit.current) {
      didInit.current = true;
      setSection({ startBeat: 0, endBeat: totalBeats });
    }
  }, [totalBeats, setSection]);

  const clearSectionHighlight = useCallback(() => {
    const svg = osmdRef.current?.drawer?.backend?.getSvgElement() as SVGSVGElement | null;
    if (!svg) return;
    svg.querySelectorAll(".custom-section-el").forEach((el) => el.remove());
  }, [osmdRef]);

  const drawSectionHighlight = useCallback(
    (range: SectionRange) => {
      clearSectionHighlight();

      const bc   = beatCursorRef.current;
      const osmd = osmdRef.current;
      const svg  = osmd?.drawer?.backend?.getSvgElement() as SVGSVGElement | null;
      if (!bc || !svg || !osmd) return;

      const { startBeat, endBeat } = range;
      if (startBeat >= endBeat) return;

      const graphicSheet = osmd.GraphicSheet;
      const measureList  = graphicSheet?.MeasureList;
      if (!measureList) return;

      // ── Step 1: Build systemBoundsMap keyed by MusicSystem ───────────────────
      // Collects minY/maxY across ALL stave slots (treble + bass) per system row,
      // plus staveRightX for filling non-final rows to the edge.
      interface SystemBounds {
        minY: number;
        maxY: number;
        staveRightX: number;
      }
      const systemBoundsMap = new Map<any, SystemBounds>();

      for (let m = 0; m < measureList.length; m++) {
        const row = measureList[m];
        if (!row) continue;
        for (let s = 0; s < row.length; s++) {
          const ms = row[s];
          if (!ms) continue;
          const staffLine   = ms.parentStaffLine;
          const musicSystem =
            staffLine?.parentMusicSystem ??
            staffLine?.MusicSystem ??
            ms.parentMusicSystem ??
            ms.MusicSystem ??
            staffLine;
          if (!musicSystem) continue;

          for (const se of ms.staffEntries ?? []) {
            for (const gve of se.graphicalVoiceEntries ?? []) {
              for (const gn of gve.notes ?? []) {
                const vf    = Array.isArray(gn.vfnote) ? gn.vfnote[0] : gn.vfnote;
                const stave = vf?.stave;
                if (!stave || stave.y == null || stave.x == null) continue;

                const top    = stave.y;
                const bottom = stave.y + (stave.height ?? 0);
                const right  = stave.x + (stave.width ?? 0);

                const existing = systemBoundsMap.get(musicSystem);
                if (!existing) {
                  systemBoundsMap.set(musicSystem, { minY: top, maxY: bottom, staveRightX: right });
                } else {
                  if (top    < existing.minY)        existing.minY        = top;
                  if (bottom > existing.maxY)        existing.maxY        = bottom;
                  if (right  > existing.staveRightX) existing.staveRightX = right;
                }
              }
            }
          }
        }
      }

      // ── Step 2: Map each beat → { x, musicSystem } ───────────────────────────
      interface BeatPos { x: number; musicSystem: any; }
      const beatPositions: (BeatPos | null)[] = [];

      for (let i = 0; i < endBeat; i++) {
        const beat = bc.getBeatAt(i);
        if (!beat || beat.staffEntryX == null) { beatPositions.push(null); continue; }

        const row = measureList[beat.measureIndex];
        let musicSystem: any = null;
        if (row) {
          for (let s = 0; s < row.length; s++) {
            const ms = row[s];
            if (!ms) continue;
            const sl = ms.parentStaffLine;
            musicSystem =
              sl?.parentMusicSystem ??
              sl?.MusicSystem ??
              ms.parentMusicSystem ??
              ms.MusicSystem ??
              sl;
            if (musicSystem) break;
          }
        }
        beatPositions.push({ x: beat.staffEntryX as number, musicSystem });
      }

      // ── Step 3: Group beats into per-system row segments ─────────────────────
      interface RowSegment { musicSystem: any; minX: number; maxX: number; }
      const rowSegments: RowSegment[] = [];

      for (let i = startBeat; i < endBeat; i++) {
        const bp = beatPositions[i];
        if (!bp) continue;
        const last = rowSegments[rowSegments.length - 1];
        if (last && last.musicSystem === bp.musicSystem) {
          if (bp.x < last.minX) last.minX = bp.x;
          if (bp.x > last.maxX) last.maxX = bp.x;
        } else {
          rowSegments.push({ musicSystem: bp.musicSystem, minX: bp.x, maxX: bp.x });
        }
      }

      if (rowSegments.length === 0) return;

      const PAD_X = 10;
      const PAD_Y = 10;

      // Walk backwards from endBeat-1 to find the last beat that has
      // actual note content (isNoteStart), skipping barline/phantom beats.
      // These phantom beats can have an X one measure ahead of the last real note.
      let lastBeatX: number | null = null;
      for (let i = endBeat - 1; i >= startBeat; i--) {
        const b = bc.getBeatAt(i);
        if (b && beatPositions[i]?.x != null && b.isNoteStart && b.expectedNotes?.length > 0) {
          lastBeatX = beatPositions[i]!.x;
          break;
        }
      }
      // Fallback: any beat with an X if none had notes
      if (lastBeatX === null) {
        for (let i = endBeat - 1; i >= startBeat; i--) {
          if (beatPositions[i]?.x != null) { lastBeatX = beatPositions[i]!.x; break; }
        }
      }

      // ── Step 4: Draw one rect per row ─────────────────────────────────────────
      for (let ri = 0; ri < rowSegments.length; ri++) {
        const seg    = rowSegments[ri];
        const bounds = systemBoundsMap.get(seg.musicSystem);
        if (!bounds) continue;

        const isFirst = ri === 0;
        const isLast  = ri === rowSegments.length - 1;

        // LEFT: first note X of this section on this row (matches where cursor starts)
        const rectLeft = seg.minX - PAD_X;

        // RIGHT: last row → actual last beat X + pad. Other rows → full stave right edge.
        const endX      = lastBeatX ?? seg.maxX;
        const rectRight = isLast ? endX + PAD_X + 8 : bounds.staveRightX;

        // TOP/BOTTOM: span treble + bass together
        const rectTop    = bounds.minY - PAD_Y;
        const rectBottom = bounds.maxY + PAD_Y;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x",              rectLeft.toString());
        rect.setAttribute("y",              rectTop.toString());
        rect.setAttribute("width",          (rectRight - rectLeft).toString());
        rect.setAttribute("height",         (rectBottom - rectTop).toString());
        rect.setAttribute("fill",           "rgba(99,179,237,0.13)");
        rect.setAttribute("rx",             "4");
        rect.setAttribute("pointer-events", "none");
        rect.classList.add("custom-section-el");
        svg.insertBefore(rect, svg.firstChild);

        // Cyan start line — only on the very first row, only if not beat 0
        if (isFirst && startBeat > 0) {
          svg.appendChild(makeDashedLine(rectLeft, rectTop, rectBottom, "#38bdf8", "custom-section-el"));
          svg.appendChild(makeLabel(`▶ b${startBeat + 1}`, rectLeft + 4, rectTop + 14, "#38bdf8", "custom-section-el"));
        }

        // Pink end line — only on the very last row, at the true last beat X
        if (isLast) {
          const endLineX = endX + 8;
          svg.appendChild(makeDashedLine(endLineX, rectTop, rectBottom, "#f472b6", "custom-section-el"));
          svg.appendChild(makeLabel(`■ b${endBeat}`, endLineX + 4, rectTop + 14, "#f472b6", "custom-section-el"));
        }
      }
    },
    [osmdRef, beatCursorRef, clearSectionHighlight]
  );

  return { section, sectionRef, setSection, drawSectionHighlight, clearSectionHighlight };
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeDashedLine(x: number, y1: number, y2: number, color: string, cls: string): SVGLineElement {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x.toString()); line.setAttribute("y1", y1.toString());
  line.setAttribute("x2", x.toString()); line.setAttribute("y2", y2.toString());
  line.setAttribute("stroke", color); line.setAttribute("stroke-width", "2");
  line.setAttribute("stroke-dasharray", "6 4"); line.setAttribute("pointer-events", "none");
  line.classList.add(cls);
  return line;
}

function makeLabel(text: string, x: number, y: number, color: string, cls: string): SVGTextElement {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x.toString()); t.setAttribute("y", y.toString());
  t.setAttribute("fill", color); t.setAttribute("font-size", "11");
  t.setAttribute("font-family", "monospace"); t.setAttribute("font-weight", "bold");
  t.setAttribute("pointer-events", "none");
  t.classList.add(cls); t.textContent = text;
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionSelector UI Component
// ─────────────────────────────────────────────────────────────────────────────

interface SectionSelectorProps {
  totalBeats: number;
  section: SectionRange;
  setSection: (r: SectionRange) => void;
  onApply: (committed: SectionRange) => void;
  onReset: () => void;
  isPlaying: boolean;
  getMeasureForBeat?: (beat: number) => number;
}

export function SectionSelector({
  totalBeats, section, setSection, onApply, onReset, isPlaying, getMeasureForBeat,
}: SectionSelectorProps) {
  const [open, setOpen]         = useState(false);
  const [draft, setDraft]       = useState<SectionRange>(section);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const trackRef                = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(section); }, [section]);

  const pct         = (beat: number) => (totalBeats > 1 ? (beat / (totalBeats - 1)) * 100 : 0);
  const beatFromPct = (p: number) =>
    Math.max(0, Math.min(totalBeats - 1, Math.round((p / 100) * (totalBeats - 1))));

  const getClientPct = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const r = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const beat = beatFromPct(getClientPct(e.clientX));
    setDraft((prev) => dragging === "start"
      ? { startBeat: Math.min(beat, prev.endBeat - 1), endBeat: prev.endBeat }
      : { startBeat: prev.startBeat, endBeat: Math.max(beat + 1, prev.startBeat + 1) });
  }, [dragging, beatFromPct, getClientPct]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [dragging, onMouseMove, onMouseUp]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || !e.touches[0]) return;
    const beat = beatFromPct(getClientPct(e.touches[0].clientX));
    setDraft((prev) => dragging === "start"
      ? { startBeat: Math.min(beat, prev.endBeat - 1), endBeat: prev.endBeat }
      : { startBeat: prev.startBeat, endBeat: Math.max(beat + 1, prev.startBeat + 1) });
  }, [dragging, beatFromPct, getClientPct]);

  const onTouchEnd = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => { window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd); };
  }, [dragging, onTouchMove, onTouchEnd]);

  const handleApply = () => { setSection(draft); onApply(draft); setOpen(false); };
  const handleReset = () => {
    const full = { startBeat: 0, endBeat: totalBeats };
    setDraft(full); setSection(full); onReset(); setOpen(false);
  };

  const startPct      = pct(draft.startBeat);
  const endPct        = pct(Math.max(0, draft.endBeat - 1));
  const isCustom      = section.startBeat !== 0 || section.endBeat !== totalBeats;
  const durationBeats = draft.endBeat - draft.startBeat;
  const labelBeat     = (beat: number) =>
    getMeasureForBeat ? `M${getMeasureForBeat(beat)} (b${beat + 1})` : `Beat ${beat + 1}`;

  return (
    <>
      <button onClick={() => !isPlaying && setOpen((v) => !v)} disabled={isPlaying}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "8px",
          border: isCustom ? "1.5px solid #38bdf8" : "1.5px solid #334155",
          background: isCustom ? "rgba(56,189,248,0.12)" : "rgba(15,23,42,0.7)",
          color: isCustom ? "#38bdf8" : "#94a3b8",
          fontSize: "12px", fontFamily: "monospace", fontWeight: 700,
          cursor: isPlaying ? "not-allowed" : "pointer", opacity: isPlaying ? 0.5 : 1,
          transition: "all 0.2s", whiteSpace: "nowrap",
        }}>
        <span style={{ fontSize: "14px" }}>✂️</span>
        {isCustom ? `Section: b${section.startBeat + 1}–b${section.endBeat}` : "Select Section"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)",
          width: "min(520px,94vw)", background: "rgba(8,14,28,0.97)",
          border: "1px solid #1e3a5f", borderRadius: "16px", padding: "20px 24px",
          zIndex: 20000, boxShadow: "0 8px 40px rgba(0,0,0,0.7)", backdropFilter: "blur(16px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px", color: "#e2e8f0", letterSpacing: "0.08em" }}>
              ✂️ SECTION SELECTOR
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace", marginBottom: "8px" }}>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>▶ START: {labelBeat(draft.startBeat)}</span>
            <span style={{ color: "#94a3b8" }}>{durationBeats} beats</span>
            <span style={{ color: "#f472b6", fontWeight: 700 }}>END: {labelBeat(draft.endBeat - 1)} ■</span>
          </div>

          <div ref={trackRef} style={{
            position: "relative", height: "48px", borderRadius: "8px",
            background: "rgba(30,42,64,0.8)", border: "1px solid #1e3a5f",
            cursor: "crosshair", userSelect: "none", overflow: "visible",
          }}
            onMouseDown={(e) => {
              const p = getClientPct(e.clientX);
              setDragging(Math.abs(p - startPct) <= Math.abs(p - endPct) ? "start" : "end");
            }}>
            {Array.from({ length: Math.min(totalBeats, 64) }).map((_, i) => {
              const x = pct(Math.round((i / Math.min(totalBeats - 1, 63)) * (totalBeats - 1)));
              return <div key={i} style={{
                position: "absolute", left: `${x}%`, top: "50%", transform: "translate(-50%,-50%)",
                width: "1px", height: i % 4 === 0 ? "16px" : "8px", background: "#1e3a5f",
              }} />;
            })}
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: `${startPct}%`, width: `${endPct - startPct}%`,
              background: "linear-gradient(90deg,rgba(56,189,248,0.18),rgba(244,114,182,0.18))",
              borderTop: "2px solid rgba(56,189,248,0.4)", borderBottom: "2px solid rgba(244,114,182,0.4)",
            }} />
            <Handle pct={startPct} color="#38bdf8" label={`b${draft.startBeat + 1}`}
              onMouseDown={(e) => { e.stopPropagation(); setDragging("start"); }}
              onTouchStart={(e) => { e.stopPropagation(); setDragging("start"); }} />
            <Handle pct={endPct} color="#f472b6" label={`b${draft.endBeat}`}
              onMouseDown={(e) => { e.stopPropagation(); setDragging("end"); }}
              onTouchStart={(e) => { e.stopPropagation(); setDragging("end"); }} />
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
            <NumInput label="Start Beat" color="#38bdf8" value={draft.startBeat + 1}
              min={1} max={draft.endBeat} onChange={(v) => setDraft((p) => ({ ...p, startBeat: v - 1 }))} />
            <NumInput label="End Beat" color="#f472b6" value={draft.endBeat}
              min={draft.startBeat + 1} max={totalBeats} onChange={(v) => setDraft((p) => ({ ...p, endBeat: v }))} />
          </div>

          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.06em" }}>
              QUICK SELECT
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {getPresets(totalBeats).map((preset) => (
                <button key={preset.label} onClick={() => setDraft(preset.range)} style={{
                  padding: "4px 10px", borderRadius: "6px", border: "1px solid #1e3a5f",
                  background: isDraftEqual(draft, preset.range) ? "rgba(56,189,248,0.2)" : "rgba(15,23,42,0.6)",
                  color: isDraftEqual(draft, preset.range) ? "#38bdf8" : "#64748b",
                  fontSize: "11px", fontFamily: "monospace", cursor: "pointer",
                  fontWeight: isDraftEqual(draft, preset.range) ? 700 : 400, transition: "all 0.15s",
                }}>{preset.label}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={handleReset} style={{
              flex: 1, padding: "9px", borderRadius: "8px", border: "1px solid #334155",
              background: "rgba(15,23,42,0.8)", color: "#64748b",
              fontSize: "12px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer",
            }}>Reset (Full Piece)</button>
            <button onClick={handleApply} style={{
              flex: 2, padding: "9px", borderRadius: "8px", border: "none",
              background: "linear-gradient(90deg,#0ea5e9,#8b5cf6)", color: "#fff",
              fontSize: "12px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em",
            }}>▶ Apply & Practice This Section</button>
          </div>
        </div>
      )}
    </>
  );
}

function Handle({ pct, color, label, onMouseDown, onTouchStart }: {
  pct: number; color: string; label: string;
  onMouseDown: (e: React.MouseEvent) => void; onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{
      position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%,-50%)",
      width: "20px", height: "44px", borderRadius: "4px", background: color,
      cursor: "ew-resize", zIndex: 2, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "2px", boxShadow: `0 0 10px ${color}88`,
    }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: "2px", height: "8px", background: "rgba(0,0,0,0.5)", borderRadius: "1px" }} />
      ))}
      <div style={{
        position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
        fontSize: "10px", fontFamily: "monospace", color, fontWeight: 700, whiteSpace: "nowrap",
        background: "rgba(8,14,28,0.9)", padding: "1px 5px", borderRadius: "4px",
      }}>{label}</div>
    </div>
  );
}

function NumInput({ label, color, value, min, max, onChange }: {
  label: string; color: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "10px", fontFamily: "monospace", color, marginBottom: "4px", fontWeight: 700 }}>{label}</div>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= min && v <= max) onChange(v); }}
        style={{
          width: "100%", padding: "7px 10px", borderRadius: "7px", border: `1.5px solid ${color}44`,
          background: "rgba(15,23,42,0.8)", color, fontFamily: "monospace",
          fontSize: "14px", fontWeight: 700, outline: "none", boxSizing: "border-box",
        }} />
    </div>
  );
}

function getPresets(total: number): { label: string; range: SectionRange }[] {
  if (total <= 0) return [];
  const q = Math.floor(total / 4);
  const h = Math.floor(total / 2);
  return [
    { label: "Full",    range: { startBeat: 0,     endBeat: total } },
    { label: "First ½", range: { startBeat: 0,     endBeat: h } },
    { label: "Last ½",  range: { startBeat: h,     endBeat: total } },
    { label: "Q1",      range: { startBeat: 0,     endBeat: q } },
    { label: "Q2",      range: { startBeat: q,     endBeat: q * 2 } },
    { label: "Q3",      range: { startBeat: q * 2, endBeat: q * 3 } },
    { label: "Q4",      range: { startBeat: q * 3, endBeat: total } },
  ];
}

function isDraftEqual(a: SectionRange, b: SectionRange) {
  return a.startBeat === b.startBeat && a.endBeat === b.endBeat;
}