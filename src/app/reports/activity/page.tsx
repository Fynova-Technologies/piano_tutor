/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';   
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import {
  getSessions,
  PracticeSession,
  } from "@/datastore/sessionstorage";


export default function ActivitiesReportPage() {
    const pathname = usePathname();
    const breadcrumbs = pathname.split('/').filter((segment) => segment);
    const [query, setQuery] = useState("");
    const [sessions, setSessions] = useState<PracticeSession[]>([]);    

    const thisWeek = sessions.filter((s) =>
      isThisWeek(s.startedAt)
    );

    /* Aggregation */
    const totalTime = thisWeek.reduce(
      (sum, s) => sum + s.durationSec,
      0
    );
  
        useEffect(() => {
      setSessions(getSessions());
    }, []);

    type RangeType = "week" | "month" | "3month" | "custom";

    const [range, setRange] = useState<RangeType>("week");
    // const [customFrom, setCustomFrom] = useState<string>("");
    // const [customTo, setCustomTo] = useState<string>("");

    /* Helper: Check if date is in current week */
    function isThisWeek(timestamp: number) {
      const now = new Date();
      const startOfWeek = new Date(now);
    
      // Monday as start
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
    
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
    
      return (
        timestamp >= startOfWeek.getTime() &&
        timestamp < endOfWeek.getTime()
      );
    }

    /* Format seconds → mm:ss */
    function formatTime(sec: number) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
    }
    
    const lessonStats = useMemo(() => {
      const map: Record<string, any> = {};
    
      sessions.forEach((s) => {
        const key = `${s.lesson.id}__${s.lesson.source}`;
        
        if (!map[key]) {
          map[key] = {
            id: key,
            lessonId: s.lesson.id,
            title: s.lesson.title,
            source: s.lesson.source,
            date: s.startedAt,
            attempt: 0,
            timespent: 0,
            score: 0,
            count: 0,
          };
        }
      
    if (s.startedAt < map[key].date) {
          map[key].date = s.startedAt;
        }
      
        map[key].attempt += s.performance.attempts;
        map[key].timespent += s.durationSec;
        map[key].score += s.performance.score;
        map[key].count += 1;
      });
    
      return Object.values(map).map((l: any) => ({
        ...l,
        score: Math.round(l.score / l.count),
      }));
    }, [sessions]);

    const filteredLessons = useMemo(() => {
  return lessonStats.filter(
    (l: any) =>
      l.title
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      l.source
        .toLowerCase()
        .includes(query.toLowerCase())
  );
}, [lessonStats, query]);

  return (
    <div className="p-16 bg-[#F8F6F1] h-[100vh]" >
      <div className="gap-2 p-2 flex items-center ">
        <span className="text-2xl text-[#6E6E73] font-medium">{breadcrumbs[0][0].toUpperCase() + breadcrumbs[0].slice(1)}</span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2"/>
        <span className="text-2xl text-[#151517] font-medium">My Activity</span>
      </div>
      <div className="bg-[#FEFEFE] w-full h-[577px] rounded-2xl p-6 mt-4">
        {/* info and print section */}
        <div className="flex justify-between pt-4">
          <div className="flex flex-col gap-4 p-6 border-b border-[#E3E3E3] text-[#151517] text-[18px] font-medium" >
            <span className="gap-1">Lessons : {lessonStats.length}</span>
            <span className="gap-1">Total Time : {Math.round(totalTime / 60)} Mins</span>
          </div>
          <div>
            <div className="text-[#151517] space-x-8">
              <Image src="/downloadbutton.svg" alt="download" width={21} height={21} className="inline-block"/>
              <Image src="/printreport.svg" alt="print" width={21} height={21} className="inline-block"/>
            </div>

          </div>

        </div>
        {/* search and dropdown */}
        <div className="flex justify-between">
          <div className="relative w-full max-w-md ml-4">
            <input
              type="text"
              placeholder="Quick Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E8E8E9] bg-[#FEFEFE] px-4 py-2 pl-10 text-[#151517] placeholder-[#B9B9B9] "
            />

            {/* Search Icon */}
            <Image src="/searchicon.svg" alt="search" width={14} height={14} className="absolute left-3 top-1/2 transform -translate-y-1/2"/>
          </div>
          <div>
            {/* Dropdown can be added here */}
            <div className="relative ">
               <select
                value={range}
                onChange={(e) => setRange(e.target.value as RangeType)}
                className="
                   appearance-none
                  rounded-lg border border-[#E8E8E9]
                  bg-[#FEFEFE] px-4 py-2 pr-10
                  text-[#151517] text-[14px] font-medium
                  hover:bg-gray-500/60 focus:outline-none
                  ">
                <option className="text-[14px] text-[#151517] font-medium" value="week">Week</option>
                <option value="month" className="text-[14px] text-[#151517] font-medium">Month</option>
                <option value="3month" className="text-[14px] text-[#151517] font-medium">3 Months</option>
                <option value="custom" className="text-[14px] text-[#151517] font-medium">Custom</option>
              </select>
              <Image src="/Icon3.svg" alt="dropdown" width={12} height={12} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"/>
            </div>

          </div>

        </div>
        {/* contents */}
        <div className="mt-6 ml-4">
          <div className="rounded-xl border  bg-white">
            <table className="w-full border-collapse">
              <thead className="text-sm text-gray-500 border-b border-[#DEDEDE]">
                <tr className="">
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">Source</th>

                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left font-medium">Attempts</th>

                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Time Spent <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Score <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </div>
                  </th>

                  <th className="px-6 py-4" />
                </tr>
              </thead>

              <tbody>
                {filteredLessons.map(lesson => (
                  <tr key={lesson.id} className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100transition">

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {lesson.title}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{lesson.source}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(lesson.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{lesson.attempt}</td>
                    <td className="px-6 py-4 text-gray-700">  {formatTime(lesson.timespent)} Mins</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {lesson.score} %
                    </td>
                
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-full p-1 hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredLessons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination UI */}
            <div className="flex justify-end gap-6 px-6 py-4 mr-16 "> 
              <button className=" text-[14px] text-[#09090B] font-medium">Previous</button>
              <button className=" text-[14px] text-[#09090B] font-medium">Next</button>
            </div>
          </div>
        </div>
      </div>

     
    </div>
  );
}


