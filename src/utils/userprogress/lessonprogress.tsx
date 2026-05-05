/* eslint-disable @typescript-eslint/no-explicit-any */
// context/LessonsContext.jsx
"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../Authsegment";
import { getUserProgress, upsertProgress,getUserUnitProgress, unlockUnit } from "./progressService";

type User = {
  id: string;
  // add other user properties if needed
};

type Lesson = {
  id: string;
  completed?: boolean;
  // add other lesson properties if needed
};

type Unit = {
  fkid: string;
  unitlessons: Lesson[];
  // add other unit properties if needed
};

type TopLesson = {
  id: string;
  unlocked: boolean;
  completed: boolean;
  last_accessed?: string | null;
  // add other properties if needed
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
  accessUnit: (unitId: string, fkid: string) => Promise<void>;
};

const CDN_URL = "https://your-netlify-cdn.netlify.app/data/lessons.json";
const LessonsContext = createContext<LessonsContextType | undefined>(undefined);

export function LessonsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() as unknown as { user: User | null };
  const [lessons, setLessons] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type TopLesson = {
    id: string;
    unlocked: boolean;
    completed: boolean;
    last_accessed?: string | null;
    // add other properties if needed
  };
  const [topLessons, setTopLessons] = useState<TopLesson[]>([]);      // ✅ add
  

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    user ? fetchWithProgress() : fetchCDNOnly();
  }, [user]);

  const fetchCDNOnly = async () => {
    try {
      const [lessonsRes, topRes] = await Promise.all([
        fetch(`${CDN_URL}/unitLessonsData2.json`),
        fetch(`${CDN_URL}/topLessons.json`),        // ✅ fetch from CDN
      ]);
      const lessonsData = await lessonsRes.json();
      const topData = await topRes.json();

      setLessons(lessonsData.Lessons);
      setTopLessons(topData.topLessons.map((l: any) => ({  // no user = nothing unlocked
        ...l,
        unlocked: false,
        completed: false,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchWithProgress = async () => {
    try {
      const [lessonsRes, topRes, unitProgressData, progressData] = await Promise.all([
        fetch(`${CDN_URL}/unitLessonsData2.json`),
        fetch(`${CDN_URL}/topLessons.json`),
        getUserUnitProgress(user?.id),              // ✅ user unit progress
        getUserProgress(user?.id),                  // lesson-level progress
      ]);

      const lessonsData = await lessonsRes.json();
      const topData = await topRes.json();

      setLessons(mergeProgress(lessonsData.Lessons, progressData));

      // ✅ Merge CDN topLessons with user's unit progress
      const mergedTop = topData.topLessons.map((lesson: { id: any; }) => {
        const record = unitProgressData?.find(p => p.unit_id === lesson.id);
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

  // ✅ Call this when user clicks a unit key
  const accessUnit = async (unitId: any, fkid: any) => {
    setTopLessons(prev =>
      prev.map(l => l.id === unitId ? { ...l, unlocked: true } : l)
    );
    if (user) await unlockUnit(user.id, unitId, fkid);
  };


  const markComplete = async (fkid: string, lessonId: string) => {
    setLessons(prev =>
      prev.map(unit =>
        unit.fkid === fkid ? {
          ...unit,
          unitlessons: unit.unitlessons.map(l =>
            l.id === lessonId ? { ...l, completed: true } : l
          )
        } : unit
      )
    );
    if (user) await upsertProgress(user.id, fkid, lessonId, true);
  };

  const markIncomplete = async (fkid: string, lessonId: string) => {
    setLessons(prev =>
      prev.map(unit =>
        unit.fkid === fkid ? {
          ...unit,
          unitlessons: unit.unitlessons.map(l =>
            l.id === lessonId ? { ...l, completed: false } : l
          )
        } : unit
      )
    );
    if (user) await upsertProgress(user.id, fkid, lessonId, false);
  };

  const getUnitProgress = (fkid: string) => {
    const unit = lessons.find(u => u.fkid === fkid);
    if (!unit?.unitlessons?.length) return 0;
    const done = unit.unitlessons.filter(l => l.completed).length;
    return Math.round((done / unit.unitlessons.length) * 100);
  };

  const getOverallProgress = () => {
    const all = lessons.flatMap(u => u.unitlessons);
    if (!all.length) return 0;
    const done = all.filter(l => l.completed).length;
    return Math.round((done / all.length) * 100);
  };

  return (
    <LessonsContext.Provider value={{
       lessons,
      topLessons,        // ✅ expose
      loading,
      error,
      markComplete,
      markIncomplete,
      getUnitProgress,
      getOverallProgress,
      accessUnit, 
    }}>
      {children}
    </LessonsContext.Provider>
  );
}

export const useLessons = () => useContext(LessonsContext);

function mergeProgress(cdnLessons: any[], progressRows: any[]) {
  return cdnLessons.map(unit => ({
    ...unit,
    unitlessons: unit.unitlessons.map((lesson: { id: any; }) => {
      const record = progressRows?.find(
        p => p.fkid === unit.fkid && p.lesson_id === lesson.id
      );
      return {
        ...lesson,
        completed: record?.completed ?? false,
      };
    }),
  }));
}

