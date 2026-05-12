"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";
import { PianoKeysStripeLight } from "@/features/ai-review/PianoAnalysisChrome";

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

  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [loadLoading, setLoadLoading] = useState<string | null>(null);

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

      if (data.mxlBase64 && data.fileName && typeof document !== "undefined") {
        try {
          const blob = Uint8Array.from(atob(data.mxlBase64), (c) => c.charCodeAt(0));
          const url = URL.createObjectURL(
            new Blob([blob], { type: "application/vnd.recordare.musicxml+xml" })
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = data.fileName;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          /* optional */
        }
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
      setActiveDisplayFile(`recovery-${L.id.slice(0, 8)}.mxl`);
      setSelectedUid(L.sourceLessonUid);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to open saved drill");
    } finally {
      setLoadLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <div className="border-b border-black/10 bg-[#FEFEFE] px-4 py-4 shadow-[0_2px_8px_rgba(80,80,80,0.06)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/ai-analysis"
              className="text-sm font-medium text-[#151517] underline-offset-4 hover:text-[#aa8c2c]"
            >
              ← AI Analysis
            </Link>
            <h1 className="mt-2 text-xl font-bold primary-color-text">Mistake recovery studio</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#535356]">
              Personalized AI drills stay separate from official method lessons. Generate from your weakest
              recent sessions, practice with the same cursor engine, and track recovery sessions in your
              practice history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshContext()}
            className="self-start rounded-xl border border-black/10 bg-[#FEFEFE] px-4 py-2 text-sm font-medium text-[#151517] shadow-[0_5px_10px_0px_rgba(80,80,80,0.1)] transition hover:border-[#D4AF37]/35 hover:bg-[#f2e6c1]/70"
          >
            Refresh history
          </button>
        </div>
        <PianoKeysStripeLight className="mx-auto mt-4 max-w-5xl rounded-md opacity-[0.72]" />
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-[#FEFEFE] p-4 shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a7a68]">
              Source lesson
            </p>
            {contextLoading ? (
              <p className="mt-2 text-sm text-[#6b6054]">Loading your practice history…</p>
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
            <label className="mt-3 block text-xs font-medium text-[#8a7a68]">
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
              className="mt-4 w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-semibold primary-color-text shadow-[0_5px_10px_0px_rgba(80,80,80,0.18)] ring-1 ring-[#b8922c] transition hover:brightness-105 disabled:opacity-50"
            >
              {genLoading ? "Generating validated drill…" : "Generate recovery drill"}
            </button>
            {genError ? <p className="mt-2 text-xs text-red-600">{genError}</p> : null}
            <p className="mt-3 text-[11px] leading-relaxed text-[#8a7a68]">
              The server validates MusicXML (declaration, score-partwise, part-list, P1) before
              packaging MXL or returning content to the browser.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#FEFEFE] p-4 shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a7a68]">
              Generated lesson history
            </p>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-[#6b6054]">No saved drills yet.</p>
            ) : (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      disabled={loadLoading === h.id}
                      onClick={() => void loadHistoryItem(h.id)}
                      className="w-full rounded-lg border border-[#e5dcd1] bg-[#faf7f2] px-3 py-2 text-left text-[#2a2318] transition hover:border-[#D4AF37]/45 disabled:opacity-50"
                    >
                      <span className="font-medium">{h.title}</span>
                      <span className="mt-0.5 block text-[11px] text-[#8a7a68]">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {!musicXml ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#fafaf9]/95 p-10 text-center text-sm text-[#535356]">
              Generate a drill or open one from history to load the score workspace.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#FEFEFE] shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)]">
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
