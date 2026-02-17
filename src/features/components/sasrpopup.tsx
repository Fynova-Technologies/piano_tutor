'use client'
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const tiers = [
  { Level: "Beginner",      Range: "Level 1",       src: "/sasrpiano.png"   },
  { Level: "Intermediate",  Range: "Level 2 - 6",   src: "/sasrpopup2.png"  },
  { Level: "Advanced",      Range: "Level 7 - 12",  src: "/sasrpopup3.png"  },
  { Level: "Professional",  Range: "Level 13 - 18", src: "/sasrpopup4.png"  },
];

type Lesson = {
  id: string;
  lessontitle: string;
  file?: string;
  source?: string;
  level?: string;
  unitId: string;
};

export default function SasrPopup() {
  const router = useRouter();
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  // Load the JSON once on mount
  useEffect(() => {
    fetch("/unitLessonsData2.json")          // ← adjust filename to match your actual file
      .then((res) => res.json())
      .then((data) => {
        // Flatten all unitlessons from all units into one array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flat = data.Lessons.flatMap((unit: { unitlessons: any[]; fkid: any; }) =>
          unit.unitlessons.map((lesson) => ({
            ...lesson,
            unitId: unit.fkid,
          }))
        );
        setAllLessons(flat);
      });
  }, []);

  const handleTierClick = (level: string) => {
    // Filter lessons that match this level (only lessons that have a `level` field)
    const matches = allLessons.filter(
      (l) => l.level && l.level.toLowerCase() === level.toLowerCase()
    );

    if (matches.length === 0) return; // nothing found yet or no match

    // Pick a random lesson from the matches
    const lesson = matches[Math.floor(Math.random() * matches.length)];

    const params = new URLSearchParams({
      id:       lesson.unitId,
      title:    lesson.lessontitle,
      file:     lesson.file     ?? "",
      unitId:   lesson.unitId,
      source:   lesson.source   ?? "",
      lessonid: lesson.id,
    });

    router.push(`/sasrlesson?${params.toString()}`);
  };

  return (
    <div className="sasr-popup bg-[#FFFFFFE5] p-6 w-[368px] rounded-[24px]">
      <h6 className="text-[20px] text-black font-normal text-center">
        Select a level to begin your piano sight-reading test
      </h6>
      <hr className="border-black border-t- my-4 w-[288px]" />

      {tiers.map((tier, index) => (
        <div
          key={index}
          onClick={() => handleTierClick(tier.Level)}
          className="
            flex justify-between
            bg-[#FEFEFE]
            rounded-[16px]
            h-[107px]
            items-center
            px-5
            mt-4
            cursor-pointer
            shadow-[0_6px_3px_rgba(0,0,0,0.5),inset_0_2px_0px_rgba(255,255,255,0.5),inset_0_-3px_1px_#00000033]
            active:scale-[0.98] transition-transform
          "
        >
          <div className="flex flex-col">
            <Image src="/yellowstar.svg" alt="yellow star" width={30} height={30} />
            <span className="text-[#151517] text-[16px] font-medium">{tier.Level}</span>
            <span className="text-[#151517] text-[12px] font-normal">{tier.Range}</span>
          </div>
          <div className="-mr-5">
            <Image src={tier.src} alt="piano" width={180} height={80} />
          </div>
        </div>
      ))}
    </div>
  );
}
