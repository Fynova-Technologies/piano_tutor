"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAnalyticsSnapshot } from "./buildAnalyticsSnapshot";
import { buildHeuristicReport } from "./heuristicReport";
import { getSessions } from "@/datastore/sessionstorage";
import { getMergedPracticeSessions } from "@/lib/practiceSessions/merge";
import type { AiReviewReport, AnalyticsSnapshot, AiReviewApiResponse } from "./types";

const CACHE_KEY = "ai_review_report_cache_v1";
const CACHE_MS = 6 * 60 * 60 * 1000;

function cacheFingerprint(s: AnalyticsSnapshot) {
  return `${s.sessionCount}|${s.lastSessionAt ?? ""}|${s.totalPracticeMinutes}`;
}

export function useAiReview() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(() =>
    typeof window === "undefined" ? null : buildAnalyticsSnapshot(getSessions())
  );
  const [report, setReport] = useState<AiReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRefresh, setPendingRefresh] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [apiErrorCode, setApiErrorCode] = useState<string | null>(null);
  const initialLoadDoneRef = useRef(false);

  const refreshSnapshot = useCallback(async () => {
    const merged = await getMergedPracticeSessions();
    const next = buildAnalyticsSnapshot(merged);
    setSnapshot(next);
    return next;
  }, []);

  const loadReport = useCallback(async (s: AnalyticsSnapshot, bypassCache: boolean) => {
    if (!initialLoadDoneRef.current) setLoading(true);
    else setPendingRefresh(true);
    setStatusMsg(null);
    setApiErrorCode(null);

    try {
      if (!bypassCache && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as {
              fp: string;
              t: number;
              report: AiReviewReport;
              aiOk: boolean;
            };
            if (Date.now() - parsed.t < CACHE_MS && parsed.fp === cacheFingerprint(s)) {
              setReport(parsed.report);
              setAiOk(parsed.aiOk);
              setApiErrorCode(null);
              setStatusMsg(null);
              initialLoadDoneRef.current = true;
              return;
            }
          }
        } catch {
          /* ignore bad cache */
        }
      }

      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: s }),
      });
      const json = (await res.json()) as AiReviewApiResponse & {
        report?: AiReviewReport;
        message?: string;
        code?: string;
      };

      if (json && "report" in json && json.report) {
        setReport(json.report);
        const fromModel = json.ok === true;
        setAiOk(fromModel);
        const errCode =
          !fromModel && typeof json === "object" && json !== null && "code" in json
            ? String((json as { code?: string }).code ?? "")
            : "";
        setApiErrorCode(errCode || null);
        setStatusMsg(fromModel ? null : (json.message ?? null));
        initialLoadDoneRef.current = true;
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              fp: cacheFingerprint(s),
              t: Date.now(),
              report: json.report,
              aiOk: fromModel,
            })
          );
        } catch {
          /* ignore quota */
        }
      } else {
        const fallback = buildHeuristicReport(s);
        setReport(fallback);
        setAiOk(false);
        setApiErrorCode(null);
        setStatusMsg("Could not load AI insights.");
        initialLoadDoneRef.current = true;
      }
    } catch {
      setReport(buildHeuristicReport(s));
      setAiOk(false);
      setApiErrorCode(null);
      setStatusMsg("Network error — showing local analysis.");
      initialLoadDoneRef.current = true;
    } finally {
      setLoading(false);
      setPendingRefresh(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await refreshSnapshot();
      if (!cancelled) await loadReport(s, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSnapshot, loadReport]);

  const refetch = useCallback(async () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
    const s = await refreshSnapshot();
    return loadReport(s, true);
  }, [refreshSnapshot, loadReport]);

  return { snapshot, report, loading, pendingRefresh, aiOk, statusMsg, apiErrorCode, refetch };
}
