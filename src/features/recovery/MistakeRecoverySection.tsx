"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Activity, ArrowRight, Sparkles } from "lucide-react";
import { dashboardAnalysisCard, PianoKeysStripeLight } from "@/features/ai-review/PianoAnalysisChrome";

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
      className={`relative mb-10 overflow-hidden ${dashboardAnalysisCard} p-6`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_90%_-10%,rgba(212,175,55,0.07),transparent_55%)]" />
      <PianoKeysStripeLight className="relative z-[1] mb-5 rounded-md opacity-70" />

      <div className="relative z-[1] flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#0A0A0B] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            <Sparkles className="h-3.5 w-3.5" />
            Recovery studio
          </div>
          <h3 className="mt-3 text-2xl font-bold tracking-tight primary-color-text">
            Mistake recovery lessons
          </h3>
          <p className="mt-2 max-w-xl text-sm text-[#535356]">
            Personalized drills isolated from method books. Generate MusicXML from cloud history; sessions stay under{" "}
            <code className="rounded border border-black/10 bg-[#fafaf9] px-1.5 py-0.5 text-[11px] text-[#151517]">
              recovery_drill
            </code>
            .
          </p>
        </div>
        <Link
          href="/ai-analysis/recovery"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-semibold primary-color-text shadow-[0_5px_10px_0px_rgba(80,80,80,0.18)] ring-1 ring-[#b8922c] transition hover:brightness-105"
        >
          Open recovery studio
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative z-[1] mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-[#fafaf9] p-4 shadow-inner">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7a68]">
            <Activity className="h-4 w-4 text-[#aa8c2c]" />
            Your generated library
          </div>
          {loading ? (
            <p className="mt-2 text-sm text-[#535356]/80">Loading…</p>
          ) : error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : (
            <>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#151517]">{recoveryCount}</p>
              <p className="text-xs text-[#535356]">Saved drills — replay anytime</p>
              {recentTitles.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-[#535356]">
                  {recentTitles.map((t) => (
                    <li key={t}>
                      <span className="mr-1.5 text-[#aa8c2c]">♪</span>
                      {t}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
        <div className="rounded-xl border border-black/10 bg-[#fafaf9] p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7a68]">
            Weak-area tuning
          </p>
          {weakHint ? (
            <p className="mt-2 text-sm leading-relaxed text-[#535356]">{weakHint}</p>
          ) : (
            <p className="mt-2 text-sm text-[#535356]/85">
              Play a few signed-in sessions — we surface heavier mistake loads so you know where to focus next.
            </p>
          )}
          <p className="mt-3 border-t border-black/10 pt-3 text-[11px] text-[#8a7a68]">
            Dashboard → AI analysis → recovery studio → same OSMD engine, separate lesson lane.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
