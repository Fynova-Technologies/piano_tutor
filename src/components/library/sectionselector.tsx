// ── SectionSelector.tsx ────────────────────────────────────────────────────
// Drop-in component + hook for selecting & highlighting a custom beat range.
// Usage:
//   1. Import SectionSelector and useSectionSelector.
//   2. Call useSectionSelector(totalBeats) in LibraryPlayerContent.
//   3. Render <SectionSelector ... /> wherever you like.
//   4. Replace segmentEndBeatRef.current with section.endBeat
//      and add section.startBeat wherever playback resets.

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionRange {
  startBeat: number;
  endBeat: number;   // exclusive upper-bound (same semantics as segmentEndBeat)
}

interface UseSectionSelectorReturn {
  section: SectionRange;
  setSection: (r: SectionRange) => void;
  /** Call after OSMD renders to overlay the highlight on the SVG. */
  drawSectionHighlight: () => void;
  /** Remove highlight SVG elements (call before redrawing or on reset). */
  clearSectionHighlight: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSectionSelector(
  totalBeats: number,
  osmdRef: React.MutableRefObject<any>,
  beatCursorRef: React.MutableRefObject<any>
): UseSectionSelectorReturn {
  const [section, setSection] = useState<SectionRange>({ startBeat: 0, endBeat: totalBeats });

  // Keep endBeat in sync when totalBeats loads for the first time
  const didInit = useRef(false);
  useEffect(() => {
    if (totalBeats > 0 && !didInit.current) {
      didInit.current = true;
      setSection({ startBeat: 0, endBeat: totalBeats });
    }
  }, [totalBeats]);

  const clearSectionHighlight = useCallback(() => {
    const svg = osmdRef.current?.drawer?.backend?.getSvgElement() as SVGSVGElement | null;
    if (!svg) return;
    svg.querySelectorAll(".custom-section-el").forEach((el) => el.remove());
  }, [osmdRef]);

  const drawSectionHighlight = useCallback(() => {
    clearSectionHighlight();
    const bc  = beatCursorRef.current;
    const svg = osmdRef.current?.drawer?.backend?.getSvgElement() as SVGSVGElement | null;
    if (!bc || !svg) return;

    const { startBeat, endBeat } = section;
    if (startBeat >= endBeat) return;

    // Gather X positions for start & end beats
    const getX = (index: number): number | null => {
      for (let i = index; i >= 0; i--) {
        const x = bc.getBeatAt(i)?.staffEntryX;
        if (x != null) return x as number;
      }
      return null;
    };

    const x1 = getX(startBeat);
    const x2 = getX(endBeat - 1);
    if (x1 === null || x2 === null) return;

    const svgH = svg.viewBox?.baseVal?.height || svg.getBoundingClientRect().height;
    const PAD  = 20;
    const left  = x1 - PAD;
    const width = x2 - x1 + PAD * 2 + 18; // +18 mirrors drawSegmentOverlay offset

    // ── Shaded region ───────────────────────────────────────────────────────
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x",              left.toString());
    rect.setAttribute("y",              "0");
    rect.setAttribute("width",          width.toString());
    rect.setAttribute("height",         svgH.toString());
    rect.setAttribute("fill",           "rgba(99, 179, 237, 0.12)");
    rect.setAttribute("pointer-events", "none");
    rect.classList.add("custom-section-el");
    svg.insertBefore(rect, svg.firstChild); // render behind notes

    // ── Start boundary line ─────────────────────────────────────────────────
    const startLine = makeLine(left + PAD, svgH, "#38bdf8", "custom-section-el");
    svg.appendChild(startLine);

    // ── End boundary line ───────────────────────────────────────────────────
    const endLine = makeLine(left + width - PAD, svgH, "#f472b6", "custom-section-el");
    svg.appendChild(endLine);

    // ── Start label ─────────────────────────────────────────────────────────
    svg.appendChild(makeLabel(`▶ Beat ${startBeat + 1}`, left + PAD + 4, 14, "#38bdf8", "custom-section-el"));
    svg.appendChild(makeLabel(`■ Beat ${endBeat}`, left + width - PAD + 4, 14, "#f472b6", "custom-section-el"));
  }, [section, osmdRef, beatCursorRef, clearSectionHighlight]);

  return { section, setSection, drawSectionHighlight, clearSectionHighlight };
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeLine(x: number, svgH: number, color: string, cls: string): SVGLineElement {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x.toString());
  line.setAttribute("y1", "0");
  line.setAttribute("x2", x.toString());
  line.setAttribute("y2", svgH.toString());
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", "2.5");
  line.setAttribute("stroke-dasharray", "6 4");
  line.setAttribute("pointer-events", "none");
  line.classList.add(cls);
  return line;
}

function makeLabel(text: string, x: number, y: number, color: string, cls: string): SVGTextElement {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x.toString());
  t.setAttribute("y", y.toString());
  t.setAttribute("fill", color);
  t.setAttribute("font-size", "11");
  t.setAttribute("font-family", "monospace");
  t.setAttribute("font-weight", "bold");
  t.setAttribute("pointer-events", "none");
  t.classList.add(cls);
  t.textContent = text;
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionSelector UI Component
// ─────────────────────────────────────────────────────────────────────────────

interface SectionSelectorProps {
  totalBeats: number;
  section: SectionRange;
  setSection: (r: SectionRange) => void;
  onApply: () => void;          // called after user confirms — redraws highlight
  onReset: () => void;          // resets to full piece
  isPlaying: boolean;
  /** Optional: map beat index → measure number for display */
  getMeasureForBeat?: (beat: number) => number;
}

export function SectionSelector({
  totalBeats,
  section,
  setSection,
  onApply,
  onReset,
  isPlaying,
  getMeasureForBeat,
}: SectionSelectorProps) {
  const [open, setOpen]       = useState(false);
  const [draft, setDraft]     = useState<SectionRange>(section);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const trackRef              = useRef<HTMLDivElement>(null);

  // Sync draft with external section changes
  useEffect(() => { setDraft(section); }, [section]);

  const pct = (beat: number) =>
    totalBeats > 1 ? (beat / (totalBeats - 1)) * 100 : 0;

  const beatFromPct = (p: number) =>
    Math.max(0, Math.min(totalBeats - 1, Math.round((p / 100) * (totalBeats - 1))));

  const getClientPct = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const beat = beatFromPct(getClientPct(e.clientX));
    setDraft((prev) => {
      if (dragging === "start") {
        return { startBeat: Math.min(beat, prev.endBeat - 1), endBeat: prev.endBeat };
      } else {
        return { startBeat: prev.startBeat, endBeat: Math.max(beat + 1, prev.startBeat + 1) };
      }
    });
  }, [dragging, beatFromPct, getClientPct]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup",   onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  // Touch support
  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || !e.touches[0]) return;
    const beat = beatFromPct(getClientPct(e.touches[0].clientX));
    setDraft((prev) =>
      dragging === "start"
        ? { startBeat: Math.min(beat, prev.endBeat - 1), endBeat: prev.endBeat }
        : { startBeat: prev.startBeat, endBeat: Math.max(beat + 1, prev.startBeat + 1) }
    );
  }, [dragging, beatFromPct, getClientPct]);

  const onTouchEnd = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend",  onTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onTouchEnd);
    };
  }, [dragging, onTouchMove, onTouchEnd]);

  const handleApply = () => {
    setSection(draft);
    onApply();
    setOpen(false);
  };

  const handleReset = () => {
    const full: SectionRange = { startBeat: 0, endBeat: totalBeats };
    setDraft(full);
    setSection(full);
    onReset();
    setOpen(false);
  };

  const startPct = pct(draft.startBeat);
  const endPct   = pct(Math.max(0, draft.endBeat - 1));
  const isCustom = section.startBeat !== 0 || section.endBeat !== totalBeats;
  const durationBeats = draft.endBeat - draft.startBeat;

  const labelBeat = (beat: number) =>
    getMeasureForBeat
      ? `M${getMeasureForBeat(beat)} (b${beat + 1})`
      : `Beat ${beat + 1}`;

  return (
    <>
      {/* ── Trigger Button ──────────────────────────────────────────────────── */}
      <button
        onClick={() => !isPlaying && setOpen((v) => !v)}
        disabled={isPlaying}
        title={isPlaying ? "Stop playback to edit sections" : "Select section to practice"}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            "6px",
          padding:        "6px 14px",
          borderRadius:   "8px",
          border:         isCustom ? "1.5px solid #38bdf8" : "1.5px solid #334155",
          background:     isCustom ? "rgba(56,189,248,0.12)" : "rgba(15,23,42,0.7)",
          color:          isCustom ? "#38bdf8" : "#94a3b8",
          fontSize:       "12px",
          fontFamily:     "monospace",
          fontWeight:     700,
          cursor:         isPlaying ? "not-allowed" : "pointer",
          opacity:        isPlaying ? 0.5 : 1,
          transition:     "all 0.2s",
          whiteSpace:     "nowrap",
        }}
      >
        <span style={{ fontSize: "14px" }}>✂️</span>
        {isCustom
          ? `Section: b${section.startBeat + 1}–b${section.endBeat}`
          : "Select Section"}
      </button>

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position:     "fixed",
            bottom:       "90px",
            left:         "50%",
            transform:    "translateX(-50%)",
            width:        "min(520px, 94vw)",
            background:   "rgba(8, 14, 28, 0.97)",
            border:       "1px solid #1e3a5f",
            borderRadius: "16px",
            padding:      "20px 24px",
            zIndex:       20000,
            boxShadow:    "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,189,248,0.1)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px", color: "#e2e8f0", letterSpacing: "0.08em" }}>
              ✂️ SECTION SELECTOR
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Beat labels */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "monospace", marginBottom: "8px" }}>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>▶ START: {labelBeat(draft.startBeat)}</span>
            <span style={{ color: "#94a3b8" }}>{durationBeats} beats</span>
            <span style={{ color: "#f472b6", fontWeight: 700 }}>END: {labelBeat(draft.endBeat - 1)} ■</span>
          </div>

          {/* Track */}
          <div
            ref={trackRef}
            style={{
              position:     "relative",
              height:       "48px",
              borderRadius: "8px",
              background:   "rgba(30,42,64,0.8)",
              border:       "1px solid #1e3a5f",
              cursor:       "crosshair",
              userSelect:   "none",
              overflow:     "visible",
            }}
            onMouseDown={(e) => {
              const p    = getClientPct(e.clientX);
              const beat = beatFromPct(p);
              // Snap to nearest handle
              const dStart = Math.abs(p - startPct);
              const dEnd   = Math.abs(p - endPct);
              setDragging(dStart <= dEnd ? "start" : "end");
            }}
          >
            {/* Background ticks */}
            {Array.from({ length: Math.min(totalBeats, 64) }).map((_, i) => {
              const x = pct(Math.round((i / Math.min(totalBeats - 1, 63)) * (totalBeats - 1)));
              return (
                <div
                  key={i}
                  style={{
                    position:  "absolute",
                    left:      `${x}%`,
                    top:       "50%",
                    transform: "translate(-50%, -50%)",
                    width:     "1px",
                    height:    i % 4 === 0 ? "16px" : "8px",
                    background: "#1e3a5f",
                  }}
                />
              );
            })}

            {/* Selected range fill */}
            <div style={{
              position:  "absolute",
              top:       0,
              bottom:    0,
              left:      `${startPct}%`,
              width:     `${endPct - startPct}%`,
              background:"linear-gradient(90deg, rgba(56,189,248,0.18), rgba(244,114,182,0.18))",
              borderTop:  "2px solid rgba(56,189,248,0.4)",
              borderBottom: "2px solid rgba(244,114,182,0.4)",
            }} />

            {/* Start handle */}
            <Handle
              pct={startPct}
              color="#38bdf8"
              label={`b${draft.startBeat + 1}`}
              side="left"
              onMouseDown={(e) => { e.stopPropagation(); setDragging("start"); }}
              onTouchStart={(e) => { e.stopPropagation(); setDragging("start"); }}
            />

            {/* End handle */}
            <Handle
              pct={endPct}
              color="#f472b6"
              label={`b${draft.endBeat}`}
              side="right"
              onMouseDown={(e) => { e.stopPropagation(); setDragging("end"); }}
              onTouchStart={(e) => { e.stopPropagation(); setDragging("end"); }}
            />
          </div>

          {/* Numeric inputs */}
          <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
            <NumInput
              label="Start Beat"
              color="#38bdf8"
              value={draft.startBeat + 1}
              min={1}
              max={draft.endBeat}
              onChange={(v) => setDraft((p) => ({ ...p, startBeat: v - 1 }))}
            />
            <NumInput
              label="End Beat"
              color="#f472b6"
              value={draft.endBeat}
              min={draft.startBeat + 1}
              max={totalBeats}
              onChange={(v) => setDraft((p) => ({ ...p, endBeat: v }))}
            />
          </div>

          {/* Quick-select presets */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.06em" }}>
              QUICK SELECT
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {getPresets(totalBeats).map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setDraft(preset.range)}
                  style={{
                    padding:      "4px 10px",
                    borderRadius: "6px",
                    border:       "1px solid #1e3a5f",
                    background:   isDraftEqual(draft, preset.range) ? "rgba(56,189,248,0.2)" : "rgba(15,23,42,0.6)",
                    color:        isDraftEqual(draft, preset.range) ? "#38bdf8" : "#64748b",
                    fontSize:     "11px",
                    fontFamily:   "monospace",
                    cursor:       "pointer",
                    fontWeight:   isDraftEqual(draft, preset.range) ? 700 : 400,
                    transition:   "all 0.15s",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button
              onClick={handleReset}
              style={{
                flex:         1,
                padding:      "9px",
                borderRadius: "8px",
                border:       "1px solid #334155",
                background:   "rgba(15,23,42,0.8)",
                color:        "#64748b",
                fontSize:     "12px",
                fontFamily:   "monospace",
                fontWeight:   700,
                cursor:       "pointer",
              }}
            >
              Reset (Full Piece)
            </button>
            <button
              onClick={handleApply}
              style={{
                flex:         2,
                padding:      "9px",
                borderRadius: "8px",
                border:       "none",
                background:   "linear-gradient(90deg, #0ea5e9, #8b5cf6)",
                color:        "#fff",
                fontSize:     "12px",
                fontFamily:   "monospace",
                fontWeight:   700,
                cursor:       "pointer",
                letterSpacing: "0.05em",
              }}
            >
              ▶ Apply & Practice This Section
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Handle({
  pct, color, label, side, onMouseDown, onTouchStart,
}: {
  pct: number; color: string; label: string; side: "left" | "right";
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position:     "absolute",
        left:         `${pct}%`,
        top:          "50%",
        transform:    "translate(-50%, -50%)",
        width:        "20px",
        height:       "44px",
        borderRadius: "4px",
        background:   color,
        cursor:       "ew-resize",
        zIndex:       2,
        display:      "flex",
        flexDirection:"column",
        alignItems:   "center",
        justifyContent: "center",
        gap:          "2px",
        boxShadow:    `0 0 10px ${color}88`,
      }}
    >
      {[0,1,2].map((i) => (
        <div key={i} style={{ width: "2px", height: "8px", background: "rgba(0,0,0,0.5)", borderRadius: "1px" }} />
      ))}
      <div style={{
        position:   "absolute",
        top:        "calc(100% + 4px)",
        left:       "50%",
        transform:  "translateX(-50%)",
        fontSize:   "10px",
        fontFamily: "monospace",
        color,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: "rgba(8,14,28,0.9)",
        padding:    "1px 5px",
        borderRadius: "4px",
      }}>
        {label}
      </div>
    </div>
  );
}

function NumInput({
  label, color, value, min, max, onChange,
}: {
  label: string; color: string; value: number;
  min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "10px", fontFamily: "monospace", color, marginBottom: "4px", fontWeight: 700 }}>
        {label}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= min && v <= max) onChange(v);
        }}
        style={{
          width:        "100%",
          padding:      "7px 10px",
          borderRadius: "7px",
          border:       `1.5px solid ${color}44`,
          background:   "rgba(15,23,42,0.8)",
          color,
          fontFamily:   "monospace",
          fontSize:     "14px",
          fontWeight:   700,
          outline:      "none",
          boxSizing:    "border-box",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getPresets(total: number): { label: string; range: SectionRange }[] {
  if (total <= 0) return [];
  const q = Math.floor(total / 4);
  const h = Math.floor(total / 2);
  return [
    { label: "Full",    range: { startBeat: 0, endBeat: total } },
    { label: "First ½", range: { startBeat: 0, endBeat: h } },
    { label: "Last ½",  range: { startBeat: h, endBeat: total } },
    { label: "Q1",      range: { startBeat: 0, endBeat: q } },
    { label: "Q2",      range: { startBeat: q, endBeat: q * 2 } },
    { label: "Q3",      range: { startBeat: q * 2, endBeat: q * 3 } },
    { label: "Q4",      range: { startBeat: q * 3, endBeat: total } },
  ];
}

function isDraftEqual(a: SectionRange, b: SectionRange) {
  return a.startBeat === b.startBeat && a.endBeat === b.endBeat;
}