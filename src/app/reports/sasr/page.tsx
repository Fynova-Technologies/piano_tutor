/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { PracticeSession } from "@/datastore/sessionstorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import Image from "next/image";

const supabase = getSupabaseBrowserClient();

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: PracticeSession[] = data.map((r: any) => ({
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
      return { lastScore: 0, highestScore: 0 };
    }
    const scores = rangedSessions.map((s) => s.performance.score);
    // rangedSessions is sorted descending by startedAt, so index 0 = most recent
    return {
      lastScore: scores[0],
      highestScore: Math.max(...scores),
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

  function downloadCSV() {
    if (filteredSessions.length === 0) return;

    const headers = ["Title", "Date", "Attempts", "Score"];
    const escapeCell = (value: string | number) => {
      const str = String(value ?? "");
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = filteredSessions.map((s) => [
      s.lesson.title,
      new Date(s.startedAt).toLocaleDateString(),
      s.performance.attempts,
      s.performance.score,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sasr-report-${range}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredSessions.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  return (
    <div className="p-4 sm:p-8 lg:p-16 bg-[#F8F6F1] min-h-screen">
      {/* Breadcrumb */}
      <div className="gap-2 p-2 flex items-center">
        <span className="text-lg sm:text-2xl text-[#6E6E73] font-medium">
          {breadcrumbs[0]?.[0]?.toUpperCase() + breadcrumbs[0]?.slice(1) || "Dashboard"}
        </span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2" />
        <span className="text-lg sm:text-2xl text-[#151517] font-medium">SASR Report</span>
      </div>

      {/* ── Main table card ────────────────────────────────────────── */}
      <div className="bg-[#FEFEFE] w-full rounded-2xl p-4 sm:p-6 mt-4">
        {/* Header totals */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4">
          <div className="flex flex-col gap-4 p-4 sm:p-6 border-b border-[#E3E3E3] text-[#151517] text-[16px] sm:text-[18px] font-medium">
            {loading ? (
              <span className="text-gray-400 text-sm font-normal">Loading statistics…</span>
            ) : (
              <>
                <span>Last Score : {statistics.lastScore}</span>
                <span>Highest Score : {statistics.highestScore}</span>
              </>
            )}
          </div>
          <div className="text-[#151517] space-x-8 px-4 sm:px-0">
            <Image
              src="/downloadbutton.svg"
              alt="download"
              width={21}
              height={21}
              className="inline-block cursor-pointer"
              onClick={downloadCSV}
            />
            <Image
              src="/printreport.svg"
              alt="print"
              width={21}
              height={21}
              className="inline-block cursor-pointer"
              onClick={printReport}
            />
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
              className="appearance-none rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pr-10 text-[#151517] text-[14px] font-medium hover:bg-gray-500/60 focus:outline-none w-full sm:w-auto"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="3month">3 Months</option>
              <option value="custom">Custom</option>
            </select>
            <Image src="/Icon3.svg" alt="dropdown" width={12} height={12} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Custom date range */}
        {range === "custom" && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4 ml-0 sm:ml-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-6 ml-0 sm:ml-4">
          <div className="rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead className="text-sm text-gray-500 border-b border-[#DEDEDE]">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Title</th>
                    <th className="px-6 py-4 text-left font-medium">
                      <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-gray-700">
                        Date <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left font-medium">Attempts</th>
                    <th className="px-6 py-4 text-left font-medium">
                      <button onClick={() => handleSort("score")} className="flex items-center gap-1 hover:text-gray-700">
                        Score <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        Loading sessions…
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No SASR sessions found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100 transition"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">{session.lesson.title}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{session.performance.attempts}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{session.performance.score}</td>
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
            </div>

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

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}