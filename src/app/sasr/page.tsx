/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import Image from "next/image";

const data = [
  { date: "05/22/2025", score: 90 },
  { date: "05/23/2025", score: 60 },
  { date: "05/24/2025", score: 10 },
  { date: "05/25/2025", score: 25 },
  { date: "05/26/2025", score: 70 },
  { date: "05/27/2025", score: 55 },
  { date: "05/28/2025", score: 45 },
  { date: "05/29/2025", score: 20 },
];

export default function Page() {
  const [lastScore] = useState(200);
  const [highScore] = useState(800);

  const tiers = [
    { level: "Fundamental", score: 189 },
    { level: "Elementary", score: 340 },
    { level: "Intermediate", score: 473 },
    { level: "Advance", score: 565 },
    { level: "Assistant Instructor", score: 768 },
    { level: "Certified Instructor", score: 1146 },
    { level: "Senior Instructor", score: 1252 },
    { level: "Pro Pianist", score: 1436 },
    { level: "Sight Reading Star", score: 1620 },
    { level: "Top Performer", score: 1900 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5ef] flex flex-col items-center p-8 w-full">
      <div className="max-w-[90%] w-full flex flex-col md:flex-row gap-6">
        
        {/* Left Section */}h-[552px]
        <div className="flex-1 ">
          {/* Top bar */}
          <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-6">
              <div className="text-gray-600">
               
               <div className="flex items-center">
                    <Image src="assets/Star.svg" alt="star" width={24} height={24} className="inline-block mr-2"/>
                    <p className="text-2xl font-bold text-[#FFA801]">{lastScore}</p>
               </div>
                
                <p className="font-semibold text-[12px] text-[#0A0A0B"> Last Score</p>
              </div>
              <div className="text-gray-600">
                <div className="flex items-center">
                    <Image src="Frame.svg" alt="star" width={24} height={24} className="inline-block mr-2"/>
                    <p className="text-2xl font-bold text-[#FFA801]">{highScore}</p>
               </div>
                
                <p className="font-semibold text-[12px] text-[#0A0A0B"> High Score</p>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] ... text-[#151517] text-[16px] px-4 py-2 rounded-lg font-normal transition">
              Start new test ➜
            </button>
          </div>

          {/* Graph */}
          <div className="mt-4 bg-white p-6 rounded-2xl shadow-md h-[686px]">
            <div className="flex justify-between items-center">
                <h2 className=" mb-2 text-[#0A0A0B] text-2xl font-bold">Your SASR Scores</h2>
                <button className="flex bg-[#581845] text-white text-[14px] px-[8px] py-[16px] rounded-[16px] w-[180px] items-center justify-center">
                    View full history
                    <Image src="autoplay.svg" alt="arrow" width={20} height={12} className="inline-block ml-2"/>
                </button>
            </div>
            
            <div className="bg-[#faf7f0] rounded-xl p-4 relative mt-4 border-4 border-[#BCBCBC] ">
              
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b6d3b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b6d3b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#8b6d3b" fill="url(#colorScore)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-80 bg-[#3e3b34] text-white rounded-2xl shadow-md p-6">
          <div className="bg-[#d4af37] text-black text-center font-bold py-2 rounded-lg mb-4 h-20">
            SASR Tier List
          </div>
          <div className="overflow-y-auto max-h-[650px] h-full border-2 p-4 rounded-2xl">
            <table className="w-full text-left text-sm ">
              <thead>
                <tr className="border-b border-[#FEFEFE]">
                  <th className="py-1 text-2xl">Level</th>
                  <th className="py-1 text-right text-2xl">Score</th>
                </tr>
              </thead>
              <tbody className="">
                {tiers.map((tier) => (
                  <tr key={tier.level} className="">
                    <td className="py-2 text-[16px] text-[#FEFEFE]">{tier.level}</td>
                    <td className="py-2 text-right text-[16px] text-[#FEFEFE]">{tier.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
