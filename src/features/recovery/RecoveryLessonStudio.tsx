"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";
import {
  analysisAccentGradient,
  analysisCodeBg,
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

type RecoveryRow = {
  id: string;
  source_lesson_uid: string;
  source_lesson_title: string;
  source_lesson_source: string;
  title: string;
  created_at: string;
  meta: unknown;
};

/**
 * --- Recovery lesson generation (client) ---
 * Calls POST /api/practice/generate-recovery; MusicXML is validated server-side before response.
 * --- OSMD rendering integration ---
 * `LessonPracticeWorkspace` loads validated `musicXml` with an incremented `xmlRenderKey` for reliable remount.
 */
export default function RecoveryLessonStudio() {
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [history, setHistory] = useState<RecoveryRow[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const [selectedUid, setSelectedUid] = useState("");
  const [tempo, setTempo] = useState(72);

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

  const lessonUidForSession =
    activeRecoveryId != null ? `recovery-gen-${activeRecoveryId}` : `recovery-draft-${selectedUid || "none"}`;

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
      setSelectedUid((prev) => prev || (data.sourceOptions?.[0]?.lessonUid ?? ""));
    } catch (e) {
      setContextError(e instanceof Error ? e.message : "Failed to load recovery context");
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContext();
  }, [refreshContext]);

  function clearActiveDrill() {
    setMusicXml(null);
    setActiveRecoveryId(null);
    setActiveTitle("AI recovery drill");
    setActiveSource("");
    setActiveDisplayFile("recovery.mxl");
    setLastMxlBase64(null);
  }

  async function generateDrill() {
    if (!selectedUid) {
      setGenError("Pick a source lesson from your practice history.");
      return;
    }
    setGenError(null);
    setGenLoading(true);
    try {
      const opt = sourceOptions.find((o) => o.lessonUid === selectedUid);
      const res = await fetch("/api/practice/generate-recovery", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonUid: selectedUid,
          lessonTitle: opt?.lessonTitle ?? "",
          lessonSource: opt?.lessonSource ?? "",
          baseFileName: null,
          tempoBpm: tempo,
          currentSessionMistakes: [],
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
      };
      if (!res.ok || !data.ok || !data.musicXml) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }

      setMusicXml(data.musicXml);
      setXmlRenderKey((k) => k + 1);
      if (data.mxlBase64) setLastMxlBase64(data.mxlBase64);

      if (data.recoveryLessonId) {
        setActiveRecoveryId(data.recoveryLessonId);
        setActiveTitle(`Recovery · ${opt?.lessonTitle || selectedUid}`);
        setActiveSource(opt?.lessonSource ?? "Practice");
        setActiveDisplayFile(data.fileName ?? "recovery.mxl");
      } else {
        setActiveRecoveryId(null);
        setActiveTitle(`Recovery (unsaved) · ${opt?.lessonTitle || selectedUid}`);
        setActiveSource(opt?.lessonSource ?? "Practice");
        setActiveDisplayFile(data.fileName ?? "recovery.mxl");
      }

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
      setActiveRecoveryId(L.id);
      setActiveTitle(L.title);
      setActiveSource("Recovery");
      setActiveDisplayFile(L.downloadFileName ?? `recovery-${L.id.slice(0, 8)}.mxl`);
      setLastMxlBase64(L.mxlBase64 ?? null);
      setSelectedUid(L.sourceLessonUid);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to open saved drill");
    } finally {
      setLoadLoading(null);
    }
  }

  async function deleteHistoryItem(id: string, e: React.MouseEvent) {
    e.stopPropagation();
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

  return (
    <div className="pb-16 pt-8 md:pt-10">
      <div className="mx-auto mb-8 flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black md:text-3xl">Recovery studio</h1>
          <p className="mt-1 text-sm font-semibold text-[#6e4d7d]">
            Generate drills from your practice history
          </p>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Same OSMD workspace as lessons — isolated{" "}
            <code
              className={`rounded border border-black/[0.08] ${analysisCodeBg} px-1 font-mono text-[12px] text-black`}
            >
              recovery_drill
            </code>{" "}
            lane only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshContext()}
          className="shrink-0 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition hover:border-[#6e4d7d]/35 hover:shadow-[0_10px_28px_rgba(110,77,125,0.12)]"
        >
          Refresh history
        </button>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[minmax(0,320px)_1fr] lg:px-6">
        <aside className="space-y-4">
          <div className={`${premiumAnalysisCard} p-4`}>
            <p className={`${analysisLabelPlum} tracking-[0.12em]`}>Source lesson</p>
            {contextLoading ? (
              <p className="mt-2 text-sm text-neutral-600">Loading your practice history…</p>
            ) : contextError ? (
              <p className="mt-2 text-sm text-red-600">{contextError}</p>
            ) : (
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 bg-[#fafaf9] px-3 py-2 text-sm text-[#151517]"
              >
                {sourceOptions.length === 0 ? (
                  <option value="">No sessions yet — play a lesson first</option>
                ) : (
                  sourceOptions.map((o) => (
                    <option key={o.lessonUid} value={o.lessonUid}>
                      {o.lessonTitle || o.lessonUid} ({o.lessonSource})
                      {o.recentScore != null ? ` · last ${o.recentScore}%` : ""}
                    </option>
                  ))
                )}
              </select>
            )}
            <label className={`mt-3 block ${analysisLabelPlum}`}>
              Target tempo (BPM)
              <input
                type="number"
                min={40}
                max={200}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value) || 72)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf9] px-3 py-2 text-sm text-[#151517]"
              />
            </label>
            <button
              type="button"
              disabled={genLoading || !selectedUid}
              onClick={() => void generateDrill()}
              className={`mt-4 w-full rounded-xl py-2.5 text-sm shadow-[0_8px_28px_rgba(234,143,38,0.28)] transition hover:brightness-[1.03] disabled:opacity-50 ${analysisAccentGradient}`}
            >
              {genLoading ? "Generating validated drill…" : "Generate recovery drill"}
            </button>
            {genError ? <p className="mt-2 text-xs text-red-600">{genError}</p> : null}
            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
              MusicXML is repaired for OSMD, then packaged as a standards-compliant .mxl download.
            </p>
          </div>

          <div className={`${premiumAnalysisCard} p-4`}>
            <p className={`${analysisLabelPlum} tracking-[0.12em]`}>Generated lesson history</p>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-600">No saved drills yet.</p>
            ) : (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-1">
                    <button
                      type="button"
                      disabled={loadLoading === h.id || deleteLoading === h.id}
                      onClick={() => void loadHistoryItem(h.id)}
                      className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-black transition disabled:opacity-50 ${
                        activeRecoveryId === h.id
                          ? "border-[#6e4d7d]/50 bg-[#f3eef5]"
                          : "border-black/[0.08] bg-[#faf9f7] hover:border-[#6e4d7d]/35"
                      }`}
                    >
                      <span className="font-medium">{h.title}</span>
                      <span className="mt-0.5 block text-[11px] text-neutral-500">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      title="Delete recovery drill"
                      disabled={deleteLoading === h.id || loadLoading === h.id}
                      onClick={(e) => void deleteHistoryItem(h.id, e)}
                      className="shrink-0 rounded-lg border border-black/[0.08] bg-[#faf9f7] p-2 text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Delete ${h.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {!musicXml ? (
            <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white p-10 text-center text-sm text-neutral-600 shadow-inner">
              Generate a drill or open one from history to load the score workspace.
            </div>
          ) : (
            <div className={`overflow-hidden ${premiumAnalysisCard}`}>
              <div className="flex flex-wrap items-center justify-end gap-2 border-b border-black/[0.06] bg-[#faf9f7] px-4 py-2">
                {lastMxlBase64 ? (
                  <button
                    type="button"
                    onClick={() => void downloadCurrentMxl()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black hover:border-[#6e4d7d]/35"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download .mxl
                  </button>
                ) : null}
                {activeRecoveryId ? (
                  <button
                    type="button"
                    disabled={deleteLoading === activeRecoveryId}
                    onClick={(e) => void deleteHistoryItem(activeRecoveryId, e)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete drill
                  </button>
                ) : null}
              </div>
              <LessonPracticeWorkspace
                cdnFileName={null}
                externalXml={musicXml}
                xmlRenderKey={xmlRenderKey}
                courseTitle={activeTitle}
                lessonSource={activeSource}
                lessonId={activeRecoveryId ?? "draft"}
                displayFileName={activeDisplayFile}
                lessonUid={lessonUidForSession}
                sessionCategory="recovery_drill"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
