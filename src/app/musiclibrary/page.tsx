"use client";
import React from "react";
import ContinueLearning from "@/components/countinueLearning";
import Favorite from "@/components/favorites";
import MusicCategories from "@/components/Dashboard/musicCategories";

export default function ComingSoon() {
  
  return (
    <>
    <div className="flex justify-center bg-[#F8F6F1] px-1 py-16">
      <div className="max-w-[90%] w-full text-center">
        <MusicCategories/>
      </div>

    </div>
    <ContinueLearning />
    <Favorite/>

    </>
  );
}
