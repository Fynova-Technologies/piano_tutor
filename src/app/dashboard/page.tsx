"use client";
import ContinueLearning from "@/components/Dashboard/countinueLearning";
import Favorite from "@/components/Dashboard/favorites";
import MusicCategories from "@/components/Dashboard/musicCategories";
import AiAnalysisDashboardCard from "@/components/Dashboard/aiAnalysisDashboardCard";

export default function ComingSoon() {
  
  return (
    <>
    <div className=" font-[family-name:var(--font-geist-sans)]">
      <div className="overflow-y-auto">
            <div className="flex  justify-center bg-[#F8F6F1] px-1 py-16">
              <div className="max-w-[90%] w-full text-center">
                <MusicCategories/>
                <AiAnalysisDashboardCard />
              </div>
      
            </div>
            <ContinueLearning />
            <Favorite/>
      
          </div>
    </div>
    </>


  );
}
