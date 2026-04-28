import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PopupHeartIcon from '@/components/favouritepopup/popupHeartanimation';

interface SubLevel {
  name: string;   // "Whole" | "Chopped" | "Minced"
}

interface Level {
  difficulty: string;
  variant: string; // matches song.categories.difficulty.level
  locked?: boolean;
  subLevels: SubLevel[];
}

type SongInformation = {
  imageUrl: string;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  variant: string;
  file: string;
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

// All four rows — locked state is derived from the song's variant at render time
const ALL_LEVELS: Level[] = [
  {
    difficulty: "Easy",
    variant: "beginner",
    subLevels: [{ name: "Whole" }],
  },
  {
    difficulty: "Intermediate",
    variant: "intermediate",
    subLevels: [{ name: "Whole" }, { name: "Chopped" }],
  },
  {
    difficulty: "Advance",
    variant: "advanced",
    subLevels: [{ name: "Whole" }, { name: "Chopped" }],
  },
  {
    difficulty: "Professional",
    variant: "professional",
    subLevels: [{ name: "Whole" }, { name: "Chopped" }, { name: "Minced" }],
  },
];

// Variant rank — higher rank = more unlocked rows
const VARIANT_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
};

const LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
};

export default function GetPopupContainer({
  dialogueSong,
  openDialogue,
  setOpenDialogue,
}: {
  dialogueSong: SongInformation;
  openDialogue: boolean;
  setOpenDialogue: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState<{ [id: string]: boolean }>({});

  const handleClick = (id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine which rows are unlocked based on song's variant
  const songVariantRank = VARIANT_RANK[dialogueSong.categories.difficulty.level] ?? 1;

  const handleSubLevelClick = (level: Level, sub: SubLevel) => {
    const params = new URLSearchParams({
      file: dialogueSong.file,
      title: dialogueSong.title,
      source: "library",
      lessonid: dialogueSong.id,
      difficulty: level.variant,   // e.g. "beginner" | "intermediate" | "advanced"
      cursor: sub.name.toLowerCase(), // "whole" | "chopped" | "minced"
    });
    setOpenDialogue(false);
    router.push(`/librarysongs?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FEFEFE] rounded-4xl shadow-lg w-full max-w-[60%] p-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between">
          <h2 className="text-lg font-bold mb-4 text-black">{dialogueSong.title}</h2>
          <div className="flex justify-space-between items-center gap-4">
            <div className="cursor-pointer text-black" onClick={() => handleClick(dialogueSong.id)}>
              <PopupHeartIcon isLiked={liked[dialogueSong.id]} />
            </div>
            <Image
              src="/assets/cross-circle.svg"
              alt="Close"
              height={32}
              width={32}
              className="rounded-2xl border cursor-pointer"
              onClick={() => setOpenDialogue(!openDialogue)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex relative">

          {/* Album art */}
          <div className="w-[40%] mr-10">
            <Image
              src={dialogueSong.imageUrl || "/songs/s1.jpg"}
              alt="Album cover"
              height={600}
              width={200}
              className="w-full h-[100%] rounded-2xl border"
            />
          </div>

          {/* Levels */}
          <div className="w-[60%]">
            {ALL_LEVELS.map((level, idx) => {
              const levelRank = LEVEL_RANK[level.variant] ?? 99;
              const isUnlocked = levelRank <= songVariantRank;

              return (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-none"
                >
                  {/* Difficulty label + lock */}
                  <div className="flex items-center gap-2 sm:w-[40%]">
                    <Image
                      src={isUnlocked ? "/assets/unlock.svg" : "/assets/lock.svg"}
                      alt={isUnlocked ? "Unlocked" : "Locked"}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span className="text-black">{level.difficulty}</span>
                  </div>

                  {/* Sub-levels */}
                  <div className="flex items-center gap-8 flex-wrap mt-2 sm:mt-0 sm:w-[60%]">
                    {level.subLevels.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubLevelClick(level, sub)}
                        className={[
                          "flex flex-col items-center gap-1 group transition-opacity",
                          // All clickable per requirement — but visually dim locked rows
                          isUnlocked
                            ? "opacity-100 cursor-pointer"
                            : "opacity-40 cursor-pointer",
                        ].join(" ")}
                      >
                        <Image
                          src="/assets/Star.svg"
                          alt="Star icon"
                          width={16}
                          height={16}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <span className="text-sm text-black group-hover:font-semibold transition-all">
                          {sub.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}