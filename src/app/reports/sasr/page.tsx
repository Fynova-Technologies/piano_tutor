'use client';

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, MoreVertical, Download, Printer } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { PracticeSession } from "@/datastore/sessionstorage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RangeType = "week" | "month" | "3month" | "custom";

function isInRange(
  timestamp: number,
  range: RangeType,
  customFrom: string,
  customTo: string
): boolean {
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
  if (range === "custom" && customFrom && customTo) {
    const start = new Date(customFrom).getTime();
    const end = new Date(customTo).getTime() + 86_400_000; // inclusive end
    return timestamp >= start && timestamp < end;
  }
  return true;
}

export default function SASRReportPage() {
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const breadcrumbs = pathname.split("/").filter((s) => s);

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeType>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sortField, setSortField] = useState<"date" | "score">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ── Fetch SASR sessions from Supabase ────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("session_category", "sasr")
        .order("started_at", { ascending: false });

      if (error || !data) {
        console.error("Failed to fetch SASR sessions:", error?.message);
        setLoading(false);
        return;
      }

      const mapped: PracticeSession[] = data.map((r) => ({
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
        mistakeEvents: r.mistake_events,
      }));

      setSessions(mapped);
      setLoading(false);
    }

    load();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [query, range, customFrom, customTo]);

  // ── Range filter ─────────────────────────────────────────────────────────
  const rangedSessions = useMemo(
    () => sessions.filter((s) => isInRange(s.startedAt, range, customFrom, customTo)),
    [sessions, range, customFrom, customTo]
  );

  // ── Statistics (over range) ──────────────────────────────────────────────
  const statistics = useMemo(() => {
    if (rangedSessions.length === 0) {
      return { lastScore: 0, highestScore: 0, averageScore: 0, totalSessions: 0 };
    }
    const scores = rangedSessions.map((s) => s.performance.score);
    // rangedSessions is sorted descending by startedAt, so index 0 = most recent
    return {
      lastScore: scores[0],
      highestScore: Math.max(...scores),
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      totalSessions: rangedSessions.length,
    };
  }, [rangedSessions]);

  // ── Search + sort ────────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = rangedSessions.filter((s) => {
      const title = s.lesson?.title ?? "";
      return (
        title.toLowerCase().includes(q) ||
        new Date(s.startedAt).toLocaleDateString().toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const cmp =
        sortField === "date"
          ? a.startedAt - b.startedAt
          : a.performance.score - b.performance.score;
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [rangedSessions, query, sortField, sortDirection]);

  function handleSort(field: "date" | "score") {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function printReport() {
    window.print();
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSessions.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  return (
    <div className="p-16 bg-[#F8F6F1] min-h-screen">
      {/* Breadcrumb */}
      <div className="gap-2 p-2 flex items-center">
        <span className="text-2xl text-[#6E6E73] font-medium">
          {breadcrumbs[0]?.[0]?.toUpperCase() + breadcrumbs[0]?.slice(1) || "Dashboard"}
        </span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2" />
        <span className="text-2xl text-[#151517] font-medium">SASR Report</span>
      </div>

      <div className="bg-[#FEFEFE] w-full rounded-2xl p-6 mt-4">

        {/* Statistics */}
        <div className="flex justify-between pt-4 border-b border-[#E3E3E3] pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
            {loading ? (
              <div className="col-span-4 text-gray-400 text-sm">Loading statistics…</div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[#6E6E73] text-sm font-medium">Last Score</span>
                  <span className="text-[#151517] text-3xl font-bold">{statistics.lastScore}%</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[#6E6E73] text-sm font-medium">Highest Score</span>
                  <span className="text-3xl font-bold text-green-600">{statistics.highestScore}%</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[#6E6E73] text-sm font-medium">Average Score</span>
                  <span className="text-3xl font-bold text-blue-600">{statistics.averageScore}%</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[#6E6E73] text-sm font-medium">Total Sessions</span>
                  <span className="text-3xl font-bold text-purple-600">{statistics.totalSessions}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download Data">
              <Download className="w-5 h-5 text-[#151517]" />
            </button>
            <button onClick={printReport} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Print Report">
              <Printer className="w-5 h-5 text-[#151517]" />
            </button>
          </div>
        </div>

        {/* Search + Range */}
        <div className="flex justify-between mt-6 gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Quick Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pl-10 text-[#151517] placeholder-[#B9B9B9] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RangeType)}
              className="appearance-none rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pr-10 text-[#151517] text-[14px] font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="3month">3 Months</option>
              <option value="custom">Custom</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Custom date range */}
        {range === "custom" && (
          <div className="flex gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-6">
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="text-sm text-gray-500 border-b border-[#DEDEDE] bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-gray-700">
                      Date <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Attempt</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <button onClick={() => handleSort("score")} className="flex items-center gap-1 hover:text-gray-700">
                      Score <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Mistakes</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading sessions…</td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No SASR sessions found</td>
                  </tr>
                ) : (
                  currentItems.map((session) => {
                    // mistakeEvents is stored as jsonb — count wrong_pitch mistakes
                    const mistakeCount =
                      (session.mistakeEvents as { kind: string }[] | undefined)
                        ?.filter((e) => e.kind === "wrong_pitch").length ?? 
                      session.performance.incorrectNotes ?? 0;

                    const completed = session.performance.score === 100 ||
                      (session.performance.incorrectNotes ?? 0) < 3;

                    return (
                      <tr key={session.id} className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">{session.lesson.title}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(session.startedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{session.performance.attempts}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              session.performance.score >= 90 ? "text-green-600"
                              : session.performance.score >= 70 ? "text-blue-600"
                              : session.performance.score >= 50 ? "text-yellow-600"
                              : "text-red-600"
                            }`}>
                              {session.performance.score}%
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  session.performance.score >= 90 ? "bg-green-500"
                                  : session.performance.score >= 70 ? "bg-blue-500"
                                  : session.performance.score >= 50 ? "bg-yellow-500"
                                  : "bg-red-500"
                                }`}
                                style={{ width: `${session.performance.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{mistakeCount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            completed ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-700"
                          }`}>
                            {completed ? "Completed" : "Stopped"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="rounded-full p-1 hover:bg-gray-200">
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && filteredSessions.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(currentItems.length, itemsPerPage)} of {filteredSessions.length} sessions
                </div>
                <div className="flex gap-6">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                    className="text-[14px] text-[#09090B] font-medium disabled:opacity-50">
                    Previous
                  </button>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}
                    className="text-[14px] text-[#09090B] font-medium disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .bg-[#F8F6F1] { background: white !important; }
        }
      `}</style>
    </div>
  );
}