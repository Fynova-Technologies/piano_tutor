'use client';   
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useMemo } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";


export default function SASRReportPage() {
    const pathname = usePathname();
    const breadcrumbs = pathname.split('/').filter((segment) => segment);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [songs, setSongs] = useState<Array<{id:number; title:string; date:string,attempt:number,score:number;}>>([
      {id:1, title:"Song A",date:"2024-06-01",attempt:1,score:15},
      {id:2, title:"Song B",date:"2024-06-01",attempt:2,score:85},
      {id:3, title:"Song C",date:"2024-06-01",attempt:3,score:25}
    ]);

    const TotalTime = Math.max(...songs.map(song => song.score));
    const [query, setQuery] = useState("");

    const filteredSongs = useMemo(() => {
      return songs.filter(song =>
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.date.toLowerCase().includes(query.toLowerCase())
      );
    }, [songs, query]);

    type RangeType = "week" | "month" | "3month" | "custom";

    const [range, setRange] = useState<RangeType>("week");
    // const [customFrom, setCustomFrom] = useState<string>("");
    // const [customTo, setCustomTo] = useState<string>("");

  return (
    <div className="p-16 bg-[#F8F6F1] h-[100vh]" >
      <div className="gap-2 p-2 flex items-center ">
        <span className="text-2xl text-[#6E6E73] font-medium">{breadcrumbs[0][0].toUpperCase() + breadcrumbs[0].slice(1)}</span>
        <Image src="/Vector.svg" alt="arrow" width={8} height={8} className="inline-block mx-2"/>
        <span className="text-2xl text-[#151517] font-medium">SASR Report</span>
      </div>
      <div className="bg-[#FEFEFE] w-full h-[577px] rounded-2xl p-6 mt-4">
        {/* info and print section */}
        <div className="flex justify-between pt-4">
          <div className="flex flex-col gap-4 p-6 border-b border-[#E3E3E3] text-[#151517] text-[18px] font-medium" >
            <span className="gap-1">Last Score : {songs.length}</span>
            <span className="gap-1">Highest Score : {TotalTime} </span>
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

                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-4 w-4 cursor-pointer" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left font-medium">
                    <div className="flex items-center gap-1">
                      Attempt 
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
                {filteredSongs.map(song => (
                  <tr key={song.id} className="border-b border-gray-200 text-sm last:border-none odd:bg-white even:bg-[#F7F7F7] hover:bg-gray-100transition">

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {song.title}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(song.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{song.attempt}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {song.score}
                    </td>
                
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-full p-1 hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSongs.length === 0 && (
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