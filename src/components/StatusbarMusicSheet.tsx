import Image from "next/image"
export default function StatusbarMusicSheet() {
    return (
        <div className="bg-[#FEFEFE] w-full h-[20%] flex justify-between items-center ">
        <div className="p-5 flex-2">
          <span className="text-[#0A0A0B] font-medium text-[24px]">1. Course title</span>
        </div>
        <div className="p-4 flex-1">
          <div className="flex space-x-4">
            <Image src="/Frame.svg" width={28} height={20} alt="icon"/>
            <span className="font-semibold text-[24px] text-primary-dark font-inter"> 10 </span>
            <span className="text-lg text-primary-dark font-inter">  High Score</span>
            <Image src="/SVGRepo_iconCarrier (1).svg" width={20} height={20} alt="icon"/>
            <span className="text-lg text-[#0A0A0B]">Last Score</span>
            <Image src="/autoplay (1).svg" width={20} height={20} alt="icon"/>

            <span className="text-lg text-[#0A0A0B]">Play Count</span>
          </div>
        </div>
      </div>
    )
}