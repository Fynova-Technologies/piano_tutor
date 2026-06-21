import Image from "next/image";
import { useRouter } from "next/navigation";
import ProgressCircle from "@/components/progressCircle";
import {useLessons} from "@/utils/userprogress/lessonprogress"

 // Assuming you have a ProgressCircle component
export default function MusicCategories() {
    const router = useRouter();
    const radius = 45;
      const stroke = 10;
      const normalizedRadius = radius - stroke / 2;
      // const progress= 70;
      const lessons = useLessons();
      // const getOverallProgress = lessons?.getOverallProgress ?? (() => 0);
      const getUnitProgress = lessons?.getUnitProgress ?? (() => 0);
      // const progress = getOverallProgress();
      // Replace hardcoded progress = 70
      

      // Per unit card:
      // const unit1Progress = getUnitProgress("1");
       // ✅ Dynamic progress values
      const methodProgress = getUnitProgress("1");     // unit 1 for Method Lessons
      const techniqueProgress = getUnitProgress("2");  // unit 2 for Technique Lessons
      // const overallProgress = getOverallProgress();

      // ✅ Compute offsets per card
      const actualRadius = normalizedRadius * 1.5;
const circumference = 2 * Math.PI * actualRadius; // ✅ correct
    // const strokeDashoffset = circumference - (progress / 100) * circumference;


const methodOffset = circumference - (methodProgress / 100) * circumference;
const techniqueOffset = circumference - (techniqueProgress / 100) * circumference;


    return(
         <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Music Library Card - unchanged */}
        <div
          onClick={() => router.push("/library")}
          className="bg-[#FEFEFE] rounded-2xl w-full hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-[0_5px_10px_0px_#505050] transition duration-300 cursor-pointer group hover:scale-[1.03] min-h-[140px]"
        >
           <div className="relative flex">
    <div className="relative flex items-center overflow-hidden w-full z-10 rounded-3xl">
      <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center z-10 h-full w-[140px] md:w-[200px] ml-4 md:ml-16">
        <h3 className="primary-color-text text-[36px] font-bold p-0 m-0">Music</h3>
        <h3 className="text-xl text-[36px] font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent p-0 m-0">Library</h3>
      </div>
      <div className="absolute left-[80px] md:left-[100px] group-hover:translate-x-6 transition-transform duration-1000 ease-in-out hidden sm:block">
        <div className="relative w-[300px] h-[200px]">
          <Image src="/gifs/vinyl.gif" alt="Vinyl GIF" fill className="object-cover bg-transparent" />
          <div className="absolute inset-0 bg-white opacity-30 pointer-events-none"></div>
        </div>
      </div>
    </div>
    <div className="hidden sm:flex flex-col items-center ml-auto space-y-4 p-6 group-hover:-translate-x-6 transition-transform duration-1000 ease-in-out">
      <div className="flex items-center justify-center gap-2">
        <Image src="/gifs/piano.png" alt="Piano" width={100} height={100} className="w-10 h-14 rounded-2xl object-cover" />
        <Image src="/gifs/manpiano.jpg" alt="Man Piano" width={100} height={100} className="w-10 h-14 rounded-2xl object-cover" />
      </div>
      <span className="text-[#151517]">Recent Music</span>
    </div>
  </div>
        </div>

        {/* Sight Reading Card */}
        <div
          onClick={() => router.push("/method")}
          className="bg-[#FEFEFE] rounded-2xl w-full hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-[0_5px_10px_0px_#505050] transition duration-300 cursor-pointer group hover:scale-[1.03] min-h-[140px]"
        >
           {/* ✅ center everything when stacked on mobile */}
           <div className="relative flex flex-col items-center sm:items-stretch sm:flex-row gap-4 sm:gap-0">
    <div className="relative flex items-center justify-center sm:justify-start overflow-hidden w-full sm:flex-1 z-10 rounded-3xl">
      {/* ✅ centered text on mobile, ml-0 instead of ml-4 since the row is now centered */}
      <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-center sm:items-start justify-center text-center sm:text-left z-10 h-full w-[140px] md:w-[200px] ml-0 md:ml-16">
        <h3 className="primary-color-text text-[36px] font-bold p-0 m-0">Sight</h3>
        <h3 className="text-xl text-[36px] font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent p-0 m-0">Reading</h3>
      </div>
      <div className="absolute left-[160px] md:left-[230px] group-hover:translate-x-6 transition-transform duration-1000 ease-in-out hidden sm:block">
        <div className="relative w-[130px] h-[130px]">
          <Image src="/gifs/Vector.png" alt="Vector" width={130} height={130} />
          <div className="absolute inset-0 bg-white opacity-30 pointer-events-none"></div>
        </div>
      </div>
    </div>
    {/* ✅ smaller padding + text on mobile so the score box reads as a compact badge, not a near-full-width block */}
    <div className="flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-[0_5px_10px_0px_#505050] bg-[#FEFEFE] flex-shrink-0 self-center w-fit">
      <div className="flex flex-col items-center gap-1 sm:gap-2 w-full">
        <div className="flex gap-2 sm:gap-4 items-center">
          <Image src="/Frame.svg" alt="Frame" width={10} height={10} className="w-7 h-6 sm:w-10 sm:h-9 rounded-2xl object-cover" />
          <span className="text-[#151517] text-2xl sm:text-4xl font-bold">10</span>
        </div>
        <span className="text-[#151517] text-sm sm:text-xl w-full text-center whitespace-nowrap">High Score</span>
      </div>
    </div>
  </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center md:space-x-8 space-y-4 md:space-y-0 items-stretch mt-4">

  {/* Method Lessons Card */}
  <div onClick={() => router.push("/sasr")} className="bg-[#FEFEFE] rounded-2xl w-full hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-[0_5px_10px_0px_#505050] transition duration-300 cursor-pointer group hover:scale-[1.03]">
    {/* ✅ center title + circle on mobile */}
    <div className="relative flex flex-col items-center sm:items-stretch sm:flex-row gap-4 sm:gap-0">
      <div className="relative flex items-center justify-center sm:justify-between sm:space-x-4 overflow-hidden w-full sm:flex-1 z-10 rounded-3xl">
        <div className="absolute left-[150px] group-hover:translate-x-24 transition-transform duration-1000 ease-in-out hidden sm:block">
          <Image src="/assets/bro.svg" alt="Bro" width={300} height={200} />
        </div>
        <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-center sm:items-start justify-center text-center sm:text-left z-10 h-full ml-0 md:ml-16 w-[180px] md:w-[200px]">
          <h3 className="text-2xl sm:text-4xl font-bold primary-color-text p-0 m-0">Method</h3>
          <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent mb-2 p-0 m-0">Lessons</h3>
        </div>
      </div>
      {/* ✅ scale-75 shrinks the whole progress circle proportionally on mobile, origin-center keeps it from drifting */}
      <div className="flex flex-col items-center sm:ml-auto space-y-4 p-2 sm:p-6 flex-shrink-0 self-center">
        <div className="flex items-center gap-2 rounded-full scale-75 sm:scale-100 origin-center">
          <div className="flex items-center justify-center">
            <svg height={radius * 3} width={radius * 3} className="transform -rotate-90">
              <ProgressCircle normalizedRadius={normalizedRadius * 1.5} radius={radius} fillcolor="transparent" />
              <circle stroke="#D4AF37" fill="transparent" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={methodOffset} strokeLinecap="round" r={normalizedRadius * 1.5} cx={radius * 1.5} cy={radius * 1.5} className="transition-all duration-300" />
            </svg>
            <div className="absolute">
              <div className="flex flex-col space-y-2 items-center">
                <span className="text-[#535356] text-[12px] font-medium">Completed</span>
                <span className="text-[#272728] text-[16px] font-medium">{methodProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

        {/* Technique Lessons Card */}
        <div
          onClick={() => router.push("/techniques")}
          className="bg-[#FEFEFE] rounded-2xl lg:w-[60%] w-full hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:inset-10 hover:shadow-[0_5px_10px_0px_#505050] transition duration-300 cursor-pointer group hover:scale-[1.03]"
        >
          {/* ✅ center title + circle on mobile */}
          <div className="relative flex flex-col items-center sm:items-stretch sm:flex-row gap-4 sm:gap-0">
            <div className="relative flex items-center justify-center sm:justify-between sm:space-x-4 overflow-hidden w-full sm:flex-1 z-10 rounded-3xl">
              <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-center sm:items-start justify-center text-center sm:text-left z-10 h-full ml-0 md:ml-16">
                <h3 className="text-2xl sm:text-[36px] font-bold primary-color-text p-0 m-0">Technique</h3>
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-2xl sm:text-[36px] text-transparent mb-2 p-0 m-0">Lessons</h3>
              </div>
            </div>
            <div className="flex flex-col items-center sm:ml-auto space-y-4 p-2 sm:p-6 flex-shrink-0 self-center">
              <div className="flex items-center gap-2 rounded-full scale-75 sm:scale-100 origin-center">
                <div className="flex items-center justify-center">
                  <svg height={radius * 3} width={radius * 3} className="transform -rotate-90">
                    <ProgressCircle normalizedRadius={normalizedRadius * 1.5} radius={radius} fillcolor="transparent" />
                    <circle
                      stroke="#D4AF37"
                      fill="transparent"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={techniqueOffset}
                      strokeLinecap="round"
                      r={normalizedRadius * 1.5}
                      cx={radius * 1.5}
                      cy={radius * 1.5}
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute">
                    <div className="flex flex-col space-y-2 items-center">
                      <span className="text-[#535356] text-[12px] font-medium">Completed</span>
                      <span className="text-[#272728] text-[16px] font-medium">{techniqueProgress}%</span>
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