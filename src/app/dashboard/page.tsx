"use client";
import React from "react";
import ContinueLearning from "@/components/Dashboard/countinueLearning";
import Favorite from "@/components/Dashboard/favorites";
import MusicCategories from "@/components/Dashboard/musicCategories";

export default function ComingSoon() {
  
  return (
   <div className="bg-[#F8F6F1] min-h-screen">

      {/* ONE container */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-16">
        <MusicCategories/>
        <ContinueLearning />
        <Favorite />
  </div>

</div>


  );
}
