/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/utils/Authsegment";
import { useLessons } from "@/utils/userprogress/lessonprogress";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost";
import type { PracticeSession } from "@/datastore/sessionstorage";
import { getMergedPracticeSessions } from "@/lib/practiceSessions/merge";
import { sasrDataStore } from "@/datastore/sasrdatastore";

const ASSIGNMENTS_KEY = "piano_teacher_assignments_v1";

export type TeacherAssignment = {
  id: string;
  kind: "exercise" | "song" | "scale" | "tempo";
  title: string;
  detail?: string;
  due?: string;
  completed?: boolean;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

function ymdLocal(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computePracticeStreak(practiceDays: Set<string>): number {
  const today = ymdLocal(Date.now());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = ymdLocal(y.getTime());

  const anchor = practiceDays.has(today) ? today : practiceDays.has(yesterday) ? yesterday : null;
  if (!anchor) return 0;

  let streak = 0;
  const cursor = new Date(anchor + "T12:00:00");
  while (practiceDays.has(ymdLocal(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function lessonMatchesScale(lesson: any): boolean {
  const t = `${lesson.lessontitle ?? ""} ${lesson.source ?? ""}`.toLowerCase();
  return /\bscale|scales|finger|pentatonic|arpeggio\b/.test(t);
}

function lessonMatchesSight(lesson: any): boolean {
  const t = `${lesson.lessontitle ?? ""} ${lesson.source ?? ""}`.toLowerCase();
  return /\bsight|sight-read|sightread|reading\b/.test(t);
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function useStudentDashboardData() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const { lessons, topLessons, loading: lessonsLoading, getUnitProgress, getOverallProgress } = useLessons();
  const { recentLessons, loading: recentLoading, refetch: refetchRecent } = useRecentLessons();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [sasrStats, setSasrStats] = useState({ totalSessions: 0, avgScore: 0, highScore: 0 });

  const loadLocal = useCallback(async () => {
    try {
      const merged = await getMergedPracticeSessions();
      setSessions(merged);
    } catch {
      setSessions([]);
    } finally {
      setSessionsReady(true);
    }
  }, []);

  useEffect(() => {
    void loadLocal();
  }, [loadLocal]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchStats = async () => {
      setSasrStats(await sasrDataStore.getOverallStatistics());
    };
    fetchStats();
  }, [sessions, recentLessons]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const uid = user?.id ?? "guest";
    try {
      const raw = localStorage.getItem(`${ASSIGNMENTS_KEY}_${uid}`);
      if (raw) {
        const parsed = JSON.parse(raw) as TeacherAssignment[];
        if (Array.isArray(parsed)) setAssignments(parsed);
      } else {
        setAssignments([]);
      }
    } catch {
      setAssignments([]);
    }
  }, [user?.id]);

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    const meta = user.user_metadata;
    const full =
      meta?.full_name ||
      meta?.name ||
      meta?.display_name ||
      (typeof meta?.first_name === "string" && `${meta.first_name} ${meta?.last_name ?? ""}`.trim());
    if (full) return full;
    if (user.email) return user.email.split("@")[0] ?? "Student";
    return "Student";
  }, [user]);

  const overallPct = getOverallProgress();

  const pianoLevel = useMemo(() => {
    if (overallPct < 28) return { label: "Beginner" as const, tone: "bg-emerald-900/90 text-emerald-100 border-emerald-700/50" };
    if (overallPct < 72) return { label: "Intermediate" as const, tone: "bg-amber-900/90 text-amber-100 border-amber-700/50" };
    return { label: "Advanced" as const, tone: "bg-violet-900/90 text-violet-100 border-violet-700/50" };
  }, [overallPct]);

  const completedLessonCount = useMemo(() => {
    return lessons.flatMap((u) => u.unitlessons).filter((l) => l.completed).length;
  }, [lessons]);

  const totalLessonCount = useMemo(() => {
    return lessons.flatMap((u) => u.unitlessons).length;
  }, [lessons]);

  const totalPracticeSec = useMemo(
    () => sessions.reduce((s, x) => s + (x.durationSec ?? 0), 0),
    [sessions]
  );
  const totalPracticeMin = Math.round(totalPracticeSec / 60);

  const accuracyList = useMemo(() => {
    return sessions
      .map((s) => s.performance.accuracy)
      .filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  }, [sessions]);

  const accuracyPct = accuracyList.length ? avg(accuracyList) : null;

  const scoreList = useMemo(() => {
    return sessions.map((s) => s.performance.score).filter((n) => typeof n === "number");
  }, [sessions]);

  const rhythmScore = useMemo(() => {
    if (!scoreList.length) return null;
    return avg(scoreList.map((s) => Math.min(100, Math.max(0, s))));
  }, [scoreList]);

  const lastPracticedAt = useMemo(() => {
    const t = Math.max(
      ...sessions.map((s) => s.endedAt ?? 0),
      ...recentLessons.map((r) => new Date(r.played_at).getTime())
    );
    return t > 0 ? new Date(t).toISOString() : null;
  }, [sessions, recentLessons]);

  const practiceDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      set.add(ymdLocal(s.endedAt ?? s.startedAt));
    }
    for (const r of recentLessons) {
      set.add(ymdLocal(new Date(r.played_at).getTime()));
    }
    let sasrSessions: any[] = [];
    if (typeof window !== "undefined") {
      const result = sasrDataStore.getAllSessions();
      if (result instanceof Promise) {
        // Can't await in useMemo, so skip adding SASR sessions if async
        // Optionally, you could refactor to load these sessions in useEffect and store in state
      } else {
        sasrSessions = result;
      }
    }
    for (const r of sasrSessions) {
      set.add(ymdLocal(new Date(r.timestamp).getTime()));
    }
    return set;
  }, [sessions, recentLessons]);

  const streakDays = useMemo(() => computePracticeStreak(practiceDays), [practiceDays]);

  const xp = useMemo(() => {
    const base = completedLessonCount * 28 + totalPracticeMin * 3;
    const bonus =
      sasrStats.totalSessions > 0 ? Math.min(400, sasrStats.avgScore * 2) : 0;
    return Math.round(base + bonus);
  }, [completedLessonCount, totalPracticeMin, sasrStats]);

  const currentLevelNum = useMemo(() => {
    return Math.max(1, Math.floor(xp / 500) + 1);
  }, [xp]);

  const sightReadingScore = useMemo(() => {
    if (sasrStats.totalSessions > 0) return sasrStats.avgScore;
    const sightLessons = lessons.flatMap((u) =>
      u.unitlessons.filter((l) => lessonMatchesSight(l))
    );
    const done = sightLessons.filter((l: { completed?: boolean }) => l.completed).length;
    if (!sightLessons.length) return null;
    return Math.round((done / sightLessons.length) * 100);
  }, [lessons, sasrStats]);

  const courseTracks = useMemo(() => {
    const methodUnits = lessons.filter((u) =>
      u.unitlessons?.some(
        (l) => typeof l.source === "string" && l.source.toLowerCase().includes("method")
      )
    );
    const scaleUnits = lessons.filter((u) => u.unitlessons?.some((l) => lessonMatchesScale(l)));
    const sightUnits = lessons.filter((u) => u.unitlessons?.some((l) => lessonMatchesSight(l)));

    const methodPct =
      methodUnits.length > 0
        ? Math.round(methodUnits.reduce((sum, u) => sum + getUnitProgress(u.fkid), 0) / methodUnits.length)
        : topLessons.length > 0
          ? getUnitProgress(String(topLessons[0].fkid))
          : overallPct;

    const scalesPct =
      scaleUnits.length > 0
        ? Math.round(scaleUnits.reduce((sum, u) => sum + getUnitProgress(u.fkid), 0) / scaleUnits.length)
        : Math.min(100, Math.round((completedLessonCount / Math.max(1, totalLessonCount)) * 55));

    const sightPct =
      sightUnits.length > 0
        ? Math.round(sightUnits.reduce((sum, u) => sum + getUnitProgress(u.fkid), 0) / sightUnits.length)
        : sightReadingScore ?? Math.min(100, Math.round((sasrStats.avgScore || 0) * 0.85));

    const bookTitle = topLessons[0]?.title != null ? String(topLessons[0].title) : "1A";
    const methodLabel = `Method book ${bookTitle}`;

    return [
      { key: "method", label: methodLabel, percent: Math.min(100, Math.max(0, methodPct)) },
      { key: "scales", label: "Scales", percent: Math.min(100, Math.max(0, scalesPct)) },
      { key: "sight", label: "Sight reading", percent: Math.min(100, Math.max(0, sightPct)) },
    ];
  }, [
    lessons,
    topLessons,
    getUnitProgress,
    overallPct,
    completedLessonCount,
    totalLessonCount,
    sightReadingScore,
    sasrStats.avgScore,
  ]);

  const firstRecent = recentLessons[0] ?? null;

  const isLessonComplete = useCallback(
    (fkid: string, lessonId: string) => {
      const unit = lessons.find((u) => String(u.fkid) === String(fkid));
      const row = unit?.unitlessons?.find((l: { id: string }) => String(l.id) === String(lessonId));
      return Boolean(row?.completed);
    },
    [lessons]
  );

  const achievements: AchievementDef[] = useMemo(() => {
    const scaleMastered = lessons.some((u) =>
      u.unitlessons.some(
        (l: { completed?: boolean; lessontitle?: string; source?: string }) =>
          l.completed && lessonMatchesScale(l)
      )
    );
    const highRhythm =
      scoreList.length >= 3 && avg(scoreList.map((s) => Math.min(100, s))) >= 90;

    return [
      {
        id: "streak_7",
        title: "Week warrior",
        description: "Practice 7 days in a row",
        unlocked: streakDays >= 7,
      },
      {
        id: "scale_first",
        title: "First scale mastered",
        description: "Complete a scales or technique lesson",
        unlocked: scaleMastered,
      },
      {
        id: "min_100",
        title: "Century club",
        description: "100 minutes of focused practice",
        unlocked: totalPracticeMin >= 100,
      },
      {
        id: "rhythm_master",
        title: "Rhythm master",
        description: "90%+ average score over 3+ sessions",
        unlocked: highRhythm,
      },
    ];
  }, [lessons, streakDays, totalPracticeMin, scoreList]);

  const loading = lessonsLoading || recentLoading || !sessionsReady;

  return {
    user,
    displayName,
    loading,
    pianoLevel,
    overallPct,
    completedLessonCount,
    totalLessonCount,
    totalPracticeMin,
    accuracyPct,
    sightReadingScore,
    rhythmScore,
    lastPracticedAt,
    streakDays,
    xp,
    currentLevelNum,
    courseTracks,
    recentLessons,
    firstRecent,
    isLessonComplete,
    achievements,
    assignments,
    refetchRecent,
    reloadSessions: loadLocal,
  };
}
