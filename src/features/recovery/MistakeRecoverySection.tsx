"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, ArrowRight, Sparkles } from "lucide-react";

/**
 * --- Mistake Recovery Lessons (dashboard module) ---
 * Entry from AI Analysis: links to dedicated studio; shows cached history summary.
 * --- AI analysis pipeline (surface) ---
 * Uses aggregated `/api/recovery-lessons` payloads derived from `practice_session_records`.
 */
export function MistakeRecoverySection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCount, setRecoveryCount] = useState(0);
  const [recentTitles, setRecentTitles] = useState<string[]>([]);
  const [weakHint, setWeakHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/recovery-lessons", { credentials: "include" });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          recoveryLessons?: { title: string }[];
          recentMistakeSummary?: { mistakeEventCount: number; lessonUid: string }[];
        };
        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Could not load recovery context");
        }
        if (cancelled) return;
        const lessons = data.recoveryLessons ?? [];
        setRecoveryCount(lessons.length);
        setRecentTitles(lessons.slice(0, 3).map((l) => l.title));
        const summary = data.recentMistakeSummary ?? [];
        const top =
          summary.length === 0
            ? null
            : summary.reduce((a, b) => (a.mistakeEventCount >= b.mistakeEventCount ? a : b));
        if (top && top.mistakeEventCount > 0) {
          setWeakHint(
            `Recent sessions show up to ${top.mistakeEventCount} tracked mistakes in a single run — good candidate for a recovery drill.`
          );
        } else {
          setWeakHint(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="mb-10 rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#0A0A0B] via-[#14141c] to-[#1a1a22] p-6 text-white shadow-xl"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37]">
            <Sparkles className="h-3.5 w-3.5" />
            Mistake recovery lessons
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Personalized practice — isolated from official lessons
          </h3>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Open the recovery studio to generate validated MusicXML drills from your cloud history,
            replay saved sessions, and keep progress under <code className="rounded bg-white/10 px-1">recovery_drill</code> so
            method lessons stay untouched.
          </p>
        </div>
        <Link
          href="/ai-analysis/recovery"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#0A0A0B] shadow-lg transition hover:bg-[#e8c85c]"
        >
          Open recovery studio
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
            <Activity className="h-4 w-4" />
            Generated library
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-white/55">Loading…</p>
          ) : error ? (
            <p className="mt-2 text-sm text-red-300">{error}</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums">{recoveryCount}</p>
              <p className="text-xs text-white/55">Saved drills (replay anytime)</p>
              {recentTitles.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-white/75">
                  {recentTitles.map((t) => (
                    <li key={t}>· {t}</li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
            Weak-area signal
          </p>
          {weakHint ? (
            <p className="mt-2 text-sm leading-relaxed text-white/80">{weakHint}</p>
          ) : (
            <p className="mt-2 text-sm text-white/55">
              Play through a few lessons while signed in — we will highlight sessions with heavier mistake
              loads for targeted recovery.
            </p>
          )}
          <p className="mt-3 text-[11px] text-white/45">
            Premium coach flow: dashboard → AI analysis → mistake recovery → same OSMD engine as lessons,
            separate session category.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
