"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Download, X } from "lucide-react";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";
import {
  analysisLabelPlum,
  premiumAnalysisCard,
} from "@/features/ai-review/PianoAnalysisChrome";
import { triggerMxlDownload } from "@/lib/musicxml/buildMxl";

type SourceOption = {
  lessonUid: string;
  lessonTitle: string;
  lessonSource: string;
  lastSessionAt: string;
  recentScore: number | null;
};

type HandFocus = "left" | "right" | "both";

type RecoveryRow = {
  id: string;
  source_lesson_uid: string;
  source_lesson_title: string;
  source_lesson_source: string;
  title: string;
  created_at: string;
  meta?: { handReason?: string; handFocus?: HandFocus };
  // NEW (optional): needed for the stats row in the hero card.
  // The API must return these for the numbers to show up.
  high_score?: number | null;
  last_score?: number | null;
  times_played?: number | null;
};

/* ---------- helpers ---------- */

const HAND_LABEL: Record<HandFocus, string> = {
  left: "Left hand only",
  right: "Right hand only",
  both: "Both hands together",
};

// "Both hands · Playing the White Keys" -> "Playing the White Keys"
const stripHandPrefix = (t: string) =>
  t.replace(/^(both hands|left hand|right hand)( only)?\s*[·•\-–]\s*/i, "");

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
  `${fmtDate(iso)}, ${new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

/** Auto-pick the source lesson: the one with the lowest recent score, else the first. */
function pickSource(options: SourceOption[]): SourceOption | undefined {
  const scored = options.filter((o) => o.recentScore != null);
  if (scored.length === 0) return options[0];
  return scored.reduce((a, b) => ((b.recentScore as number) < (a.recentScore as number) ? b : a));
}

const goldButton =
  "rounded-full bg-[#D9A855] px-7 py-3 text-sm font-medium text-[#1F1A17] shadow-[0_8px_24px_rgba(217,168,85,0.35)] transition hover:brightness-105 disabled:opacity-50";
const outlineButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-2.5 text-[13px] text-[#1F1A17] transition hover:border-black/25";

function StaffPlaceholder() {
  const noteOffsets = [12, 19, 12, 19];
  return (
    <svg viewBox="0 0 380 150" className="w-full max-w-[380px]" aria-hidden>
      {[0, 70].map((y) => (
        <g key={y} transform={`translate(0 ${y})`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" x2="380" y1={10 + i * 7} y2={10 + i * 7} stroke="#D3CCBD" strokeWidth="1" />
          ))}
          {[66, 152, 238, 324].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={10 + noteOffsets[i]}
              rx="6"
              ry="4.5"
              fill="none"
              stroke="#BDB5A3"
              strokeDasharray="2 2"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/**
 * Recovery studio.
 * LessonPracticeWorkspace stays mounted the whole time (only wrapper classes change)
 * so play state / score / cursor survive entering and leaving fullscreen.
 */
export default function RecoveryLessonStudio() {
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [history, setHistory] = useState<RecoveryRow[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tempo, setTempo] = useState(72);
  const [handNote, setHandNote] = useState<string | null>(null);
  const [activeHand, setActiveHand] = useState<HandFocus | null>(null);

  const [musicXml, setMusicXml] = useState<string | null>(null);
  const [xmlRenderKey, setXmlRenderKey] = useState(0);
  const [activeRecoveryId, setActiveRecoveryId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("AI recovery drill");
  const [activeSource, setActiveSource] = useState("");
  const [activeDisplayFile, setActiveDisplayFile] = useState("recovery.mxl");
  const [lastMxlBase64, setLastMxlBase64] = useState<string | null>(null);

  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [loadLoading, setLoadLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // ids we already tried to auto-open, so a failed load can't loop
  const autoTried = useRef<Set<string>>(new Set());

  const lessonUidForSession =
    activeRecoveryId != null ? `recovery-gen-${activeRecoveryId}` : `recovery-draft-${pickSource(sourceOptions)?.lessonUid ?? "none"}`;

  const activeRow = history.find((h) => h.id === activeRecoveryId) ?? null;

  const xmlMeta = useMemo(() => {
    if (!musicXml) return { timeSig: null as string | null, bpm: tempo };
    const ts = musicXml.match(/<beats>(\d+)<\/beats>\s*<beat-type>(\d+)<\/beat-type>/);
    const bpm = musicXml.match(/<per-minute>(\d+)/) ?? musicXml.match(/tempo="(\d+)/);
    return { timeSig: ts ? `${ts[1]}/${ts[2]}` : null, bpm: bpm ? Number(bpm[1]) : tempo };
  }, [musicXml, tempo]);

  // Nudge OSMD to re-measure when toggling fullscreen.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
    return () => cancelAnimationFrame(id);
  }, [isFullscreen]);

  // Lock page scroll while fullscreen, Escape exits.
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen]);

  const refreshContext = useCallback(async () => {
    setContextLoading(true);
    setContextError(null);
    try {
      const res = await fetch("/api/recovery-lessons", { credentials: "include" });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        sourceOptions?: SourceOption[];
        recoveryLessons?: RecoveryRow[];
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `Load failed (${res.status})`);
      }
      setSourceOptions(data.sourceOptions ?? []);
      setHistory(data.recoveryLessons ?? []);
    } catch (e) {
      setContextError(e instanceof Error ? e.message : "Failed to load recovery context");
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  // Open the newest saved drill automatically so the screen is never empty when drills exist.
  useEffect(() => {
    if (contextLoading || musicXml || loadLoading || genLoading || history.length === 0) return;
    const first = history[0];
    if (autoTried.current.has(first.id)) return;
    autoTried.current.add(first.id);
    void loadHistoryItem(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, contextLoading, musicXml, loadLoading, genLoading]);

  function clearActiveDrill() {
    setMusicXml(null);
    setActiveRecoveryId(null);
    setActiveTitle("AI recovery drill");
    setActiveSource("");
    setActiveDisplayFile("recovery.mxl");
    setLastMxlBase64(null);
    setIsFullscreen(false);
    setHandNote(null);
    setActiveHand(null);
  }

  async function generateDrill() {
    const opt = pickSource(sourceOptions);
    if (!opt) {
      setGenError("Play a lesson first, then come back to build a drill.");
      return;
    }
    setGenError(null);
    setGenLoading(true);
    try {
      const res = await fetch("/api/practice/generate-recovery", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonUid: opt.lessonUid,
          lessonTitle: opt.lessonTitle ?? "",
          lessonSource: opt.lessonSource ?? "",
          baseFileName: null,
          tempoBpm: tempo,
          currentSessionMistakes: [],
          handFocus: "auto",
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        code?: string;
        musicXml?: string;
        mxlBase64?: string;
        fileName?: string;
        recoveryLessonId?: string | null;
        title?: string;
        handFocus?: HandFocus;
        handReason?: string;
      };
      if (!res.ok || !data.ok || !data.musicXml) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      const baseTitle = data.title ?? `Recovery · ${opt.lessonTitle || opt.lessonUid}`;

      setMusicXml(data.musicXml);
      setHandNote(data.handReason ?? null);
      setActiveHand(data.handFocus ?? null);
      setXmlRenderKey((k) => k + 1);
      setIsFullscreen(false);
      if (data.mxlBase64) setLastMxlBase64(data.mxlBase64);

      if (data.recoveryLessonId) {
        setActiveRecoveryId(data.recoveryLessonId);
        setActiveTitle(baseTitle);
      } else {
        setActiveRecoveryId(null);
        setActiveTitle(`${baseTitle} (unsaved)`);
      }
      setActiveSource(opt.lessonSource ?? "Practice");
      setActiveDisplayFile(data.fileName ?? "recovery.mxl");

      if (data.mxlBase64 && data.fileName) {
        triggerMxlDownload(data.mxlBase64, data.fileName);
      }

      void refreshContext();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenLoading(false);
    }
  }

  async function loadHistoryItem(id: string) {
    setLoadLoading(id);
    setGenError(null);
    try {
      const res = await fetch(`/api/recovery-lessons/${id}`, { credentials: "include" });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        lesson?: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta: any;
          id: string;
          title: string;
          sourceLessonUid: string;
          musicXml: string;
          downloadFileName?: string;
          mxlBase64?: string;
        };
      };
      if (!res.ok || !data.ok || !data.lesson?.musicXml) {
        throw new Error(data.message || `Load failed (${res.status})`);
      }
      const L = data.lesson;
      setMusicXml(L.musicXml);
      setXmlRenderKey((k) => k + 1);
      setIsFullscreen(false);
      setActiveRecoveryId(L.id);
      setActiveTitle(L.title);
      setActiveSource("Recovery");
      setActiveDisplayFile(L.downloadFileName ?? `recovery-${L.id.slice(0, 8)}.mxl`);
      setLastMxlBase64(L.mxlBase64 ?? null);
      setHandNote(L.meta?.handReason ?? null);
      setActiveHand((L.meta?.handFocus as HandFocus | undefined) ?? null);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to open saved drill");
    } finally {
      setLoadLoading(null);
    }
  }

  async function deleteHistoryItem(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    const row = history.find((h) => h.id === id);
    const label = row?.title ?? "this recovery drill";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setDeleteLoading(id);
    setGenError(null);
    try {
      const res = await fetch(`/api/recovery-lessons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.message || `Delete failed (${res.status})`);
      }
      if (activeRecoveryId === id) {
        clearActiveDrill();
      }
      await refreshContext();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to delete drill");
    } finally {
      setDeleteLoading(null);
    }
  }

  async function downloadCurrentMxl() {
    if (lastMxlBase64 && activeDisplayFile) {
      triggerMxlDownload(lastMxlBase64, activeDisplayFile);
      return;
    }
    if (!activeRecoveryId) return;
    try {
      const res = await fetch(`/api/recovery-lessons/${activeRecoveryId}`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        lesson?: { mxlBase64?: string; downloadFileName?: string };
      };
      if (data.ok && data.lesson?.mxlBase64) {
        setLastMxlBase64(data.lesson.mxlBase64);
        triggerMxlDownload(
          data.lesson.mxlBase64,
          data.lesson.downloadFileName ?? activeDisplayFile,
        );
      }
    } catch {
      setGenError("Could not build MXL download");
    }
  }

  const playerWrapperClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : `${premiumAnalysisCard} p-5`;

  const canDownload = Boolean(lastMxlBase64 || activeRecoveryId);
  const hasDrill = Boolean(musicXml);

  const stats = [
    { label: "High score", value: activeRow?.high_score },
    { label: "Last score", value: activeRow?.last_score },
    { label: "Times played", value: activeRow?.times_played },
  ];

  return (
    <div className="pb-16 pt-8 md:pt-10">
      {/* ---------- page header ---------- */}
      <div className="mx-auto mb-5 flex max-w-5xl items-end justify-between gap-4 px-4 lg:px-6">
        <div>
          <p className={analysisLabelPlum}>RECOVERY</p>
          <h1 className="mt-1 font-playfair text-[34px] font-bold leading-none tracking-tight text-[#1F1A17] md:text-[44px]">
            Recovery studio
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void refreshContext()}
          className="shrink-0 rounded-full bg-[#17181C] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-black"
        >
          Refresh history
        </button>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 lg:px-6">
        {/* ---------- hero card ---------- */}
        <div
          className={`${premiumAnalysisCard} flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center md:px-8 md:py-7`}
        >
          {contextLoading && !hasDrill ? (
            <div className="w-full animate-pulse space-y-3">
              <div className="h-5 w-24 rounded-full bg-neutral-100" />
              <div className="h-7 w-72 rounded bg-neutral-100" />
              <div className="h-3 w-96 max-w-full rounded bg-neutral-100" />
            </div>
          ) : hasDrill ? (
            <>
              <div className="min-w-0">
                {activeHand ? (
                  <span
                    title={handNote ?? undefined}
                    className="inline-block rounded-full bg-[#F3EADB] px-3 py-1 text-[11px] font-medium text-[#6B5B3E]"
                  >
                    {HAND_LABEL[activeHand]}
                  </span>
                ) : null}
                <h2 className="mt-3 font-playfair text-[28px] font-semibold leading-tight text-[#1F1A17]">
                  {stripHandPrefix(activeTitle)}
                </h2>
                <p className="mt-1 text-[12px] text-[#7a756f]">
                  {[
                    activeRow ? `Made ${fmtDate(activeRow.created_at)}` : "Not saved yet",
                    xmlMeta.timeSig,
                    `tempo ${xmlMeta.bpm}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {activeRow ? (
                  <div className="mt-5 flex gap-10">
                    {stats.map((s) => (
                      <div key={s.label}>
                        <p className="text-[28px] font-bold leading-none tabular-nums text-[#1F1A17]">
                          {s.value ?? "—"}
                        </p>
                        <p className="mt-1.5 text-[11px] text-[#7a756f]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col gap-2 md:w-[210px]">
                <button type="button" onClick={() => setIsFullscreen(true)} className={goldButton}>
                  Start practice →
                </button>
                {canDownload ? (
                  <button type="button" onClick={() => void downloadCurrentMxl()} className={outlineButton}>
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download .mxl
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <span className="inline-block rounded-full bg-[#F3EADB] px-3 py-1 text-[11px] font-medium text-[#6B5B3E]">
                  No drills yet
                </span>
                <h2 className="mt-3 font-playfair text-[28px] font-semibold leading-tight text-[#1F1A17]">
                  Make your first recovery drill
                </h2>
                <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-[#5D5D5D]">
                  A drill is a short piece built from the notes you miss most. We choose the lesson
                  and the weaker hand for you, so you only need one tap.
                </p>
                {contextError ? <p className="mt-2 text-xs text-red-600">{contextError}</p> : null}
                {genError ? <p className="mt-2 text-xs text-red-600">{genError}</p> : null}
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={genLoading || sourceOptions.length === 0}
                  onClick={() => void generateDrill()}
                  className={goldButton}
                >
                  {genLoading ? "Generating…" : "Generate recovery drill"}
                </button>
                <p className="text-[11px] text-[#7a756f]">
                  {sourceOptions.length === 0 && !contextLoading
                    ? "Play a lesson first"
                    : "Takes a few seconds"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ---------- drills + preview ---------- */}
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          {/* drills list */}
          <aside className={`${premiumAnalysisCard} p-5`}>
            <div className="flex items-center justify-between">
              <p className={analysisLabelPlum}>YOUR DRILLS</p>
              {hasDrill ? (
                <button
                  type="button"
                  disabled={genLoading || sourceOptions.length === 0}
                  onClick={() => void generateDrill()}
                  className="text-[11px] font-medium text-[#A77C2B] hover:underline disabled:opacity-50"
                >
                  {genLoading ? "Generating…" : "+ New drill"}
                </button>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-[#E6DCC6] bg-[#FAF6EE] p-3">
              {history.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm font-semibold text-[#1F1A17]">Nothing here yet</p>
                  <p className="mx-auto mt-2 max-w-[200px] text-[11px] leading-relaxed text-[#6B6259]">
                    Drills you make will be listed here, newest first.
                  </p>
                </div>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {history.map((h) => {
                    const active = activeRecoveryId === h.id;
                    return (
                      <li key={h.id}>
                        <button
                          type="button"
                          disabled={loadLoading === h.id || deleteLoading === h.id}
                          onClick={() => void loadHistoryItem(h.id)}
                          className={`w-full rounded-xl bg-white px-3.5 py-2.5 text-left transition disabled:opacity-60 ${
                            active
                              ? "border-2 border-[#D9A855]"
                              : "border border-black/[0.06] hover:border-[#D9A855]/60"
                          }`}
                        >
                          <span className="block text-[13px] font-medium text-[#1F1A17]">
                            {h.title}
                          </span>
                          <span className="mt-0.5 block text-[10.5px] text-[#7a756f]">
                            {fmtDateTime(h.created_at)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {activeRecoveryId ? (
              <button
                type="button"
                disabled={deleteLoading === activeRecoveryId}
                onClick={() => void deleteHistoryItem(activeRecoveryId)}
                className="mx-auto mt-4 block text-[12px] text-[#C0392B] underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
              >
                Delete selected drill
              </button>
            ) : null}
            {hasDrill && genError ? <p className="mt-3 text-center text-xs text-red-600">{genError}</p> : null}
          </aside>

          {/* sheet preview */}
          <section className="min-w-0">
            {!hasDrill ? (
              <div className={`${premiumAnalysisCard} p-5`}>
                <p className={analysisLabelPlum}>MUSIC SHEET PREVIEW</p>
                <div className="mt-4 flex min-h-[270px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E6DCC6] bg-[#FAF6EE] px-6 py-10 text-center">
                  <StaffPlaceholder />
                  <p className="mt-8 text-sm font-semibold text-[#1F1A17]">
                    Your music sheet will appear here
                  </p>
                  <p className="mt-1.5 text-[11px] text-[#6B6259]">
                    After you generate a drill, you can read it, practice it and download it.
                  </p>
                </div>
              </div>
            ) : (
              <div className={playerWrapperClass}>
                {/* header row (same slot in both modes) */}
                {isFullscreen ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-[#FAF6EE] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setIsFullscreen(false)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1A17] hover:border-black/25"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Back to studio
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      {canDownload ? (
                        <button
                          type="button"
                          onClick={() => void downloadCurrentMxl()}
                          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1A17] hover:border-black/25"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          Download .mxl
                        </button>
                      ) : null}
                      {activeRecoveryId ? (
                        <button
                          type="button"
                          disabled={deleteLoading === activeRecoveryId}
                          onClick={() => void deleteHistoryItem(activeRecoveryId)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete drill
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className={analysisLabelPlum}>MUSIC SHEET PREVIEW</p>
                    <p className="text-[11px] text-[#7a756f]">Scroll the sheet to see all lines</p>
                  </div>
                )}

                <div
                  className={
                    isFullscreen
                      ? "min-h-0 flex-1 overflow-y-auto"
                      : "mt-4 overflow-hidden rounded-2xl border border-[#EFE7D6] bg-[#FAF6EE]"
                  }
                >
                  <LessonPracticeWorkspace
                    cdnFileName={null}
                    fkid=""
                    externalXml={musicXml}
                    xmlRenderKey={xmlRenderKey}
                    courseTitle={activeTitle}
                    lessonSource={activeSource}
                    lessonId={activeRecoveryId ?? "draft"}
                    displayFileName={activeDisplayFile}
                    lessonUid={lessonUidForSession}
                    sessionCategory="recovery_drill"
                    onPlaybackStart={() => setIsFullscreen(true)}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}