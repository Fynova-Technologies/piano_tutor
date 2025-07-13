import Image from "next/image";

export default function SearchSongs(){
    return(
        <div className="flex">
            <div className="bg-[#2E2E2E] w-[570px] h-16  flex items-center space-x-10 p-4 rounded-l-[10px]">
                <Image src="/icon/search.svg" alt="Search Icon" height={20} width={40} className="cursor-pointer"/>
                <input 
                    className="w-[500px] h-16 p-3 text-[#ABB7C2] text-[18px] font-normal font-poppins border border-[#2E2E2E] bg-transparent focus:outline-none focus:ring-0 focus:border-[#2E2E2E] placeholder-[#ABB7C2]"
                    placeholder="Search ..."
                />

            </div>
            <div className="  z-10 w-[60px] bg-[#D4AF37] rounded-r-[10px] -ml-12  rounded-bl-4xl flex justify-center items-center">
                <Image src="/icon/sliders-horizontal.svg" height={30} width={30} alt="icons"/>

            </div>
        </div>
    )
}