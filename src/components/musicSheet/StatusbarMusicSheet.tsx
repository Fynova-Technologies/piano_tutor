'use client'
import Image from "next/image"
import { useState,useEffect } from "react";

interface StatusbarMusicSheetProps {
    isPlaying: boolean;
    playCount: number;
    totalNotes: [number,number][];
    correctNotes:unknown[];
    IncorrectNotes:unknown[];
    courseTitle: string;
    
}

export default function StatusbarMusicSheet({isPlaying, playCount, totalNotes,correctNotes,IncorrectNotes,courseTitle}: StatusbarMusicSheetProps) {
  const [lastScore,setlastScore]= useState(0)
  const [highScore,setHighScore]= useState(0)
  
  
  useEffect(()=>{
    if(IncorrectNotes.length>0 && correctNotes.length>IncorrectNotes.length){
      setlastScore( Math.ceil(((correctNotes.length - IncorrectNotes.length) / totalNotes.length) * 100));}
      if(lastScore>highScore){
        setHighScore(lastScore)
      }
    else if(correctNotes.length>0){
      setlastScore(10);
      if(lastScore>highScore){
        setHighScore(lastScore)
      }
    }

  }, [IncorrectNotes, correctNotes.length, highScore, lastScore, totalNotes.length]
  )

  
  return (
        <div className={`bg-[#FEFEFE] w-full h-[20%] flex justify-between items-center ${isPlaying ? 'hidden' : ''}`} style={{
    boxShadow: '0 10px 30px rgba(50, 50, 93, 0.25)' // or use your own shadow
  }}>
            <div className="p-5 flex-2">
              <span className="text-[#0A0A0B] font-medium text-[24px] ml-10">{courseTitle}</span>
            </div>
            <div className="p-4 flex-1">
              <div className="flex space-x-8 items-center">
                <div className="flex items-center space-x-3">
                    <Image src="/Frame.svg" width={28} height={20} alt="icon"/>
                    <span className="font-semibold text-[24px] primary-color-text font-inter"> {highScore} </span>
                    <span className=" font-medium primary-color-text text-[16px]">  High Score</span>
                </div>
                <div className="flex items-center space-x-3">
                    <Image src="/SVGRepo_iconCarrier (1).svg" width={25} height={20} alt="icon"/>
                    <span className="font-semibold text-[24px] primary-color-text font-inter"> {lastScore} </span>
                    <span className="font-medium primary-color-text  text-[16px]">Last Score</span>
                </div>
                <div className="flex items-center space-x-3">
                    <Image src="/autoplay (1).svg" width={28} height={20} alt="icon"/>
                    <span className="font-semibold text-[24px] primary-color-text font-inter"> {playCount} </span>
                    <span className="font-medium primary-color-text  text-[16px]">Play Count</span>
                </div>          
              </div>
            </div>
      </div>
    )
}