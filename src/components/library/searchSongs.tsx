import Image from "next/image";

export default function SearchSongs(){
    return(
        <div className="flex w-full justify-center">
            <div className="bg-[#1C1C1E] w-[60%] h-16  flex items-center space-x-10 p-4 rounded-t-[10px]">
                <Image src="/icon/search.svg" alt="Search Icon" height={20} width={40} className="cursor-pointer"/>
                <input 
                    className="w-[500px] h-16 p-3 text-[#ABB7C2] text-[18px] font-normal font-poppins border border-[#1C1C1E] bg-transparent focus:outline-none focus:ring-0 focus:border-[#1C1C1E] placeholder-[#E8E8E9]"
                    placeholder="Search ..."
                />

            </div>
            <div className="  z-10 w-[60px] bg-[#D4AF37] rounded--[10px] -ml-12  rounded-bl-4xl rounded-tr-2xl flex justify-center items-center">
                <Image src="/icon/sliders-horizontal.svg" height={30} width={30} alt="icons"/>

            </div>
        </div>
    )
}