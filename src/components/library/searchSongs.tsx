import Image from "next/image";

export default function SearchSongs(){
    return(
        <div className="flex w-full justify-center px-4">
            <div className="bg-[#1C1C1E] w-full sm:w-[60%] max-w-[640px] h-14 sm:h-16 flex items-center gap-3 sm:space-x-10 p-3 sm:p-4 rounded-t-[10px]">
<Image src="/icon/search.svg" alt="Search Icon" height={20} width={40} className="cursor-pointer flex-shrink-0"/>
<input 
className="w-full h-full p-2 sm:p-3 text-sm sm:text-[18px] text-[#ABB7C2] font-normal font-poppins border border-[#1C1C1E] bg-transparent focus:outline-none focus:ring-0 focus:border-[#1C1C1E] placeholder-[#E8E8E9]"
placeholder="Search ..."
/>
</div>
<div className="z-10 w-[44px] sm:w-[60px] bg-[#D4AF37] rounded--[10px] -ml-8 sm:-ml-12 rounded-bl-4xl rounded-tr-2xl flex justify-center items-center flex-shrink-0">
<Image src="/icon/sliders-horizontal.svg" height={30} width={30} alt="icons" className="w-5 h-5 sm:w-[30px] sm:h-[30px]"/>
</div>
</div>
    )
}