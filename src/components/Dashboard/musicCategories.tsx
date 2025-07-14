import Image from "next/image";
import { useRouter } from "next/navigation";
import ProgressCircle from "@/components/progressCircle";
import {useMediaQuery} from "../MediaQuery/useMediaQueryHook";

 // Assuming you have a ProgressCircle component
export default function MusicCategories() {
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 768px)");
    const radius = 50;
      const stroke = 10;
      const normalizedRadius = radius - stroke / 2;
      const circumference = 2 * Math.PI * normalizedRadius;
      const progress= 70;
      const strokeDashoffset = circumference - (progress / 100) * circumference;
    return(
        <div>
          {isMobile?
            <div className="primary-color-text">Mobile View</div>:<div className="primary-color-text">Desktop View</div>
          }
          
            <div className={`${isMobile? "flex flex-col justify-center items-center space-y-5": "flex justify-center space-x-8"} `}>
                  <div
                        onClick={() => router.push("/musiclibrary")}
                        className="bg-[#FEFEFE] rounded-2xl w-[90%] shadow-md hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-2xl  transition duration-300  cursor-pointer group hover:scale-[1.03]"
                      >
                        <div className="relative flex ">
        
        
                          <div className="relative flex items-center overflow-hidden w-full z-10 rounded-3xl">
                              <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center  z-10 h-full w-[200px] ml-16">
                                <h3 className="primary-color-text text-[36px] font-bold">Music</h3>
                                <h3 className="text-xl text-[36px] font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent">Library</h3>
                              </div> 
                              <div className="absolute left-[100px] group-hover:translate-x-6 transition-transform duration-1000 ease-in-out">
                                <div className="relative w-[300px] h-[200px]">
                                  <Image
                                    src="/gifs/vinyl.gif"
                                    alt="Vinyl GIF"
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-white opacity-30 pointer-events-none"></div>
                                </div>
                              </div>
                          </div>
        
                          <div className="flex flex-col items-center ml-auto space-y-4 p-6 group-hover:-translate-x-6 transition-transform duration-1000 ease-in-out">
                            <div className="flex items-center justify-center gap-2">
                              <Image src="/gifs/piano.png" alt="Vercel Logo" width={100} height={100} className="w-10 h-14 rounded-2xl object-cover" />
                              <Image src="/gifs/manpiano.jpg" alt="Vercel Logo" width={100} height={100} className="w-10 h-14 rounded-2xl object-cover" />
                            </div>  
                            <span className="text-[#151517]">Recent Music</span>
                          </div>
                        </div>
                      </div>
                      <div
                        onClick={() => router.push("/musiclibrary")}
                        className="bg-[#FEFEFE] rounded-2xl w-[90%] shadow-md hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-2xl  transition duration-300  cursor-pointer group hover:scale-[1.03]"
                      >
                        <div className="relative flex ">
        
        
                          <div className="relative flex items-center overflow-hidden w-full z-10 rounded-3xl">
                              <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center  z-10 h-full w-[200px] ml-16">
                                <h3 className="primary-color-text text-[36px] font-bold">Sight</h3>
                                <h3 className="text-xl text-[36px] font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent">Reading</h3>
                              </div> 
                              <div className="absolute left-[230px] group-hover:translate-x-6 transition-transform duration-1000 ease-in-out">
                                <div className="relative w-[300px] h-[130px]">
                                  <Image src="/gifs/Vector.png" alt="Vinyl GIF" width={130} height={50} />
                                  <div className="absolute inset-0 bg-white opacity-30 pointer-events-none"></div>
                                </div>
                              </div>
                          </div>
        
                          <div className="flex flex-col items-center p-6 rounded-2xl shadow-[inset_0px_0px_10px_#D4AF37] bg-[#FEFEFE]">
        
                            <div className="flex flex-col items-center gap-2 w-full">
                              <div className="flex gap-4">
                                <Image src="/Frame.svg" alt="Vercel Logo" width={10} height={10} className="w-10 h-9 rounded-2xl object-cover" />
                                <span className="text-[#151517] text-4xl font-bold">10</span>
                              </div>
                              <span className="text-[#151517] text-xl w-full">High Score</span>
        
                            </div>  
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    <div className={`${isMobile?"flex flex-col justify-center items-center mt-10 space-y-10":"flex justify-center space-x-8 items-stretch mt-4"  }`}>
                                  <div
                                    onClick={() => router.push("/musiclibrary")}
                                    className="bg-[#FEFEFE] rounded-2xl w-[90%] shadow-md hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-2xl  transition duration-300  cursor-pointer group hover:scale-[1.03]"
                                  >
                                    <div className="relative flex">
                                      <div className="relative flex items-center justify-between space-x-4 overflow-hidden w-full z-10 rounded-3xl">
                                        <div className="absolute left-[150px] group-hover:translate-x-24 transition-transform duration-1000 ease-in-out">
                                            <Image src="/assets/bro.svg" alt="Vinyl GIF" width={300} height={200} className="hover:opacity-100" />
                                        </div>
                                          <div className={`${isMobile?" w-[80%] h-full flex flex-col justify-center items-center ml-0":"bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center z-10 h-full ml-16 w-[200px]"}`}>
                                            <h3 className="text-4xl font-bold primary-color-text">Method</h3>
                                            <h3 className="text-4xl font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent mb-2">Lessons</h3>
                                          </div> 
                                      </div>
                    
                                      <div className="flex flex-col items-center ml-auto space-y-4 p-6">
                    
                                        <div className="flex items-center gap-2 rounded-full border-2 ">
                                           <div className="flex items-center justify-center">
                                            <svg
                                              height={radius * 3}
                                              width={radius * 3}
                                              className="transform -rotate-90"
                                            >
                                              {/* Background Circle */}
                                              <ProgressCircle
                                                normalizedRadius={normalizedRadius * 1.5}
                                                radius={radius}
                                                fillcolor="transparent"/>
                                              

                                              <circle
                                                stroke="#D4AF37" // Tailwind's blue-500
                                                fill="transparent"
                                                strokeWidth="12"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                r={normalizedRadius*1.5}
                                                cx={radius*1.5}
                                                cy={radius*1.5}
                                                className="transition-all duration-300 "
                                              />
                                            </svg>
                                            {/* Center Text */}
                                            <div className="absolute">
                                              <div className="flex flex-col">
                                                <span className="text-[#535356]">Completed</span>
                                                <span className= "text-[#272728] text-xl">{progress}%</span>
                                              </div>
                                            </div>
                                          </div>
                    
                                        </div>  
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div
                                    onClick={() => router.push("/musiclibrary")}
                                    className="bg-[#FEFEFE] rounded-2xl lg:w-[60%] w-[90%] shadow-md hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-2xl  transition duration-300  cursor-pointer group hover:scale-[1.03]"
                                  >
                                    <div className="relative flex ">
                    
                    
                                      <div className="relative flex items-center justify-between space-x-4 overflow-hidden w-full z-10 rounded-3xl">
                                          <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center z-10 h-full ml-16">
                                            <h3 className="text-[36px] font-bold primary-color-text">Technique</h3>
                                            <h3 className="text-xl font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-[36px] text-transparent mb-2">Lessons</h3>                                          </div> 
                                      </div>
                    
                                      <div className="flex flex-col items-center ml-auto space-y-4 p-6 transition-transform duration-1000 ease-in-out">
                    
                                        <div className="flex items-center gap-2 rounded-full border-2 ">
                                           <div className="flex items-center justify-center">
                                            <svg
                                              height={radius * 3}
                                              width={radius * 3}
                                              className="transform -rotate-90"
                                            >
                                              {/* Background Circle */}
                                              <ProgressCircle 
                                                normalizedRadius={normalizedRadius * 1.5}
                                                radius={radius}
                                                fillcolor="transparent"
                                                />
                                              
                                              <circle
                                                stroke="#D4AF37" 
                                                fill="transparent"
                                                strokeWidth="12"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                r={normalizedRadius*1.5}
                                                cx={radius*1.5}
                                                cy={radius*1.5}
                                                className="transition-all duration-300 "
                                              />
                                            </svg>
                                            {/* Center Text */}
                                            <div className="absolute">
                                              <div className="flex flex-col">
                                                <span className="text-[#535356]">Completed</span>
                                                <span className= "text-[#272728] text-xl">{progress}%</span>
                                        </div>
                                    </div>
                                </div>
                    
                            </div>  
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}