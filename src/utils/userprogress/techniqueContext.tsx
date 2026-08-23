/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../Authsegment";
import {
  getUserTechniqueUnitProgress,
  unlockTechniqueUnit,
  markTechniqueUnitCompleted,
} from "./progressService";
import { getUserTechniqueProgress, upsertTechniqueProgress } from "./techniquesProgressService";

const CDN_BASE = "https://cdn-dataforpiano.netlify.app";

type User = { id: string };
type TechLesson = { id: string; completed?: boolean; [key: string]: any };
type TechUnit = { fkid: string; unitlessons: TechLesson[]; [key: string]: any };
type TechUnitStatus = { fkid: string; unlocked: boolean; completed: boolean; last_accessed?: string | null };

type TechniquesContextType = {
  techniques: TechUnit[];
  unitStatus: Record<string, { unlocked: boolean; completed: boolean }>;
  loading: boolean;
  error: string | null;
  completeLesson: (fkid: string, lessonId: string) => Promise<void>;
  isCompleted: (fkid: string, lessonId: string) => boolean;
  isUnitComplete: (fkid: string) => boolean;
  getUnitProgress: (fkid: string) => number;
  accessUnit: (fkid: string) => Promise<void>;
};

const TechniquesContext = createContext<TechniquesContextType | undefined>(undefined);

export function TechniquesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth() as unknown as { user: User | null };
  const [techniques, setTechniques] = useState<TechUnit[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Record<string, boolean>>>({});
  const [unitStatus, setUnitStatus] = useState<Record<string, { unlocked: boolean; completed: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  if (user) {
    fetchWithProgress();
  } else {
    fetchCDNOnly();
  }
}, [user]);

  const fetchCDNOnly = async () => {
    try {
      const res = await fetch(`${CDN_BASE}/techniques.json`);
      const data = await res.json();
      setTechniques(data.Techniques);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchWithProgress = async () => {
    try {
      const [res, progressRows, unitRows] = await Promise.all([
        fetch(`${CDN_BASE}/techniques.json`),
        getUserTechniqueProgress(user!.id),
        getUserTechniqueUnitProgress(user!.id),
      ]);
      const data = await res.json();
      const units: TechUnit[] = data.Techniques;
      setTechniques(units);

      // build lesson-level progress map
      const map: Record<string, Record<string, boolean>> = {};
      progressRows.forEach((row: any) => {
        if (!map[row.fkid]) map[row.fkid] = {};
        map[row.fkid][row.lesson_id] = row.completed;
      });
      setProgressMap(map);

      // build unit-level status, defaulting the FIRST unit to unlocked
      const status: Record<string, { unlocked: boolean; completed: boolean }> = {};
      units.forEach((u, idx) => {
        const record = unitRows.find((r: TechUnitStatus) => String(r.fkid) === String(u.fkid));
        status[u.fkid] = {
          unlocked: record?.unlocked ?? idx === 0,
          completed: record?.completed ?? false,
        };
      });
      setUnitStatus(status);

      // seed the first unit as unlocked in the DB if it isn't there yet
      if (units[0] && !unitRows.find((r: TechUnitStatus) => String(r.fkid) === String(units[0].fkid))) {
        await unlockTechniqueUnit(user!.id, units[0].fkid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const accessUnit = async (fkid: string) => {
    if (!user) return;
    if (unitStatus[fkid]?.unlocked) return; // already unlocked, nothing to do
    await unlockTechniqueUnit(user.id, fkid);
    setUnitStatus((prev) => ({ ...prev, [fkid]: { ...prev[fkid], unlocked: true } }));
  };

  // ✅ Called ONLY from the lesson-playing page when score === 100
  const completeLesson = async (fkid: string, lessonId: string) => {
    if (!user) return;

    await upsertTechniqueProgress(user.id, fkid, lessonId, true);

    const updatedMap = { ...progressMap, [fkid]: { ...(progressMap[fkid] ?? {}), [lessonId]: true } };
    setProgressMap(updatedMap);

    const unit = techniques.find((u) => String(u.fkid) === String(fkid));
    const totalLessons = unit?.unitlessons.length ?? 0;
    const completedLessons = unit?.unitlessons.filter((l) => updatedMap[fkid]?.[l.id]).length ?? 0;
    const allDone = totalLessons > 0 && completedLessons === totalLessons;

    if (allDone) {
      await markTechniqueUnitCompleted(user.id, fkid);

      const idx = techniques.findIndex((u) => String(u.fkid) === String(fkid));
      const nextUnit = techniques[idx + 1];
      if (nextUnit) await unlockTechniqueUnit(user.id, nextUnit.fkid);

      setUnitStatus((prev) => ({
        ...prev,
        [fkid]: { unlocked: true, completed: true },
        ...(nextUnit ? { [nextUnit.fkid]: { unlocked: true, completed: false } } : {}),
      }));
    }
  };

  const isCompleted = (fkid: string, lessonId: string) => progressMap[fkid]?.[lessonId] === true;

  const isUnitComplete = (fkid: string) => {
    const unit = techniques.find((u) => String(u.fkid) === String(fkid));
    if (!unit?.unitlessons?.length) return false;
    return unit.unitlessons.every((l) => isCompleted(fkid, l.id));
  };

  const getUnitProgress = (fkid: string) => {
    const unit = techniques.find((u) => String(u.fkid) === String(fkid));
    if (!unit?.unitlessons?.length) return 0;
    const done = unit.unitlessons.filter((l) => isCompleted(fkid, l.id)).length;
    return Math.round((done / unit.unitlessons.length) * 100);
  };

  return (
    <TechniquesContext.Provider
      value={{
        techniques,
        unitStatus,
        loading,
        error,
        completeLesson,
        isCompleted,
        isUnitComplete,
        getUnitProgress,
        accessUnit,
      }}
    >
      {children}
    </TechniquesContext.Provider>
  );
}

export const useTechniques = () => {
  const ctx = useContext(TechniquesContext);
  if (!ctx) throw new Error("useTechniques must be used inside TechniquesProvider");
  return ctx;
};