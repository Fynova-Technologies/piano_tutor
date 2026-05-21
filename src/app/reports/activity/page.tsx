/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { PracticeSession } from "@/datastore/sessionstorage";
import ActivityChart from "@/features/components/activitychart"; // ← new

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fetchAllSessionsFromSupabase(): Promise<PracticeSession[]> {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("*")
    .order("started_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch sessions:", error?.message);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    startedAt: new Date(r.started_at).getTime(),
    endedAt: new Date(r.ended_at).getTime(),
    durationSec: r.duration_sec,
    lesson: {
      uid: r.lesson_uid,
      id: r.lesson_id,
      title: r.lesson_title,
      source: r.lesson_source,
    },
    performance: {
      attempts: r.attempts,
      score: r.score,
      accuracy: r.accuracy,
      correctNotes: r.correct_notes,
      incorrectNotes: r.incorrect_notes,
      totalScoreable: r.total_scoreable,
    },
    sessionCategory: r.session_category,
    lessonFile: r.lesson_file,
    tempoBpm: r.tempo_bpm,
    completionStatus: r.completion_status,
    weakAreas: r.weak_areas,
    mistakeEvents: r.mistake_events,
    aiFeedbackSnapshot: r.ai_feedback_snapshot,
    progressMetrics: r.progress_metrics,
  }));
}

export default function ActivitiesReportPage() {
  const pathname = usePathname();
  const breadcrumbs = pathname.split('/').filter((segment) => segment);
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * itemsPerPage;

  type RangeType = "week" | "month" | "3month" | "custom";
  const [range, setRange] = useState<RangeType>("week");

  useEffect(() => {
    fetchAllSessionsFromSupabase()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  // ── Date range filter ──────────────────────────────────────────────
  function isInRange(timestamp: number): boolean {
    const now = new Date();
    if (range === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return timestamp >= start.getTime() && timestamp < end.getTime();
    }
    if (range === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return timestamp >= start.getTime();
    }
    if (range === "3month") {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      return timestamp >= start.getTime();
    }
    return true;
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  const rangedSessions = sessions.filter((s) => isInRange(s.startedAt));
  const totalTime = rangedSessions.reduce((sum, s) => sum + s.durationSec, 0);

  const lessonStats = useMemo(() => {
    const map: Record<string, any> = {};

    rangedSessions.forEach((s) => {
      const key = s.lesson.uid || `${s.lesson.id}__${s.lesson.source}`;
      if (!map[key]) {
        map[key] = {
          id: key,
          lessonId: s.lesson.id,
          title: s.lesson.title,
          source: s.lesson.source,
          category: s.sessionCategory ?? "unspecified",
          date: s.startedAt,
          attempt: 0,
          timespent: 0,
          scoreSum: 0,
          count: 0,
        };
      }
      if (s.startedAt < map[key].date) map[key].date = s.startedAt;
      map[key].attempt   += s.performance.attempts;
      map[key].timespent += s.durationSec;
      map[key].scoreSum  += s.performance.score;
      map[key].count     += 1;
    });

    return Object.values(map).map((l: any) => ({
      ...l,
      score: Math.round(l.scoreSum / l.count),
    }));
  }, [rangedSessions]);

  const filteredLessons = useMemo(() => {
    return lessonStats.filter(
      (l: any) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.source.toLowerCase().includes(query.toLowerCase()) ||
        l.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [lessonStats, query]);

  useEffect(() => { setCurrentPage(1); }, [query, range]);

  const currentItems = filteredLessons.slice(startIndex, startIndex + itemsPerPage);
  const totalPages   = Math.ceil(filteredLessons.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-8 lg:p-16 bg-[#F8F6F1] min-h-screen">
      {/* Breadcrumb */}
      <div className="gap-2 p-2 flex items-center">
        <span className="text-2xl text-[#6E6E73] font-medium">
          {breadcrumbs[0][0].toUpperCase() + breadcrumbs[0].slice(1)}
        </span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2" />
        <span className="text-2xl text-[#151517] font-medium">My Activity</span>
      </div>

      {/* ── Activity Chart card ────────────────────────────────────── */}
      <div className="mt-4">
        <ActivityChart sessionCount={rangedSessions.length} loading={loading} />
      </div>

      {/* ── Main table card ────────────────────────────────────────── */}
      <div className="bg-[#FEFEFE] w-full rounded-2xl p-6 mt-4">
        {/* Header totals */}
        <div className="flex justify-between pt-4">
          <div className="flex flex-col gap-4 p-6 border-b border-[#E3E3E3] text-[#151517] text-[18px] font-medium">
            <span>Lessons : {loading ? "…" : lessonStats.length}</span>
            <span>Total Time : {Math.round(totalTime / 60)} Mins</span>
          </div>
          <div className="text-[#151517] space-x-8">
            <Image src="/downloadbutton.svg" alt="download" width={21} height={21} className="inline-block" />
            <Image src="/printreport.svg"    alt="print"    width={21} height={21} className="inline-block" />
          </div>
        </div>

        {/* Search + Range filter */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-4">
          <div className="relative w-full max-w-md ml-0 sm:ml-4">
            <input
              type="text"
              placeholder="Quick Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pl-10 text-[#151517] placeholder-[#B9B9B9]"
            />
            <Image src="/searchicon.svg" alt="search" width={14} height={14} className="absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeType)}
              className="appearance-none rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pr-10 text-[#151517] text-[14px] font-medium hover:bg-gray-500/60 focus:outline-none"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="3month">3 Months</option>
              <option value="custom">Custom</option>
            </select>
            <Image src="/Icon3.svg" alt="dropdown" width={12} height={12} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 ml-0 sm:ml-4 overflow-x-auto">
          <div className="rounded-xl border bg-white min-w-[640px]">
            <table className="w-full border-collapse">
              <thead className="text-sm text-gray-500 border-b border-[#DEDEDE]">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">Source</th>
                  <th className="px-6 py-4 text-left font-medium">Category</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">Date <ArrowUpDown className="h-4 w-4 cursor-pointer" /></div>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Attempts</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">Time Spent <ArrowUpDown className="h-4 w-4 cursor-pointer" /></div>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">Score <ArrowUpDown className="h-4 w-4 cursor-pointer" /></div>
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      Loading sessions…
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                      No results found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{lesson.title}</td>
                      <td className="px-6 py-4 text-gray-700">{lesson.source}</td>
                      <td className="px-6 py-4 text-gray-500 capitalize text-xs">
                        {lesson.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(lesson.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{lesson.attempt}</td>
                      <td className="px-6 py-4 text-gray-700">{formatTime(lesson.timespent)}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{lesson.score}%</td>
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-full p-1 hover:bg-gray-200">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-end gap-6 px-6 py-4 mr-4 sm:mr-16">
              <button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="disabled:opacity-50 text-[14px] text-[#09090B] font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages}
                className="disabled:opacity-50 text-[14px] text-[#09090B] font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}