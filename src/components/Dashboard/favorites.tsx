'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import HeartIcon from "../library/hearfilled";
import GetPopupContainer from "@/components/favouritepopup/favouritepopup";
import { createBrowserClient } from "@supabase/ssr"; // ✅ correct client
import { useRouter } from "next/navigation";

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

export default function Favorite() {
  // ✅ createBrowserClient correctly reads the auth session from cookies
    const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [openDialogue, setOpenDialogue] = useState(false);
  const [songs, setSongs] = useState<SongInformation[]>([]);
  const [dialogueSong, setDialogueSong] = useState<SongInformation | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Single effect — fetch user + songs + favorites together
  useEffect(() => {
    const fetchData = async () => {
      // Get user and songs in parallel
      const [res, { data: { user } }] = await Promise.all([
        fetch("/library.json"),
        supabase.auth.getUser(),
      ]);

      const data: SongInformation[] = await res.json();
      const songsWithImage = data.map((song) => ({
        ...song,
        imageUrl: `${song.imageUrl}`,
      }));
      setSongs(songsWithImage);
      setUserId(user?.id ?? null);

      // Fetch favorites if user is logged in
      if (user?.id) {
        const { data: favData, error } = await supabase
          .from("favorites")
          .select("song_id")
          .eq("user_id", user.id); // ✅ use user.id directly, not state

        console.log("favData:", favData, "error:", error); // 👈 check this in console

        if (!error && favData) {
          const likedMap: Record<string, boolean> = {};
          favData.forEach(({ song_id }) => { likedMap[song_id] = true; });
          setLiked(likedMap);
        }
      }
    };

    fetchData();
  }, []);

  // ✅ Toggle favorite
  const handleClick = async (songId: string) => {
    if (!userId) return;

    const isCurrentlyLiked = !!liked[songId];
    setLiked((prev) => ({ ...prev, [songId]: !isCurrentlyLiked }));

    if (isCurrentlyLiked) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("song_id", songId);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: userId, song_id: songId });
    }
  };

  const favoriteSongs = songs.filter((song) => liked[song.id]);

  // if (loading) return <p>Loading favorites...</p>;
  // if (!userId) return <p>Please log in to view your favorites.</p>;

  if (!favoriteSongs.length) return (
   <div className="flex justify-center bg-[#F8F6F1] px-1 pb-4">
          <div className="max-w-[90%] w-full">
            <h1 className="text-black text-2xl font-bold mb-3">Favorites</h1>

            {/* Dashed border container */}
            <div
              className="w-full rounded-2xl border-2 border-dashed flex items-center justify-center border-[#D6CFC0]"
              style={{ minHeight: "160px" }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-start gap-4 sm:gap-6 px-6 py-6 sm:px-10 sm:py-8">
  
                {/* Illustration */}
                <div className="flex-shrink-0 opacity-80 w-[90px] sm:w-[40%]">
                  {/* Chair + book SVG illustration matching the warm beige style */}
                  <Image
                    src={"/assets/favoritevinyl.png"}
                    alt="Chair + Book Illustration"
                    width={410}
                    height={410}
                    className="w-full h-auto"
                  />
                </div>
  
                {/* Text + CTA */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                  <h2 className="text-[#1A1A1A] text-base sm:text-lg font-bold leading-snug">
No Favorite songs yet                  </h2>
                  <p className="text-[#6B6B6B] text-[16px] leading-relaxed max-w-[260px] sm:max-w-xs">
Save songs and exercises you love for quick
access later.                  </p>
                  <button
                    onClick={() => router.push("/library")}
                    className="mt-2 flex items-center gap-2 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#151517] text-sm font-semibold px-4 py-2 rounded-2xl shadow-sm"
                  >
                    Explore Music
                    <span className="text-base leading-none">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  );

  return (
    <div className="bg-[#F8F6F1] flex justify px-4 pb-8">
      <div className="max-w-[90%] w-full">
        <h1 className="text-2xl font-bold mb-6 text-[#151517]">Favorites</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {favoriteSongs.map((song) => (
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
                    <div onClick={() => handleClick(song.id)}>
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
            liked={liked}
            onToggleLike={handleClick} // ✅ was undefined before, now correctly points to handleClick
          />
        )}
      </div>
    </div>
  );
}