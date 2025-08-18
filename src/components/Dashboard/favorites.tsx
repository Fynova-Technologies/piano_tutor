import { useState, useEffect } from 'react';
import Image from "next/image"
import HeartIcon from "../hearfilled";
import GetPopupContainer from '@/components/favouritepopup';

type SongInformation = {
  id: number;
  title: string;
  artist: string;
  ratings: number;
  imageUrl: string;
};

// type SongData = {
//     [category:string]: SongInformation[]

// }

export default function Favorite(){
    const [liked, setLiked] = useState<{ [id: string]: boolean }>({});
    const [openDialogue, setOpenDialogue] = useState(false);
    const [favorites,setFavorites]= useState<SongInformation[] | null>(null)
    const [dialogueSong, setDialogueSong] = useState<SongInformation | null>(null);
    
    const handleClick = (id:number) => {
     setLiked((prev) => ({
      ...prev,
      [id]: !prev[id],
    })); 
    };

    useEffect(() => {
  let isMounted = true;

  const fetchFavorites = async () => {
    const res = await fetch("/Songs.json");
    const data = await res.json();
    if (isMounted) {
      setFavorites(data.Favorites);
    }
  };

  fetchFavorites();

  return () => {
    isMounted = false;
  };
}, []);

    if (!favorites) return <p>Loading favorites...</p>;

    return(
        <div className=''>
            <div className="flex items-center justify-center bg-[#F8F6F1]">
                <div className="max-w-[90%] w-full">
                    <h1 className="text-2xl font-bold mb-4 text-[#151517]">Favorites</h1>
                    <div className="song-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-4">
                            {favorites?.map(( song,index) =>
                                    <div key={index} className="w-[80%]"   >
                                    <div className="relative rounded-t-2xl overflow-hidden shadow-lg group " >
                                        <Image
                                            src={song.imageUrl || "/songs/s1.jpg"} // Placeholder image
                                            alt={song.title}
                                            width={400}
                                            height={400}
                                            className="object-cover w-full h-[300px] rounded-t-2xl transition-transform duration-300 hover:scale-105 cursor-pointer"
                                            onClick={() => { setOpenDialogue(!openDialogue); setDialogueSong(song); }}
                                        />
                                       <div className="absolute bottom-2 left-7 flex flex-row gap-1">
                                            {[...Array(5)].map((_, i) => (
                                              <svg
                                                key={i}
                                                className={`w-8 h-8 ${
                                                  i < song.ratings ? "text-[#FFCC00]" : "text-gray-300"
                                                }`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                              >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.286 3.967c.3.922-.755 1.688-1.538 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.783.57-1.838-.197-1.538-1.118l1.286-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
                                              </svg>
                                            ))}
                                        </div>
                                        <div>
                                            <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md  "       onClick={() => handleClick(song.id)}>

                                                <HeartIcon isLiked={liked[song.id]} />


                                            </div>
                                        </div>

                                    </div>
                                    <div className="bg-white flex flex-col rounded-b-2xl text-[#151517] p-4">
                                        <span className="font-semibold">{song.title}</span>
                                        <span>{song.artist}</span>
                                    </div>
                                </div>
                                
                            )}
                            {openDialogue && dialogueSong && (
                                <GetPopupContainer dialogueSong={dialogueSong} openDialogue={openDialogue} setOpenDialogue={setOpenDialogue}/>
                            )}
                            
                        </div>
                    </div>
                
            </div>
        </div>
    )
}