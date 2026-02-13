"use client";
import { BarChart, Bar, XAxis, ResponsiveContainer, CartesianGrid,YAxis, Cell } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import SasrReport from "@/features/components/sasrreport";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getWeeklyActivity,
  getMonthlyActivity,
} from "@/datastore/weekormonthactivity";


// const sasrData = [
//   { date: "05/22", score: 90 },
//   { date: "05/23", score: 60 },
//   { date: "05/24", score: 10 },
//   { date: "05/25", score: 25 },
//   { date: "05/26", score: 70 },
//   { date: "05/27", score: 55 },
//   { date: "05/28", score: 45 },
//   { date: "05/29", score: 20 },
// ];



  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomLabel = (props: { x: any; y: any; width: any; value: any; }) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#151517" 
        textAnchor="middle" 
        fontSize="8"
      >
        {value} min
      </text>
    );
  };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomBackground = (props: { x: any; y: any; width: any; height: any; index: any; }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { x, y, width, height, index } = props;
    const bgColor = '#D6DBED66'; 
    return (
      <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
      />
      </g>
    );
  }

export default function Reports() {
  const router = useRouter();
  const [month] = useState("June 2025");
  const [attempts] = useState(15);
  const [highestScore] = useState(240);
  const [lastScore] = useState(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityData, setActivityData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  // Add this inside your Reports component, after the existing state declarations
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// Add this useEffect to handle clicking outside the dropdown
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


 useEffect(() => {
  if (viewMode === "week") {
    const data = getWeeklyActivity();
    console.log("Weekly data:", data); // Add this
    setActivityData(data);
  } else {
    const data = getMonthlyActivity();
    console.log("Monthly data:", data); // Add this
    setActivityData(data);
  }
}, [viewMode]);



  return (
    <div className="min-h-screen bg-[#f8f5ef] p-8 flex flex-col items-center gap-8">
      {/* Top Charts */}
      <div className="grid md:grid-cols-2 gap-8 w-full p-8">
        
        {/* Activity Chart */}
        <div className="bg-white shadow-[2px_4px_8px_1px_#0000003B] rounded-2xl p-4 border-4 border-[#C0BABA] border-r-[#BCBCBC]">
  
  <div className="flex justify-between items-center mb-2">
    <h2 className="text-[#151517] text-[16px] font-medium">Activity Chart</h2>
    
    {/* Dropdown */}
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-[#E4E4E4] rounded-lg px-4 py-2 text-sm text-[#151517] cursor-pointer flex items-center gap-2"
      >
        {viewMode === "week" ? "Week" : "Month"}
        <Image 
          src="/Icon3.svg" 
          alt="dropdown" 
          width={12} 
          height={12} 
          className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <button
            onClick={() => {
              setViewMode("week");
              setIsDropdownOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-sm rounded-t-lg hover:bg-gray-100 ${
              viewMode === "week" ? "bg-white text-[#000000]  font-medium" : "text-[#151517]"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => {
              setViewMode("month");
              setIsDropdownOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-sm rounded-b-lg hover:bg-gray-100 ${
              viewMode === "month" ? "bg-white text-[#000000] font-medium" : "text-[#151517]"
            }`}
          >
            Month
          </button>
        </div>
      )}
    </div>
  </div>

  <div className="h-60 mt-8">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={activityData}
        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="0" 
          stroke="#e5e7eb" 
          vertical={true}
          horizontal={true}
        />
        <XAxis 
          dataKey={viewMode === "week" ? "day" : "month"}                   
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#000000', fillOpacity: "0.8", fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          domain={[0, 100]}
          ticks={[0, 20, 40, 60, 80, 100]}
        />
        <Bar 
          dataKey="minutes" 
          radius={[16, 16, 0, 0]}
          maxBarSize={53}
          label={<CustomLabel x={undefined} y={undefined} width={undefined} value={undefined} />}
          background={<CustomBackground x={undefined} y={undefined} width={undefined} height={undefined} index={undefined} />}
        >
          {activityData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#581845" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>          
  </div>

  <div className="text-center mt-20">
    <button 
      onClick={() => router.push("/reports/activity")} 
      className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 mx-auto"
    >
      View Reports <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2"/>
    </button>
  </div>
</div>

        {/* SASR Growth Report */}
        <div className="bg-white shadow-md rounded-xl p-4 border-4 border-[#C0BABA] border-r-[#BCBCBC]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[#151517] text-[16px] font-medium">SASR Growth Report</h2>
            <div className="bg-[#E4E4E4] rounded-lg px-4 py-2 text-sm text-[#151517] cursor-pointer">
              Month <Image src="/Icon3.svg" alt="dropdown" width={12} height={12} className="inline-block ml-2"/>
            </div>
          </div>
          <div className="h-75 mt-8">
            <SasrReport />
          </div>
          <div className="text-center mt-4">
            <button onClick={()=>router.push("/reports/sasr")} className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] ... text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl  transition flex items-center justify-center gap-2 mx-auto">
              View Reports <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2"/>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section */}

      <div className="flex p-8 w-full h-full">
        <div className="flex w-full space-x-8 h-full">
        {/* Streak Calendar */}
        <div className="bg-white shadow-md rounded-xl p-6 border-4 border-[#C0BABA] border-r-[#BCBCBC] h-[345px] w-[360px]">
          <div className="flex justify-between mb-3">
            <h3 className="font-medium text-[16px] text-[#151517]">Streak</h3>
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
        <div className="bg-white shadow-md rounded-xl p-6 border-4 border-[#C0BABA] border-r-[#BCBCBC] h-[345px] w-[360px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-[16px] text-[#151517]">Sight Reading</h3>
            <div className="bg-[#E3E3E3] py-[10px] px-[16px] rounded-2xl text-[#151517] text-[16px] font-medium ">
              {attempts} Attempts
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-10">
            <div className="bg-[#E3E3E3] rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex justify-center space-x-2"><Image src="/Frame.svg" height={18} width={18} alt="award"/><span className="text-[#151517] text-[14px] font-normal text-center"> Highest Score</span></div>
                <span className=" text-[#151517] text-[16px] font-medium">{highestScore}</span>
              </div>
              <div className="flex justify-between items-center  mt-2">
                <div className="flex justify-center space-x-2"><Image src="/assets/Star.svg" className="fill-red-500" height={18} width={18} alt="award"/><span className="text-[#151517] text-[14px] font-normal text-center"> Last Score</span></div>
                <span className=" text-[#151517] text-[16px] font-medium">{lastScore}</span>
              </div>
            </div>

            <button className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] ... text-[#151517] font-medium text-[14px] px-6 py-3 rounded-2xl  transition flex items-center justify-center gap-2 mx-auto mt-10">
              View Reports <Image src="icon2.svg" alt="arrow" width={16} height={16} className="inline-block ml-2"/>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
