"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, ArrowRight, Sparkles } from "lucide-react";
import {
  analysisAccentGradient,
  analysisCodeBg,
  analysisLabelPlum,
  premiumAnalysisCard,
} from "@/features/ai-review/PianoAnalysisChrome";

/**
 * --- Mistake Recovery Lessons (dashboard module) ---
 * Entry from AI Analysis: links to dedicated studio; shows cached history summary.
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
      className={`relative mb-10 overflow-hidden ${premiumAnalysisCard} p-6`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_90%_-10%,rgba(110,77,125,0.07),transparent_55%)]" />

      <div className="relative z-[1] flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${analysisAccentGradient}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-neutral-900" strokeWidth={2} />
            Recovery
          </div>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-black">
            Mistake recovery lessons
          </h3>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Personalized drills · isolated from method books
          </p>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Generate MusicXML from cloud history; sessions stay under{" "}
            <code
              className={`rounded border border-black/[0.08] ${analysisCodeBg} px-1.5 py-0.5 font-mono text-[11px] text-black`}
            >
              recovery_drill
            </code>
            .
          </p>
        </div>
        <Link
          href="/ai-analysis/recovery"
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm shadow-md transition hover:brightness-[1.03] hover:shadow-lg ${analysisAccentGradient}`}
        >
          Open studio
          <ArrowRight className="h-4 w-4 text-neutral-900" />
        </Link>
      </div>

      <div className="relative z-[1] mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/[0.06] bg-[#faf9f7] p-4 shadow-inner">
          <div className={`flex items-center gap-2 ${analysisLabelPlum}`}>
            <Activity className="h-4 w-4" strokeWidth={2} />
            Generated library
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-neutral-500">Loading…</p>
          ) : error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums text-black">{recoveryCount}</p>
              <p className="text-xs font-medium text-neutral-500">Saved drills</p>
              {recentTitles.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-neutral-600">
                  {recentTitles.map((t) => (
                    <li key={t}>
                      <span className="mr-1.5 text-[#6e4d7d]">♪</span>
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-[#faf9f7] p-4 shadow-inner">
          <p className={analysisLabelPlum}>Weak-area signal</p>
          {weakHint ? (
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{weakHint}</p>
          ) : (
            <p className="mt-2 text-sm text-neutral-600">
              Play a few signed-in sessions — we&apos;ll highlight where mistakes cluster.
            </p>
          )}
          <p className="mt-3 border-t border-black/[0.06] pt-3 text-[11px] text-neutral-500">
            Same OSMD engine · separate lesson lane.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
