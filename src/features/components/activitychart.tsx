"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

type RangeType = "week" | "month";

interface ActivityDataPoint {
  day?: string;
  month?: string;
  score: number;
}

interface ActivityChartProps {
  /** Pass the same rangedSessions length (or sessions.length) from the parent to decide empty vs data state */
  sessionCount: number;
  loading?: boolean;
  data: ActivityDataPoint[];
  viewMode: RangeType;
  onViewModeChange: (mode: RangeType) => void;
  onViewReports?: () => void;
}

// Ghost bar heights (%) — mimic a real bar chart silhouette
const GHOST_BARS = [
  { height: 72, pink: true },
  { height: 38, pink: false },
  { height: 55, pink: false },
  { height: 90, pink: true },
  { height: 45, pink: false },
  { height: 30, pink: false },
  { height: 62, pink: true },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLabel = (props: { x: any; y: any; width: any; value: any }) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#151517" textAnchor="middle" fontSize="8">
      {value}
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomBackground = (props: { x: any; y: any; width: any; height: any }) => {
  const { x, y, width, height } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#D6DBED66" />
    </g>
  );
};

export default function ActivityChart({
  sessionCount,
  loading = false,
  data,
  viewMode,
  onViewModeChange,
  onViewReports,
}: ActivityChartProps) {
  const router = useRouter();

  const isEmpty = !loading && sessionCount === 0;

  return (
    <div className="bg-white rounded-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#151517] text-[16px] font-medium">Activity Chart</h2>

        {/* Week/Month dropdown */}
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as RangeType)}
            className="bg-[#E4E4E4] rounded-lg border border-[#E8E8E9] px-4 py-2 text-sm text-[#151517] cursor-pointer appearance-none pr-8"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <Image
            src="/Icon3.svg"
            alt="dropdown"
            width={12}
            height={12}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading…
        </div>
      ) : isEmpty ? (
        /* ── Empty state ───────────────────────────────────────────── */
        <div className="relative h-75 flex flex-col items-center justify-center py-6 overflow-hidden">
          <div
            className="absolute inset-0 flex items-end justify-around px-6 pb-4 pointer-events-none"
            aria-hidden="true"
          >
            {GHOST_BARS.map((bar, i) => (
              <div
                key={i}
                className="rounded-t-md flex-1 mx-1"
                style={{
                  height: `${bar.height}%`,
                  background: bar.pink ? "rgba(255, 180, 180, 0.35)" : "transparent",
                  border: bar.pink ? "none" : "1.5px dashed #D0CCC4",
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 52, height: 52, background: "#F0EFED" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="3" stroke="#8E8E93" strokeWidth="1.6" />
                <path d="M3 10H21" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M8 3V7" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M16 3V7" stroke="#8E8E93" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#8E8E93" opacity="0.5" />
              </svg>
            </div>

            <div>
              <p className="text-[#0A0A0B] font-bold text-sm sm:text-base leading-snug">
                No activity recorded yet
              </p>
              <p className="text-[#8E8E93] text-xs sm:text-sm mt-1 max-w-[200px] leading-relaxed">
                Start practicing to generate your weekly activity insights.
              </p>
            </div>

            <button
              onClick={() => router.push("/lessons")}
              className="mt-24 font-bold flex items-center gap-2 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#151517] text-sm px-5 py-2.5 rounded-full shadow-sm"
            >
              Start Practice
              <span className="text-sm">›</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Real chart ──────────────────────────────────────────────── */
        <>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical horizontal />
                <XAxis
                  dataKey={viewMode === "week" ? "day" : "month"}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#000000", fillOpacity: 0.8, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <Bar
                  dataKey="score"
                  radius={[16, 16, 0, 0]}
                  maxBarSize={53}
                  label={<CustomLabel x={undefined} y={undefined} width={undefined} value={undefined} />}
                  background={<CustomBackground x={undefined} y={undefined} width={undefined} height={undefined} />}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#581845" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={onViewReports ?? (() => router.push("/reports/activity"))}
              className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 mx-auto"
            >
              View Reports
              <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}