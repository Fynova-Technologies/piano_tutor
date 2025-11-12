"use client";
import MusicCategories from "@/components/Dashboard/musicCategories";
import ContinueLearning from "@/components/Dashboard/countinueLearning";
import Favorite from "@/components/Dashboard/favorites";

export default function Home() {
  

  return (
    <div className=" font-[family-name:var(--font-geist-sans)]">
      <div className="overflow-y-auto">
            <div className="flex  justify-center bg-[#F8F6F1] px-1 py-16">
              <div className="max-w-[90%] w-full text-center">
                <MusicCategories/>
              </div>
      
            </div>
            <ContinueLearning />
            <Favorite/>
      
          </div>
    </div>
  );
}
