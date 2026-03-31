'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import HeartIcon from "../library/hearfilled";
import GetPopupContainer from "@/components/favouritepopup/favouritepopup";

type SongInformation = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  variant: string;
  file: string;
  imageUrl: string;

  artist: {
    id: string;
    name: string;
    slug: string;
  };

  categories: {
    genres: {
      id: string;
      name: string;
      slug: string;
    }[];
    difficulty: {
      id: string;
      level: string;
      rank: number;
    };
  };

  status: {
    id: string;
    published: boolean;
    featured: boolean;
    new: boolean;
  };
};

export default function Favorite() {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [openDialogue, setOpenDialogue] = useState(false);
  const [favorites, setFavorites] = useState<SongInformation[]>([]);
  const [dialogueSong, setDialogueSong] = useState<SongInformation | null>(null);

  const handleClick = (id: string) => {
    setLiked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      const res = await fetch("/library.json");
      const data = await res.json();

      const featuredSongs = data.filter(
        (song: SongInformation) => song.status.featured
      );
      // Add imageUrl property to each song
      const featuredSongsWithImage = featuredSongs.map((song: SongInformation) => ({
        ...song,
        imageUrl: `/songs/${song.slug}.jpg`,
      }));

      setFavorites(featuredSongsWithImage);
      setFavorites(featuredSongs);
    };

    fetchFavorites();
  }, []);

  if (!favorites.length) return <p>Loading favorites...</p>;

  return (
    <div className="bg-[#F8F6F1] flex justify-center px-4 pb-8">
      <div className="max-w-[1200px] w-full">
        <h1 className="text-2xl font-bold mb-6 text-[#151517]">
          Favorites
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {favorites.map((song) => (
            <div key={song.id} className="w-full">
              <div className="shadow-lg rounded-2xl overflow-hidden bg-white">
                <div className="relative group aspect-square">
                  <Image
                    src={`/songs/${song.slug}.jpg`}
                    alt={song.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                    onClick={() => {
                      setOpenDialogue(true);
                      setDialogueSong(song);
                    }}
                  />

                  <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                    <div onClick={() => handleClick(song.id)}>
                      <HeartIcon isLiked={liked[song.id]} />
                    </div>
                  </div>

                  {song.status.new && (
                    <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                      NEW
                    </div>
                  )}
                </div>

                <div className="p-4 text-[#151517]">
                  <h3 className="font-semibold line-clamp-1">
                    {song.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {song.artist.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {song.categories.difficulty.level}
                  </p>
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
          />
        )}
      </div>
    </div>
  );
}