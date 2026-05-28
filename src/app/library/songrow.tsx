'use client';
import { useState } from "react";
import Image from "next/image";
import HeartIcon from "@/components/library/hearfilled";
import GetPopupContainer from "@/components/favouritepopup/favouritepopup";

type SongInformation = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  variant: string;
  file: string;
  imageUrl: string;
  artist: { id: string; name: string; slug: string };
  categories: {
    genres: { id: string; name: string; slug: string }[];
    difficulty: { id: string; level: string; rank: number };
  };
  status: { id: string; published: boolean; featured: boolean; new: boolean };
};

type Props = {
  title: string;
  songs: SongInformation[];
  liked: Record<string, boolean>;
  onToggleLike: (songId: string) => void;
};

export default function SongRow({ title, songs, liked, onToggleLike }: Props) {
  const [openDialogue, setOpenDialogue] = useState(false);
  const [dialogueSong, setDialogueSong] = useState<SongInformation | null>(null);

  if (!songs.length) return null;

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-[#151517]">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {songs.map((song) => (
          <div key={song.id} className="w-full">
            <div className="shadow-lg rounded-2xl overflow-hidden bg-white">
              <div className="relative group aspect-square">
                <Image
                  src={song.imageUrl}
                  alt={song.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => {
                    setOpenDialogue(true);
                    setDialogueSong(song);
                  }}
                />
                <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                  <div onClick={() => onToggleLike(song.id)}>
                    <HeartIcon isLiked={!!liked[song.id]} />
                  </div>
                </div>
                {song.status.new && (
                  <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                    NEW
                  </div>
                )}
              </div>
              <div className="p-4 text-[#151517]">
                <h3 className="font-semibold line-clamp-1">{song.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-1">{song.artist.name}</p>
                <p className="text-xs text-gray-500 mt-1">{song.categories.difficulty.level}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

       {openDialogue && dialogueSong && (
    <GetPopupContainer
      dialogueSong={dialogueSong}
      openDialogue={openDialogue}
      setOpenDialogue={setOpenDialogue}
      liked={liked}              // ✅ pass down
      onToggleLike={onToggleLike} // ✅ pass down
    />
  )}
    </div>
  );
}