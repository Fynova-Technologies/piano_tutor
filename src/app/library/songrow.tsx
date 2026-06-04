/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import HeartIcon from "@/components/library/hearfilled";
import GetPopupContainer from "@/components/favouritepopup/favouritepopup";

type SongInformation = {
  id: string;
  title: string;
  imageUrl: string;
  isPremium?: boolean;
  status: { new?: boolean };
  artist: { name: string };
  categories: { difficulty: { level: string } };
  // optional fields added to match the popup's expected type
  slug?: string;
  subtitle?: string;
  variant?: string;
  file?: string;
};

type Props = {
  title: string;
  songs: SongInformation[];
  liked: Record<string, boolean>;
  onToggleLike: (songId: string) => void;
  isSubscribed: boolean; // ← add this
};

export default function SongRow({ title, songs, liked, onToggleLike, isSubscribed }: Props) {
  const [openDialogue, setOpenDialogue] = useState(false);
  const [dialogueSong, setDialogueSong] = useState<SongInformation | null>(null);

  if (!songs.length) return null;

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 text-[#151517]">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {songs.map((song) => {
          const locked = song.isPremium && !isSubscribed;

          return (
            <div key={song.id} className="w-full">
              <div className="shadow-lg rounded-2xl overflow-hidden bg-white">
                <div className="relative group aspect-square">
                  <Image
                    src={song.imageUrl}
                    alt={song.title}
                    fill
                    className={`object-cover transition-transform duration-300 cursor-pointer ${
                      locked ? "brightness-50" : "hover:scale-105"
                    }`}
                    onClick={() => {
                      if (locked) return; // or show upgrade modal
                      setOpenDialogue(true);
                      setDialogueSong(song);
                    }}
                  />

                  {/* Lock overlay for premium songs */}
                  {locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                      <Lock className="w-7 h-7 text-white" />
                      <span className="text-white text-xs font-semibold">Premium</span>
                    </div>
                  )}

                  {/* Hide like button for locked songs */}
                  {!locked && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md cursor-pointer">
                      <div onClick={() => onToggleLike(song.id)}>
                        <HeartIcon isLiked={!!liked[song.id]} />
                      </div>
                    </div>
                  )}

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
                  {locked && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {openDialogue && dialogueSong && (
        <GetPopupContainer
          dialogueSong={{ ...dialogueSong, slug: dialogueSong.slug ?? "" } as any}
          openDialogue={openDialogue}
          setOpenDialogue={setOpenDialogue}
          liked={liked}
          onToggleLike={onToggleLike}
        />
      )}
    </div>
  );
}