/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

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

export default function MusicLibrarySlider() {
  const supabase = getSupabaseBrowserClient(); // ← use the singleton client
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [allSongs, setAllSongs] = useState<SongInformation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Run both in parallel
      const [res, { data: { user } }] = await Promise.all([
        fetch("/library.json"),
        (await supabase).auth.getUser(),
      ]);

      const data: SongInformation[] = await res.json();
      setAllSongs(data);
      // user is fetched alongside the songs in case you want to gate
      // premium songs / personalize the slider later — currently unused here.
      void user;

      setLoading(false);
    };

    fetchData();
  }, []);

  const scrollByAmount = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const goToLibrary = () => router.push("/library");

  return (
    <div className="bg-[#0A0A0A] w-full py-16 px-4">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center">
        {/* Badge */}
        <span className="border bg-[#C49A3C14] border-[#C49A3C40] text-[#C49A3C] text-[11px] font-semibold tracking-wide uppercase px-4 py-1.5 rounded-full mb-6">
          Music Library
        </span>

        {/* Heading */}
        <h2 className="text-3xl sm:text-5xl font-extrabold text-center text-white leading-tight max-w-5xl">
          Choose from thousands of songs to learn plus over{" "}
          <span className="italic text-[#C49A3C]">3,000 piano exercises</span> for all
          levels!
        </h2>

        {/* Slider */}
        <div className="relative w-full mt-10">
  {/* Controls row */}
  <div className="hidden sm:flex items-center justify-between mb-4">
    <button
      onClick={() => scrollByAmount("left")}
      aria-label="Scroll left"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-[#FFFFFF12] text-[#C49A3C] bg-[#111111] hover:bg-[#C49A3C]/10 transition-colors"
    >
      <Image src="/rightarrow.svg" alt="Left Arrow" width={12} height={12} />
    </button>

    <button
      onClick={() => scrollByAmount("right")}
      aria-label="Scroll right"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-[#FFFFFF12] text-[#C49A3C] bg-[#111111] hover:bg-[#C49A3C]/10 transition-colors"
    >
            <Image src="/Text.svg" alt="Left Arrow" width={12} height={12} />

    </button>
  </div>

  {/* Slider */}
  {loading ? (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[180px] sm:w-[200px] h-[240px] rounded-xl bg-white/5 animate-pulse"
        />
      ))}
    </div>
  ) : (
    <div
      ref={scrollerRef}
      className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
    >
      {allSongs.map((song) => (
        <button
          key={song.id}
          onClick={goToLibrary}
          className="group flex-shrink-0 w-[180px] sm:w-[200px] snap-start text-left rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-[#C49A3C]/60 transition-colors"
        >
          <div className="relative w-full h-[160px] sm:h-[180px]">
            <Image
              src={song.imageUrl}
              alt={song.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="bg-white px-3 py-2.5">
            <p className="text-sm font-semibold text-[#151517] truncate">
              {song.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {song.artist?.name}
            </p>
          </div>
        </button>
      ))}
    </div>
  )}
</div>

        {/* Callout */}
        <p className="text-center text-sm text-gray-400 mt-8">
          <span className="text-[#C49A3C] font-semibold">NEW!</span> Including popular
          titles from Hal Leonard, Alfred, and FJH Music Company publishers!
        </p>

        {/* CTA */}
        <button
          onClick={goToLibrary}
          className="mt-6 border border-[#C49A3C40] text-[#C49A3C] font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-[#C49A3C] hover:text-[#0A0A0A] transition-colors"
        >
          More Songs
        </button>
      </div>
    </div>
  );
}