"use client";

import { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";

import { getSessions, PracticeSession } from "@/datastore/sessionstorage";

export default function SASRReport() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  // Load sessions
  useEffect(() => {
    const data = getSessions();
    setSessions(data);
  }, []);

  // Format date like: 05/22/2025
  function formatDate(timestamp: number) {
    const d = new Date(timestamp);

    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();

    return `${month}/${day}/${year}`;
  }

  // Filter + Aggregate SASR sessions
  const chartData = useMemo(() => {
    const dailyMap: Record<
      string,
      { total: number; count: number }
    > = {};

    // 1️⃣ Filter SASR
    const sasrSessions = sessions.filter(
      (s) => s.lesson?.source?.toUpperCase() === "SASR"
    );

    // 2️⃣ Group by Date
    sasrSessions.forEach((session) => {
      const dateKey = formatDate(session.endedAt);
      const score = session.performance.score;

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          total: 0,
          count: 0,
        };
      }

      dailyMap[dateKey].total += score;
      dailyMap[dateKey].count += 1;
    });

    // 3️⃣ Convert to Chart Format (Average Per Day)
    const result = Object.entries(dailyMap).map(
      ([date, info]) => ({
        date,
        score: Math.round(info.total / info.count), // Average
      })
    );

    // 4️⃣ Sort by Date
    result.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    return result;
  }, [sessions]);

  // Empty State
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No SASR sessions yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient
            id="colorScore"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="2%" stopColor="#581845" stopOpacity={1} />
            <stop offset="100%" stopColor="#581845" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
        />

        <YAxis domain={[0, 100]} />

        <CartesianGrid
          strokeDasharray="6 6"
          opacity={0.4}
        />

        <Tooltip />

        <Area
          dataKey="score"
          type="monotone"
          stroke="#581845"
          fill="url(#colorScore)"
          strokeWidth={2}
          dot={{
            r: 4,
            fill: "#fff",
            stroke: "#581845",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
