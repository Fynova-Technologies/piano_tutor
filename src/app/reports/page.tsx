"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import SasrReport from "@/features/components/sasrreport";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSessions, PracticeSession } from "@/datastore/sessionstorage";
import ActivityChart from "@/features/components/activitychart";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import Footer from "@/features/home/footer";

const supabase = getSupabaseBrowserClient();

type ViewMode = "week" | "month";

// ── Supabase-based activity builders ──────────────────────────────────────────

function buildWeeklyActivity(sessions: { startedAt: number; performance: { score: number } }[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map: Record<string, { total: number; count: number }> = {};
  days.forEach((d) => (map[d] = { total: 0, count: 0 }));

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  sessions.forEach((s) => {
    const d = new Date(s.startedAt);
    if (d >= startOfWeek && d < endOfWeek) {
      const label = days[d.getDay()];
      map[label].total += s.performance?.score ?? 0;
      map[label].count += 1;
    }
  });

  return days.map((day) => ({
    day,
    score: map[day].count > 0 ? Math.round(map[day].total / map[day].count) : 0,
  }));
}

function buildMonthlyActivity(sessions: { startedAt: number; performance: { score: number } }[]) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const map: Record<string, { total: number; count: number }> = {};
  months.forEach((m) => (map[m] = { total: 0, count: 0 }));

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  sessions.forEach((s) => {
    const d = new Date(s.startedAt);
    if (d >= startOfYear) {
      const label = months[d.getMonth()];
      map[label].total += s.performance?.score ?? 0;
      map[label].count += 1;
    }
  });

  return months.map((month) => ({
    month,
    score: map[month].count > 0 ? Math.round(map[month].total / map[month].count) : 0,
  }));
}

type LevelProgressRow = {
  level: string;
  high_score: number;
  high_points: number;
  last_score: number;
  last_points: number;
  unlocked: boolean;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Reports() {
  const router = useRouter();
  const [levelProgress, setLevelProgress] = useState<LevelProgressRow[]>([]);
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progressLoaded, setProgressLoaded] = useState(false);  

  useEffect(() => {
      let active = true;
  
      async function loadProgress() {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Failed to get user for SASR level gating:", userError);
          if (active) setProgressLoaded(true);
          return;
        }
  
        const userId = userData.user?.id;
        if (!userId) {
          if (active) setProgressLoaded(true);
          return;
        }
  
        const { data, error } = await supabase
          .from("user_sasr_level_progress")
          .select("level, high_score, high_points, last_score, last_points, unlocked, updated_at")
          .eq("user_id", userId);
  
        if (error) {
          console.error("Failed to load SASR level progress:", error);
        } else if (active) {
          setLevelProgress(data ?? []);
          console.log("level progress", data);
        }
  
        if (active) setProgressLoaded(true);
      }
  
      loadProgress();
      return () => {
        active = false;
      };
    }, [supabase]);

   const mostRecentRow = levelProgress.reduce<LevelProgressRow | null>((latest, row) => {
    if (!latest) return row;
    return new Date(row.updated_at) > new Date(latest.updated_at) ? row : latest;
  }, null);
  const lastScore = mostRecentRow?.last_points ?? 0;

  const highScore = levelProgress.length > 0
    ? Math.max(...levelProgress.map((row) => row.high_points))
    : 0;
  

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [playedDays, setPlayedDays] = useState<Set<string>>(new Set());
  const [calendarDays, setCalendarDays] = useState<(string | null)[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  // near your other useState declarations
  const [sasrRange, setSasrRange] = useState<"week" | "month">("month");

  async function fetchAllSessionsFromSupabase(): Promise<PracticeSession[]> {
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (error || !data) {
      console.error("Failed to fetch sessions:", error?.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
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

  useEffect(() => {
    fetchAllSessionsFromSupabase()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  // ── Derived activity chart data (from the same Supabase sessions) ─────────
  const activityData =
    viewMode === "week"
      ? buildWeeklyActivity(sessions)
      : buildMonthlyActivity(sessions);

  // ── Derived SASR sessions + flag + attempts count ──────────────────────────
  // "attempts" now reflects the actual number of SASR sessions on record,
  // instead of the previous hardcoded placeholder of 15.
  const sasrSessions = sessions.filter(
    (s) => s.lesson?.source?.toUpperCase() === "SASR"
  );
  const hasSasrData = sasrSessions.length > 0;
  const attempts = sasrSessions.length;

  // ── Streak calendar (still from localStorage — unchanged) ─────────────────
  useEffect(() => {
    const data = getSessions();
    const uniqueDays = new Set<string>(
      data.map((s: PracticeSession) => {
        const d = new Date(s.startedAt);
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      })
    );
    setPlayedDays(uniqueDays);
  }, []);

  useEffect(() => {
    generateCalendar(currentDate);
  }, [currentDate]);

  function nextMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function prevMonth() {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  const monthLabel = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  function generateCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    }
    setCalendarDays(days);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  return (
    <>
    <div className="min-h-screen bg-[#f8f5ef] p-8 flex flex-col items-center gap-8">
      {/* Top Charts */}
      <div className="grid md:grid-cols-2 gap-8 w-full p-8">

        {/* Activity Chart */}
        <div className="bg-white shadow-[2px_4px_8px_1px_#0000003B] rounded-2xl p-4 border-4 border-[#C0BABA] border-r-[#BCBCBC]">
          <ActivityChart
            sessionCount={sessions.length}
            loading={loading}
            data={activityData}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onViewReports={() => router.push("/reports/activity")}
          />
        </div>

        {/* SASR Growth Report */}
        <div className="bg-white shadow-md rounded-xl p-4 border-4 border-[#C0BABA] border-r-[#BCBCBC]">
          <div className="flex justify-between items-center mb-2">
  <h2 className="text-[#151517] text-[16px] font-medium">SASR Growth Report</h2>
  <div className="relative">
    <select
      value={sasrRange}
      onChange={(e) => setSasrRange(e.target.value as "week" | "month")}
      className="bg-[#E4E4E4] rounded-lg px-4 py-2 pr-8 text-sm text-[#151517] cursor-pointer appearance-none"
    >
      <option value="week">Week</option>
      <option value="month">Month</option>
    </select>
    <Image
      src="/Icon3.svg"
      alt="dropdown"
      width={12}
      height={12}
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
    />
  </div>
</div>
<div className="h-75 mt-8">
  <SasrReport sessions={sessions} loading={loading} range={sasrRange} />
</div>
          {hasSasrData && (
            <div className="text-center mt-4">
              <button onClick={()=>router.push("/reports/sasr")} className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 mx-auto">
                View Reports <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2"/>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Section */}

      <div className="flex p-4 md:p-8 w-full h-full">
    <div className="flex flex-col md:flex-row w-full gap-6 md:gap-8 h-full">
        {/* Streak Calendar */}
      <div className="bg-white shadow-md rounded-xl p-6 border-4 border-[#C0BABA] w-full md:w-[360px]">
  {/* Header */}
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center gap-16">
      <h3 className="font-medium text-[16px] text-[#151517]">Streak</h3>
    </div>

    <div className="flex items-center gap-4">
      <span className=" text-[13px] font-medium text-[#151517]">
        {monthLabel}
      </span>
      <ChevronLeft
        className="w-6 h-6 text-[#151517] cursor-pointer"
        onClick={prevMonth}
        strokeWidth={3}
      />

      <ChevronRight
        className="w-6 h-6 text-[#151517] cursor-pointer"
        onClick={nextMonth}
        strokeWidth={3}
      />
    </div>
  </div>

  {/* Weekday header */}
  <div className="grid grid-cols-7 text-xs text-[#151517] mb-2 text-center">
    <div>Sun</div>
    <div>Mon</div>
    <div>Tue</div>
    <div>Wed</div>
    <div>Thu</div>
    <div>Fri</div>
    <div>Sat</div>
  </div>

  {/* Calendar grid */}
  <div className="grid grid-cols-7 border-[0.35px] border-[#6E6E73]">

  {calendarDays.map((day, i) => {

    if (!day) {
      return (
        <div key={i} className="h-12 border-[0.35px] border-[#6E6E73] text-[#151517]"></div>
      );
    }

    const played = playedDays.has(day);
    const isToday = day === todayKey;
    const dayNumber = parseInt(day.split("-")[2]);

    return (
      <div
        key={day}
        className={`h-12 flex flex-col items-center justify-center
        ${
          isToday
            ? "bg-[#581845] text-white border-[#581845]"
            : played
            ? "border-1 border-yellow-400 bg-yellow-50"
            : "border-[0.35px] border-[#6E6E73]"
        }`}
      >
        <span className={`${played && isToday ? "text-white" : "text-[#151517]"} text-sm`}>{dayNumber}</span>

        {played && (
          <span className="text-xs text-yellow-500 leading-none">⭐</span>
        )}
      </div>
    );
  })}

</div>

</div>

        {/* Sight Reading */}
      <div className="bg-white shadow-md rounded-xl p-6 border-4 border-[#C0BABA] border-r-[#BCBCBC] h-auto md:h-[345px] w-full md:w-[360px]">          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-[16px] text-[#151517]">Sight Reading</h3>
            <div className="bg-[#E3E3E3] py-[10px] px-[16px] rounded-2xl text-[#151517] text-[16px] font-medium ">
              {attempts} Attempts
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-10">
            <div className="bg-[#E3E3E3] rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex justify-center space-x-2"><Image src="/Frame.svg" height={18} width={18} alt="award"/><span className="text-[#151517] text-[14px] font-normal text-center"> Highest Score</span></div>
                <span className=" text-[#151517] text-[16px] font-medium">{highScore}</span>
              </div>
              <div className="flex justify-between items-center  mt-2">
                <div className="flex justify-center space-x-2"><Image src="/assets/Star.svg" className="fill-red-500" height={18} width={18} alt="award"/><span className="text-[#151517] text-[14px] font-normal text-center"> Last Score</span></div>
                <span className=" text-[#151517] text-[16px] font-medium">{lastScore}</span>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl  transition flex items-center justify-center gap-2 mx-auto mt-10">
              View Reports <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2"/>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Footer />
    </>
  );
}