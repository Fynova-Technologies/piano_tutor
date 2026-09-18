'use client';
import { useState } from "react";
import Image from "next/image";
import { Target, Music, Users2, X } from "lucide-react";

export type SongFilters = {
  genre: string | null;
  difficulty: string | null;
  variant: string | null;
};

const GENRES = ["Classical", "Rock", "Instrumental", "Jazz/ Blues"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Professional"];
const VARIANTS = [
  { key: "bootcamp", label: "Boot Camp", icon: Target },
  { key: "solos", label: "Solos", icon: Music },
  { key: "duets", label: "Duets", icon: Users2 },
];

const slugify = (s: string) => s.toLowerCase().replace(/\s|\//g, "-");

// turn a slug back into a readable chip label
const unslugify = (list: string[], slug: string) =>
  list.find((item) => slugify(item) === slug || item.toLowerCase() === slug) ?? slug;

export default function SearchSongs({
  onSearch,
  onFilterChange,
}: {
  onSearch: (q: string) => void;
  onFilterChange: (f: SongFilters) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<SongFilters>({ genre: null, difficulty: null, variant: null });

  const updateFilter = (key: keyof SongFilters, value: string) => {
    const next = { ...filters, [key]: filters[key] === value ? null : value };
    setFilters(next);
    onFilterChange(next);
  };

  const clearFilter = (key: keyof SongFilters) => {
    const next = { ...filters, [key]: null };
    setFilters(next);
    onFilterChange(next);
  };

  const activeChips = [
    filters.genre && { key: "genre" as const, label: unslugify(GENRES, filters.genre) },
    filters.difficulty && { key: "difficulty" as const, label: unslugify(DIFFICULTIES, filters.difficulty) },
    filters.variant && { key: "variant" as const, label: VARIANTS.find((v) => v.key === filters.variant)?.label ?? filters.variant },
  ].filter(Boolean) as { key: keyof SongFilters; label: string }[];

  return (
    <div className="relative flex flex-col items-center w-full px-4">
      <div className="flex w-full justify-center">
        <div className="bg-[#1C1C1E] w-full sm:w-[60%] max-w-[640px] h-14 sm:h-16 flex items-center gap-3 sm:space-x-10 p-3 sm:p-4 rounded-t-[10px]">
          <Image src="/icon/search.svg" alt="Search Icon" height={20} width={40} className="cursor-pointer flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full h-full p-2 sm:p-3 text-sm sm:text-[18px] text-[#ABB7C2] font-normal font-poppins border border-[#1C1C1E] bg-transparent focus:outline-none focus:ring-0 focus:border-[#1C1C1E] placeholder-[#E8E8E9]"
            placeholder="Search ..."
          />
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="z-10 w-[44px] sm:w-[60px] bg-[#D4AF37] rounded--[10px] -ml-8 sm:-ml-12 rounded-bl-4xl rounded-tr-2xl flex justify-center items-center flex-shrink-0"
        >
          <Image src="/icon/sliders-horizontal.svg" height={30} width={30} alt="icons" className="w-5 h-5 sm:w-[30px] sm:h-[30px]" />
        </button>
      </div>

      {open && (
        <div className="z-20 bg-[#1C1C1E] mt-2 w-full sm:w-[60%] max-w-[640px] rounded-b-[10px] rounded-tl-[10px] overflow-hidden">
          {/* Header row: "Filters :" + active chips */}
          <div className="bg-[#1C1C1E] px-5 py-4 flex flex-wrap items-center gap-2">
            <p className="text-white text-sm">Filters :</p>
            {activeChips.length === 0 ? (
              <span className="text-gray-500 text-xs">None selected</span>
            ) : (
              activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="flex items-center gap-1 bg-[#D4AF37] text-[#151517] text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {chip.label}
                  <button onClick={() => clearFilter(chip.key)} aria-label={`Remove ${chip.label} filter`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#272728] p-5">
            {/* Genre */}
            <div className="bg-[#313134] rounded-xl p-5">
              <h3 className="text-white font-bold text-lg mb-3 border-b border-gray-700 pb-2">Genre</h3>
              <ul className="flex flex-col gap-2">
                {GENRES.map((g) => {
                  const slug = slugify(g);
                  return (
                    <li key={g}>
                      <button
                        onClick={() => updateFilter("genre", slug)}
                        className={`text-sm ${
                          filters.genre === slug ? "text-[#D4AF37] font-semibold" : "text-gray-300 hover:text-white"
                        }`}
                      >
                        {g}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Difficulty + Variant */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#313134] rounded-xl p-5">
                <h3 className="text-white font-bold text-lg mb-3 border-b border-gray-700 pb-2">Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => {
                    const slug = d.toLowerCase();
                    return (
                      <button
                        key={d}
                        onClick={() => updateFilter("difficulty", slug)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          filters.difficulty === slug
                            ? "bg-[#D4AF37] text-[#151517]"
                            : "bg-[#3a3a3d] text-white hover:bg-[#4a4a4d]"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#313134] rounded-xl p-5">
                <div className="flex justify-around">
                  {VARIANTS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => updateFilter("variant", key)} className="flex flex-col items-center gap-2">
                      <Icon className={`w-8 h-8 ${filters.variant === key ? "text-[#D4AF37]" : "text-white"}`} />
                      <span className="text-white text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}