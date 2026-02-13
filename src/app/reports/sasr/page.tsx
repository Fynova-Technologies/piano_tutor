'use client';

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, MoreVertical, Download, Printer } from "lucide-react";
import { sasrDataStore, SASRSessionData } from "@/datastore/sasrdatastore";

type RangeType = "week" | "month" | "3month" | "custom";

export default function SASRReportPage() {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = pathname.split('/').filter((segment) => segment);
  
  const [sessions, setSessions] = useState<SASRSessionData[]>([]);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeType>("month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [sortField, setSortField] = useState<'date' | 'score'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, [range, customFrom, customTo]);

  function loadSessions() {
    let loadedSessions: SASRSessionData[];

    if (range === 'custom' && customFrom && customTo) {
      const startDate = new Date(customFrom);
      const endDate = new Date(customTo);
      loadedSessions = sasrDataStore.getSessionsByDateRange(startDate, endDate);
    } else {
      const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
      loadedSessions = sasrDataStore.getRecentSessions(days);
    }

    setSessions(loadedSessions);
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    if (sessions.length === 0) {
      return {
        lastScore: 0,
        highestScore: 0,
        averageScore: 0,
        totalSessions: 0
      };
    }

    const scores = sessions.map(s => s.score);
    const lastScore = sessions[sessions.length - 1]?.score || 0;
    const highestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      lastScore,
      highestScore,
      averageScore,
      totalSessions: sessions.length
    };
  }, [sessions]);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter(session =>
      session.title.toLowerCase().includes(query.toLowerCase()) ||
      new Date(session.date).toLocaleDateString().includes(query.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'score') {
        comparison = a.score - b.score;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [sessions, query, sortField, sortDirection]);

  function handleSort(field: 'date' | 'score') {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function exportData() {
    const jsonData = sasrDataStore.exportSessions();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sasr-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="p-16 bg-[#F8F6F1] min-h-screen">
      <div className="gap-2 p-2 flex items-center">
        <span className="text-2xl text-[#6E6E73] font-medium">
          {breadcrumbs[0]?.[0]?.toUpperCase() + breadcrumbs[0]?.slice(1) || 'Dashboard'}
        </span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2"/>
        <span className="text-2xl text-[#151517] font-medium">SASR Report</span>
      </div>

      <div className="bg-[#FEFEFE] w-full rounded-2xl p-6 mt-4">
        {/* Statistics Section */}
        <div className="flex justify-between pt-4 border-b border-[#E3E3E3] pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
            <div className="flex flex-col gap-2">
              <span className="text-[#6E6E73] text-sm font-medium">Last Score</span>
              <span className="text-[#151517] text-3xl font-bold">{statistics.lastScore}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#6E6E73] text-sm font-medium">Highest Score</span>
              <span className="text-[#151517] text-3xl font-bold text-green-600">{statistics.highestScore}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#6E6E73] text-sm font-medium">Average Score</span>
              <span className="text-[#151517] text-3xl font-bold text-blue-600">{statistics.averageScore}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[#6E6E73] text-sm font-medium">Total Sessions</span>
              <span className="text-[#151517] text-3xl font-bold text-purple-600">{statistics.totalSessions}</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <button 
              onClick={exportData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download Data"
            >
              <Download className="w-5 h-5 text-[#151517]" />
            </button>
            <button 
              onClick={printReport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print Report"
            >
              <Printer className="w-5 h-5 text-[#151517]" />
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex justify-between mt-6 gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Quick Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pl-10 text-[#151517] placeholder-[#B9B9B9] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            <svg 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Custom Date Range */}
        {range === 'custom' && (
          <div className="flex gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-[#E8E8E9] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Sessions Table */}
        <div className="mt-6">
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="text-sm text-gray-500 border-b border-[#DEDEDE] bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <button 
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Date 
                      <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Attempt</th>
                  <th className="px-6 py-4 text-left font-medium">
                    <button 
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Score 
                      <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Mistakes</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session, idx) => (
                  <tr 
                    key={session.id} 
                    className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {session.title}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {session.attempt}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          session.score >= 90 ? 'text-green-600' :
                          session.score >= 70 ? 'text-blue-600' :
                          session.score >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {session.score}%
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              session.score >= 90 ? 'bg-green-500' :
                              session.score >= 70 ? 'bg-blue-500' :
                              session.score >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${session.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.mistakeCount === 0 ? 'bg-green-100 text-green-800' :
                        session.mistakeCount < 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.mistakeCount} {session.mistakeCount === 1 ? 'mistake' : 'mistakes'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.completedFully ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.completedFully ? 'Completed' : 'Stopped'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-full p-1 hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      {sessions.length === 0 ? (
                        <div>
                          <p className="text-lg mb-2">No practice sessions recorded yet</p>
                          <p className="text-sm">Start practicing to see your progress!</p>
                        </div>
                      ) : (
                        <p>No results found matching your search</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination UI */}
            {filteredSessions.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filteredSessions.length} of {sessions.length} sessions
                </div>
                <div className="flex gap-6">
                  <button className="text-[14px] text-[#09090B] font-medium hover:text-purple-600 transition-colors">
                    Previous
                  </button>
                  <button className="text-[14px] text-[#09090B] font-medium hover:text-purple-600 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .bg-[#F8F6F1] {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}