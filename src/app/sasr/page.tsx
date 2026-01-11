/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, Legend, CartesianGrid } from "recharts";
import Image from "next/image";
import SASRReport from "@/features/components/sasrreport";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [lastScore] = useState(200);
  const [highScore] = useState(800);
  const imagePath = "/piano.jpg";

  const tiers = [
    { level: "Fundamental", score: 189, range: "0-189" },
    { level: "Elementary", score: 340, range: "190-340" },
    { level: "Intermediate", score: 473, range: "341-473" },
    { level: "Advance", score: 565, range: "474-565" },
    { level: "Assistant Instructor", score: 768, range: "566-768" },
    { level: "Certified Instructor", score: 1146, range: "769-1146" },
    { level: "Senior Instructor", score: 1252, range: "1147-1252" },
    { level: "Pro Pianist", score: 1436, range: "1253-1436" },
    { level: "Sight Reading Star", score: 1620, range: "1437-1620" },
    { level: "Top Performer", score: 1900, range: "1621-1900" },
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
                    <p className="text-2xl font-bold text-[#FFA801] m-0 p-0">{lastScore}</p>
               </div>
                
                <p className="font-semibold text-[12px] text-[#0A0A0B]"> Last Score</p>
              </div>
              <div className="text-gray-600">
                <div className="flex items-center">
                    <Image src="Frame.svg" alt="star" width={24} height={24} className="inline-block mr-2"/>
                    <p className="text-2xl font-bold text-[#FFA801] m-0 p-0">{highScore}</p>
               </div>
                
                <p className="font-semibold text-[12px] text-[#0A0A0B]"> High Score</p>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] ... text-[#151517] text-[16px] px-6 py-3 rounded-2xl  transition">
              Start new test
              <Image src="Union.svg" alt="arrow" width={20} height={12} className="inline-block ml-2"/>
            </button>
          </div>

          {/* Graph */}
          <div className="mt-4 bg-white p-6 rounded-2xl shadow-md h-[686px]">
            <div className="flex justify-between items-center">
                <h2 className=" mb-2 text-[#0A0A0B] text-2xl font-bold">Your SASR Scores</h2>
                <button onClick={() => router.push("/reports/sasr")} className="flex bg-[#581845] text-white text-[14px] px-[16px] py-[8px] font-medium rounded-[16px] items-center justify-center">
                    View full history
                    <Image src="frame2.svg" alt="arrow" width={30} height={30} className="inline-block ml-2"/>
                </button>
            </div>
            
            <div className="bg-[#faf7f0] rounded-xl p-4 relative mt-4 border-4 border-[#BCBCBC] ">
              
              <div className="h-96">
                <SASRReport />
                
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className={`w-full md:w-[30%] bg-[#3e3b34] text-white rounded-2xl shadow-md p-6 bg-cover relative`}   style={{ backgroundImage: `url('${imagePath}')` }}>
          <div className="absolute inset-0 bg-neutral-600/85 rounded-2xl" />
          <div className="relative">
            <div className= "relative z-10">
              <div className=" text-black text-center font-bold py-2 rounded-lg w-full">
                <Image src="/Ribbon.svg" alt="Trophy" width={300} height={200} className="object-cover h-[40%] z-100 w-full"/>
              </div>
            </div>
            <div className="relative -mt-[18%]">
              <div className="overflow-y-auto relative rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-white to-[#D4AF37]" />
                <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-white to-[#D4AF37]" />
                <div className="border-l-2 border-r-2 border-l-white border-r-[#D4AF37] rounded-2xl p-4 bg-gradient-to-r from-[#D4AF3766] to-[#D4AF3700]">
                <table className="w-full text-left text-sm mt-4">
                  <thead className="underline">
                    <tr className="border-b border-[#FEFEFE]">
                      <th className="py-1 text-2xl">Level</th>
                      <th className="py-1 text-center text-2xl">Score</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {tiers.map((tier) => (
                      <tr key={tier.level} className="">
                        <td className="py-2 text-[16px] text-[#FEFEFE] font-medium flex flex-col space-y-3"><span>{tier.level}</span><span className="text-[14px] text-[#C1C1C1] font-medium">Range : {tier.range}</span></td>
                        
                        <td className="py-2 text-center text-[16px] font-medium text-[#FEFEFE]">{tier.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
