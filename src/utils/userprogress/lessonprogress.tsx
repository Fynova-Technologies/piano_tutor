/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../Authsegment";
import {
  getUserProgress,
  upsertProgress,
  getUserUnitProgress,
  unlockUnit,
  markUnitCompleted,
} from "./progressService";

// ✅ Your real CDN base — no trailing slash
const CDN_BASE = "https://cdn-dataforpiano.netlify.app";

type User = { id: string };
type Lesson = { id: string; completed?: boolean; [key: string]: any };
type Unit = { fkid: string; unitlessons: Lesson[]; [key: string]: any };
type TopLesson = {
  id: string;
  fkid: string;
  unlocked: boolean;
  completed: boolean;
  last_accessed?: string | null;
  [key: string]: any;
};
type LessonsContextType = {
  lessons: Unit[];
  topLessons: TopLesson[];
  loading: boolean;
  error: string | null;
  markComplete: (fkid: string, lessonId: string) => Promise<void>;
  markIncomplete: (fkid: string, lessonId: string) => Promise<void>;
  getUnitProgress: (fkid: string) => number;
  getOverallProgress: () => number;
  accessUnit: (fkid: string) => Promise<void>;
};

const LessonsContext = createContext<LessonsContextType | undefined>(undefined);

export function LessonsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() as unknown as { user: User | null };
  const [lessons, setLessons] = useState<Unit[]>([]);
  const [topLessons, setTopLessons] = useState<TopLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    user ? fetchWithProgress() : fetchCDNOnly();
  }, [user]);

  const fetchCDNOnly = async () => {
    try {
      const [lessonsRes, topRes] = await Promise.all([
        fetch(`${CDN_BASE}/unitLessonsData2.json`),
        fetch(`${CDN_BASE}/topLessons.json`),
      ]);
      const lessonsData = await lessonsRes.json();
      const topData = await topRes.json();
      setLessons(lessonsData.Lessons);
      setTopLessons(
        topData.topLessons.map((l: any) => ({
          ...l,
          unlocked: false,
          completed: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchWithProgress = async () => {
    try {
      const [lessonsRes, topRes, unitProgressData, progressData] =
        await Promise.all([
          fetch(`${CDN_BASE}/unitLessonsData2.json`),
          fetch(`${CDN_BASE}/topLessons.json`),
          getUserUnitProgress(user?.id),
          getUserProgress(user?.id),
        ]);

      const lessonsData = await lessonsRes.json();
      const topData = await topRes.json();

      setLessons(mergeProgress(lessonsData.Lessons, progressData));

      // ✅ Join on fkid — matches both the JSON and the DB column
      const mergedTop = topData.topLessons.map((lesson: any) => {
        const record = unitProgressData?.find(
          (p: any) => String(p.fkid) === String(lesson.fkid)
        );
        return {
          ...lesson,
          unlocked: record?.unlocked ?? false,
          completed: record?.completed ?? false,
          last_accessed: record?.last_accessed ?? null,
        };
      });
      setTopLessons(mergedTop);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Called when user taps a unit card to open it
  const accessUnit = async (fkid: string) => {
    setTopLessons((prev) =>
      prev.map((l) =>
        String(l.fkid) === String(fkid) ? { ...l, unlocked: true } : l
      )
    );
    if (user) await unlockUnit(user.id, fkid);
  };

  // ✅ Called from lesson page when score === 100
  const markComplete = async (fkid: string, lessonId: string) => {
  if (!user) return;

  // 1. Write to Supabase
  await upsertProgress(user.id, fkid, lessonId, true);

  // 2. Re-fetch ALL progress for this user from Supabase (source of truth)
  const freshProgress = await getUserProgress(user.id);

  // 3. Re-fetch CDN subchapters base structure
  const lessonsRes = await fetch(`${CDN_BASE}/unitLessonsData2.json`);
  const lessonsData = await lessonsRes.json();

  // 4. Merge fresh DB progress into CDN structure
  const mergedLessons = mergeProgress(lessonsData.Lessons, freshProgress);
  setLessons(mergedLessons);

  // 5. Check if ALL subchapters in this chapter (fkid) are now complete
  //    using the freshly merged data — not optimistic state
  const thisUnit = mergedLessons.find(
    (u) => String(u.fkid) === String(fkid)
  );
  const totalSubchapters = thisUnit?.unitlessons.length ?? 0;
  const completedSubchapters = thisUnit?.unitlessons.filter(
    (l: { completed: any; }) => l.completed
  ).length ?? 0;

  console.log(
    `📚 Chapter ${fkid}: ${completedSubchapters}/${totalSubchapters} subchapters complete`
  );

  const allDone = totalSubchapters > 0 && completedSubchapters === totalSubchapters;

  if (allDone) {
    // 6. Mark the chapter (topLesson) as complete in Supabase
    await markUnitCompleted(user.id, fkid);

    // 7. Update topLessons UI state
    setTopLessons((prev) =>
      prev.map((t) =>
        String(t.fkid) === String(fkid)
          ? { ...t, completed: true, unlocked: true }
          : t
      )
    );

    console.log(`🏆 Chapter ${fkid} fully complete!`);
  }
};

  const markIncomplete = async (fkid: string, lessonId: string) => {
    setLessons((prev) =>
      prev.map((unit) =>
        String(unit.fkid) === String(fkid)
          ? {
              ...unit,
              unitlessons: unit.unitlessons.map((l) =>
                l.id === lessonId ? { ...l, completed: false } : l
              ),
            }
          : unit
      )
    );
    if (user) await upsertProgress(user.id, fkid, lessonId, false);
  };

  const getUnitProgress = (fkid: string) => {
    const unit = lessons.find((u) => String(u.fkid) === String(fkid));
    if (!unit?.unitlessons?.length) return 0;
    const done = unit.unitlessons.filter((l) => l.completed).length;
    return Math.round((done / unit.unitlessons.length) * 100);
  };

  const getOverallProgress = () => {
    const all = lessons.flatMap((u) => u.unitlessons);
    if (!all.length) return 0;
    const done = all.filter((l) => l.completed).length;
    return Math.round((done / all.length) * 100);
  };

  return (
    <LessonsContext.Provider
      value={{
        lessons,
        topLessons,
        loading,
        error,
        markComplete,
        markIncomplete,
        getUnitProgress,
        getOverallProgress,
        accessUnit,
      }}
    >
      {children}
    </LessonsContext.Provider>
  );
}

function mergeProgress(cdnLessons: any[], progressRows: any[]) {
  return cdnLessons.map((unit) => ({
    ...unit,
    unitlessons: unit.unitlessons.map((lesson: any) => {
      const record = progressRows?.find(
        (p) =>
          String(p.fkid) === String(unit.fkid) &&
          String(p.lesson_id) === String(lesson.id)
      );
      return { ...lesson, completed: record?.completed ?? false };
    }),
  }));
}

// At the bottom of LessonsContext.tsx
export const useLessons = () => {
  const ctx = useContext(LessonsContext);
  if (!ctx) throw new Error("useLessons must be used inside LessonsProvider");
  return ctx;
};