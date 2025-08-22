'use client'
import Image from "next/image"
import React,{useState} from "react";

export default function Test(){
    const [count, setCount] = useState(0);
    const handleadd = () => {
        setCount(count + 1);
    }
    const handleSub = () => {
        if(count > 0){
            setCount(count - 1);
        }
    }
    return(
        <div className="flex h-screen items-center justify-center">
          <div className="flex w-[800px] h-[500px] bg-gradient-to-r from-[#FFFFFFE5] via-[#D8D8D8] to-[#D8D8D8] items-center justify-center rounded-2xl p-2">
            <div className="flex bg-gradient-to-r from-[#FFFFFF66] to-[#ffffff00] rounded-2xl p-8 gap-4 w-full h-full">
              <div className="flex flex-col gap-4 w-[50%]">
                <h2 className="text-black text-center">Practice Session</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-10">
                    <span className="ml-2 text-black">Measure sound</span>
                    <button className="bg-amber-700 rounded-full p-4" onClick={()=>handleadd()}><Image src="assets/plus.svg" height={20} width={20} alt="just image"/></button>
                    <span className="ml-2 text-black tabular-nums">{count}</span>
                    <button className="bg-amber-700 rounded-full p-4" onClick={()=>handleSub()}><Image src="assets/minus.svg" height={20} width={20} alt="just image"/></button>

                  </div>
                  
                </div>

              </div>
              <div>

              </div>

            </div>

          </div>
        </div>

    )
}