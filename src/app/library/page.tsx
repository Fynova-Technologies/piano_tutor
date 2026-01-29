'use client'
import SearchSongs from "@/components/library/searchSongs"
import Favorite from "@/components/Dashboard/favorites"

export default function library(){
    return(
        <div className="bg-[#F8F6F1] flex flex-col w-full">
            <div className="flex justify-center items-center mt-16 w-full">
                <SearchSongs/>
            </div>
            <div className="mt-10">
                <Favorite/>
                <div className="mt-16"></div>
                <Favorite/>
                <div className="mt-16"></div>
                <Favorite/>
                <div className="mt-16"></div>
                <Favorite/>
                <div className="mt-16"></div>
                
            </div>
        </div>
    )
}