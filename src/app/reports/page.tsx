"use client";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const activityData = [
  { day: "Sunday", minutes: 15 },
  { day: "Monday", minutes: 30 },
  { day: "Tuesday", minutes: 45 },
  { day: "Wednesday", minutes: 36 },
  { day: "Thursday", minutes: 10 },
  { day: "Friday", minutes: 45 },
  { day: "Saturday", minutes: 60 },
];

const sasrData = [
  { date: "05/22", score: 90 },
  { date: "05/23", score: 60 },
  { date: "05/24", score: 10 },
  { date: "05/25", score: 25 },
  { date: "05/26", score: 70 },
  { date: "05/27", score: 55 },
  { date: "05/28", score: 45 },
  { date: "05/29", score: 20 },
];

export default function Reports() {
  const [month] = useState("June 2025");
  const [attempts] = useState(15);
  const [highestScore] = useState(240);
  const [lastScore] = useState(100);

  return (
    <div className="min-h-screen bg-[#f8f5ef] p-8 flex flex-col items-center gap-8">
      {/* Top Charts */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-6xl">
        
        {/* Activity Chart */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-[#e3dfd6]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-gray-700">Activity Chart</h2>
            <div className="bg-[#f8f5ef] rounded-md px-3 py-1 text-sm text-gray-600 cursor-pointer">
              Week ▼
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#5b2c75" radius={[6,6,0,0]}>
                  {/* Custom label */}
                  {activityData.map((entry, index) => (
                    <text
                      key={`label-${index}`}
                      x={index * 80 + 35}
                      y={180 - entry.minutes * 1.3}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#5b2c75"
                    >
                      {entry.minutes} min
                    </text>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <button className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-lg font-semibold text-black flex items-center justify-center gap-2 mx-auto">
              View Reports ➜
            </button>
          </div>
        </div>

        {/* SASR Growth Report */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-[#e3dfd6]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-gray-700">SASR Growth Report</h2>
            <div className="bg-[#f8f5ef] rounded-md px-3 py-1 text-sm text-gray-600 cursor-pointer">
              Month ▼
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sasrData}>
                <defs>
                  <linearGradient id="colorSasr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b2c75" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5b2c75" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#5b2c75" fill="url(#colorSasr)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <button className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-lg font-semibold text-black flex items-center justify-center gap-2 mx-auto">
              View Reports ➜
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Streak Calendar */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-[#e3dfd6]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Streak</h3>
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 text-sm font-medium">{month}</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>
          </div>

          <table className="w-full text-center text-sm text-gray-700">
            <thead>
              <tr className="font-semibold">
                <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>29</td><td>30</td><td>31</td><td>1</td><td>2</td><td>3⭐</td><td>4⭐</td></tr>
              <tr><td>5⭐</td><td>6</td><td>7⭐</td><td>8⭐</td><td>9⭐</td><td>10⭐</td><td>11</td></tr>
              <tr><td className="bg-purple-800 text-white rounded-full w-8 h-8">12</td><td>13</td><td>14</td><td>15⭐</td><td>16⭐</td><td>17⭐</td><td>18⭐</td></tr>
              <tr><td>19</td><td>20⭐</td><td>21⭐</td><td>22⭐</td><td>23⭐</td><td>24⭐</td><td>25⭐</td></tr>
              <tr><td>26⭐</td><td>27</td><td>28</td><td>29</td><td>30⭐</td><td>1</td><td>2</td></tr>
            </tbody>
          </table>
        </div>

        {/* Sight Reading */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-[#e3dfd6]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Sight Reading</h3>
            <div className="bg-[#f8f5ef] px-3 py-1 rounded-md text-gray-600 text-sm font-medium">
              {attempts} Attempts
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-[#f8f5ef] rounded-lg p-3">
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span>🏆 Highest Score</span>
                <span className="font-semibold">{highestScore}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700 mt-2">
                <span>⭐ Last Score</span>
                <span className="font-semibold">{lastScore}</span>
              </div>
            </div>

            <button className="bg-yellow-400 hover:bg-yellow-500 px-5 py-2 rounded-lg font-semibold text-black flex items-center justify-center gap-2 mx-auto">
              View Reports ➜
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
