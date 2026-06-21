/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect } from "react";
import SearchSongs from "@/components/library/searchSongs";
import SongRow from "./songrow";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import { useSubscription } from "@/hooks/subscribed/issubscribed";

type SongInformation = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  variant: string;
  file: string;
  imageUrl: string;
  isPremium: boolean;
  artist: { id: string; name: string; slug: string };
  categories: {
    genres: { id: string; name: string; slug: string }[];
    difficulty: { id: string; level: string; rank: number };
  };
  status: { id: string; published: boolean; featured: boolean; new: boolean };
};

export default function Library() {
  const supabase =  getSupabaseBrowserClient(); // ← use the singleton client
  const [allSongs, setAllSongs] = useState<SongInformation[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isSubscribed, isReady } = useSubscription();

  // 1. Get user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await (await supabase).auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);

    // Run both in parallel
    const [res, { data: { user } }] = await Promise.all([
      fetch("/library.json"),
      (await supabase).auth.getUser(),
    ]);

    const data = await res.json();
    setAllSongs(data);
    setUserId(user?.id ?? null);

    if (user?.id) {
      const { data: favData, error } = await (await supabase)
        .from("favorites")
        .select("song_id")
        .eq("user_id", user.id); // 👈 use user.id directly, not state

      console.log("favData:", favData, "error:", error);  

      if (favData) {
        const likedMap: Record<string, boolean> = {};
        favData.forEach(({ song_id }:any) => { likedMap[song_id] = true; });
        setLiked(likedMap);
      }
    }

    setLoading(false);
  };

  fetchData();
}, []); // 👈 single effect, runs once

  // 2. Fetch songs + liked state
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const res = await fetch("/library.json");
      const data: SongInformation[] = await res.json();
      setAllSongs(data);

      if (userId) {
        const { data: favData } = await (await supabase)
          .from("favorites")
          .select("song_id")
          .eq("user_id", userId);

        if (favData) {
          const likedMap: Record<string, boolean> = {};
          favData.forEach(({ song_id }:any) => { likedMap[song_id] = true; });
          setLiked(likedMap);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  // 3. Toggle like
  const handleToggleLike = async (songId: string) => {
    if (!userId) return;
    const isLiked = !!liked[songId];
    setLiked((prev) => ({ ...prev, [songId]: !isLiked }));

    if (isLiked) {
      await (await supabase).from("favorites").delete()
        .eq("user_id", userId).eq("song_id", songId);
    } else {
      await (await supabase).from("favorites").insert({ user_id: userId, song_id: songId });
    }
  };

  // 4. Derived category lists
  const favoriteSongs = allSongs.filter((s) => liked[s.id]);
  const newSongs = allSongs.filter((s) => s.status.new);
  const classicalSongs = allSongs.filter((s) =>
    s.categories.genres.some((g) => g.slug === "classical")
  );
  const rockSongs = allSongs.filter((s) =>
    s.categories.genres.some((g) => g.slug === "rock")
  );
  const beginnerSongs = allSongs.filter((s) => s.categories.difficulty.rank === 1);

  if (loading) return (
    <div className="bg-[#F8F6F1] min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <>
    <div className="bg-[#F8F6F1] flex flex-col w-full">
      <div className="flex justify-center items-center mt-8 sm:mt-16 w-full px-4">
<SearchSongs />
</div>
<div className="flex justify-center px-4">
<div className="max-w-[1200px] w-full flex flex-col gap-10 sm:gap-16 mt-6 sm:mt-10 pb-16">
{/* Favorites — personalized, shows empty state */}
<div>
<h2 className="text-xl font-bold mb-4 text-[#151517]">Favorites</h2>
{favoriteSongs.length === 0 ? (
<div className="border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center px-6 sm:px-12 py-8 sm:py-10">
<div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 sm:gap-10">
<div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0">
<Image
src="/assets/favoritevinyl.png"
alt="No favorites"
className="object-contain"
height={144}
width={144}
/>
</div>
<div className="flex flex-col items-center sm:items-start gap-2">
<h2 className="text-xl font-bold text-[#151517]">No Favorite songs yet</h2>
<p className="text-sm text-gray-500">Save songs and exercises you love for quick access later.</p>
<button
onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
className="mt-2 w-fit flex items-center gap-2 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] transition-colors text-[#151517] font-semibold text-sm px-5 py-2.5 rounded-full"
>
                      Explore Music <span>›</span>
</button>
</div>
</div>
</div>
            ) : (
<SongRow title="" songs={favoriteSongs} liked={liked} onToggleLike={handleToggleLike} isSubscribed={isSubscribed} />
            )}
</div>
{/* Other categories */}
<SongRow title="🆕 New Releases" songs={newSongs} liked={liked} onToggleLike={handleToggleLike} isSubscribed={isSubscribed} />
<SongRow title="🎹 Classical" songs={classicalSongs} liked={liked} onToggleLike={handleToggleLike} isSubscribed={isSubscribed} />
<SongRow title="🎸 Rock" songs={rockSongs} liked={liked} onToggleLike={handleToggleLike} isSubscribed={isSubscribed} />
<SongRow title="🟢 Beginner Picks" songs={beginnerSongs} liked={liked} onToggleLike={handleToggleLike} isSubscribed={isSubscribed} />
</div>
</div>
</div>
    </>
  );
}