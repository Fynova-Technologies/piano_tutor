import { useState } from 'react';
import Image from "next/image"

export default function Favorite(){
    const [animate, setAnimate] = useState(false);
    const [liked, setLiked] = useState<{ [id: string]: boolean }>({});

    const handleClick = (id:number) => {
    setAnimate(true);
     setLiked((prev) => ({
    ...prev,
    [id]: !prev[id],
  })); 
  };
    const songs = [
        {
            id: 1,
            title: "Song One",
            artist: "Artist A",
            ratings:4,
            imageUrl: "/songs/s1.jpg" // Placeholder image
        },
        {
            id: 2,
            title: "Song Two",
            artist: "Artist B",
            ratings: 5,
            imageUrl: "/songs/s2.jpg" // Placeholder image
        },
        {
            id: 3,
            title: "Song Three",
            artist: "Artist C",
            ratings: 3,
            imageUrl: "/songs/s3.jpg" // Placeholder image
        },
        {
            id: 4,
            title: "Song Four",
            artist: "Artist D",
            ratings: 4,
            imageUrl: "/songs/s4.jpg" // Placeholder image
        },
        {   id: 5,
            title: "Song Five",
            artist: "Artist E",
            ratings: 2,
            imageUrl: "/songs/s5.jpg" // Placeholder image
        }
    ]
    return(
        <>
            <div className="flex justify-center bg-[#F8F6F1] px-1 py-16">
                <div className="max-w-[90%] w-full">
                    <h1 className="text-2xl font-bold mb-4 text-[#151517]">Favorites</h1>
                    <div className="song-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-4">
                            {songs.map((song,index)=>(
                                <div key={index} className="w-[80%] h-[100px]" >
                                    <div className="relative rounded-t-2xl overflow-hidden shadow-lg group">
                                        <Image
                                            src={song.imageUrl || "/songs/s1.jpg"} // Placeholder image
                                            alt={song.title}
                                            width={400}
                                            height={400}
                                            className="object-cover w-full h-[300px] rounded-t-2xl transition-transform duration-300 hover:scale-105"
                                        />
                                        <div>
                                            <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md "       onClick={() => handleClick(song.id)}
>
                                                <Image
                                                    key={index}
                                                    src={liked[song.id]?"/hearfilled.png":"/HeartStart.png"}
                                                    alt="Favorite Icon"
                                                    width={20}
                                                    height={20}
                                                    className={`w-full h-full object-cover ${animate ? '' : ''}`}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                    <div className="bg-white flex flex-col rounded-b-2xl text-[#151517] p-4">
                                        <span className="font-semibold">{song.title}</span>
                                        <span>{song.artist}</span>
                                    </div>
                                    
                                </div>

                            ))}
                        </div>
                    </div>
                
            </div>
        </>
    )
}