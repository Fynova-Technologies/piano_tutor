"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {motion} from "framer-motion";
import { useMediaQuery } from "@/components/MediaQuery/useMediaQueryHook";


const unitLessonsData = [
  {
    fkid: "1",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key", link: "/musicsheet" },
    ],
  },
  {
    fkid: "2",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C 2", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music 2", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key 2", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key 2", link: "/musicsheet" },
    ],
  },
  {
    fkid: "3",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C 3", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music 3", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key 3", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key 3", link: "/musicsheet" },
    ],
  },
];


// Main component
export default function PianoLesson() {
  const [classId, setClassId] = useState("1");
  const router = useRouter();
  const [methodName, setMethodName] = useState("1A");
  const isMobile = useMediaQuery("(max-width: 768px)");

  



  // Static lesson selectors (first row)
  const topLessons = [
    {id:"1",  title: "1A", description: "Introduction to keys", link: "/musicsheet" },
    {id:"2", title: " 1B", description: "Basic Scales and Finger Exercises", link: "/scales" },
    {id:"3", title: " 1C", description: "Reading Sheet Music", link: "/sheetmusic" },
    {id:"4", title: " 1D", description: "Simple Songs for Beginners", link: "/beginnersongs" },
    {id:"5", title: " 1E", description: "Chord Progressions", link: "/chords" },
    {id:"6", title: " 2A", description: "New Excercises", link: "/scales" },
    {id:"7", title: " 2B", description: "New Excercises 2", link: "/sheetmusic" },
    {id:"8", title: " 2C", description: "New Excercises 3", link: "/beginnersongs" },
    {id:"9", title: " 2D", description: "New Excercises 4", link: "/chords" },
    {id:"10",title: " 2E", description: "New Excercises 4", link: "/chords" },
    {id:"11",title: " 3A", description: "New Excercises 4", link: "/chords" },
    {id:"12",title: " 3B", description: "New Excercises 4", link: "/chords" },
    {id:"13",title: " 3C", description: "New Excercises 4", link: "/chords" },
    {id:"14",title: " 3D", description: "New Excercises 4", link: "/chords" },
    {id:"15",title: " 3E", description: "New Excercises 4", link: "/chords" }

  ];

  

  const handleClick = (id: string) => {
    setClassId(id);
  };

  const UnitLesson: React.FC<{ classId: string, methodName:string }> = ({ classId }) => {
      const [activeLesson, setActiveLesson] = useState<string | null>(null);

      
    const unit = unitLessonsData.find((u) => u.fkid === classId);
    useEffect(() => {
        if (unit && unit.unitlessons.length > 0) {
          setActiveLesson(unit.unitlessons[0].id);
        }
      }, [unit]);
    if (!unit) return null;

    return (
      <div>
        <div className={`${isMobile?"bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-8":"bg-[#FEFEFE] p-4 rounded-2xl shadow-md"}`}>
          <h3 className={`${isMobile?"text-xl text-[40px] text-center text-primary-background w-full bg-[#FEFEFE]":"text-xl text-[40px] text-center text-primary-background w-full bg-[#FEFEFE]"}`}>Methods<span className="font-bold"> - {methodName} </span></h3>
        </div>
        <div className="bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-4">
          <ul className="mt-5">
            {unit.unitlessons.map((lesson) => {
              const isActive = activeLesson === lesson.id;
              return(
              <li
                key={lesson.id}
                onClick={() => {
                  setActiveLesson(lesson.id);
                  router.push(lesson.link);
                }}               
                className={`group cursor-pointer flex  px-4 py-1 items-center hover:rounded-2xl hover:bg-[#D4AF37] ${
                isActive ? 'bg-[#D4AF37] mb-1 border-b-0 rounded-2xl' : ''
                }`}>
                <div>
                  <Image src="/Layer_1.png" width={56} height={56} alt="icon" className={`${isActive ? 'visible' : 'invisible'} group-hover:visible group-active:visible`}/>
                </div>
                <div className={`${isMobile?`flex flex-col w-full hover:border-0 border-primary-background py-1 ${isActive ? 'border-0' : 'border-b-1'} `:`flex items-center justify-between w-full hover:border-0 border-primary-background py-1 ${isActive ? 'border-0' : 'border-b-1'} `}`}>
                  <span className="text-[16px] text-primary-background">{lesson.id}. {lesson.lessontitle}</span>
                  <button className={`${isMobile?"bg-primary-background rounded-2xl py-1":"bg-primary-background rounded-2xl py-2 px-6"}`}><span className="text-[#FEFEFE]">Incomplete</span></button>
                </div>
              </li>
            )})}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] py-16 px-6 md:px-12 lg:px-24">
      <div className={`${isMobile?"":"flex justify-center "}`}>
        <div className={`${isMobile?"":"flex-1"}`}>    
          <div className="w-full">
            <div className=" flex-col border-2 bg-[#FEFEFE] p-6 rounded-2xl w-full border-primary-background ">
              <div>
                <h1 className="text-[24px] font-extrabold text-center mb-4 drop-shadow-md bg-gradient-to-r from-[#D4AF37] from-48% to-[#978448] to-60% bg-clip-text text-transparent">
                  Piano Methods
                </h1>
              </div>
              <div className={`${isMobile?"flex w-full bg-black overflow-x-auto scrollbar-hide":"mt-[20px] max-h-[710px] mx-16 border-t-5 border-x-5  border-primary-background rounded-x-2xl rounded-t-2xl py-10 overflow-auto scrollbar-hide"}`}>
                {topLessons.map((lesson, index) => {
                  let whiteKeyInOctave = index % 7;
                  const showBlackKey = !(whiteKeyInOctave === 2 || whiteKeyInOctave === 6);
                  if (whiteKeyInOctave === 7) {
                    whiteKeyInOctave = 0;
                  }
                  return (
                    <div key={index} className="relative">   
                      <motion.div
                        initial={{ backgroundColor: "#fefefe" }}
                        whileHover={{
                          backgroundColor: ["#f1f1f1", "#e9e9ea", "#d2d2d4"],
                        }}
                        transition={{
                          duration: 0.9,
                          times: [0, 0.3, 0.5],
                          ease: "easeInOut",
                        }}
                        onClick={() => {
                          handleClick(lesson.id);
                          setMethodName(lesson.title);
                        }}
                        className={`${isMobile?"relative p-4 flex items-center justify-between cursor-pointer transition-colors duration-300 ease-out w-full h-[250px] bg-[#FEFEFE] shadow-[inset_0px_-2px_5px_#b9b9b9] hover:rounded-r-2xl" :
                          " relative cursor-pointer w-full flex flex-row-reverse p-4 transition-color duration-300 ease-out transform bg-[#FEFEFE] hover:rounded-r-2xl  shadow-[inset_0px_-2px_5px_#b9b9b9] "}`}
                      >
                        {showBlackKey && (
                        <div
                          className={`${isMobile?"absolute left-0 top-0 translate-x- z-10 w-[40px] h-[150px] bg-black rounded-b-lg":"absolute left-0 bottom-0 translate-y-1/2 z-10 w-[180px] h-[36px] bg-black rounded-r-lg"}`}
                        ></div>
                      )}
                        <span className="mt-auto bg-[#e9e9ea] shadow-[inset_0px_0px_4px_#0A254059] text-primary-background font-bold rounded w-[49px] h-[36px] text-center flex text-[20px] justify-center items-center text-sm">
                          {lesson.title}
                        </span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-2">
          <div className="flex flex-col lg:flex-row space-x-12 max-w-[90%]  mx-auto">
            <div className="w-full">
              <UnitLesson classId={classId} methodName={methodName} />
            </div>
          </div>
        </div>
    </div>
    </div>
  );
}
