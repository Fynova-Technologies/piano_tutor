// import { XMarkIcon, LockClosedIcon, StarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState } from 'react';
import PopupHeartIcon from '@/components/favouritepopup/popupHeartanimation';

interface SubLevel {
  name: string;
}

interface Level {
  difficulty: string;
  locked?: boolean;
  subLevels: SubLevel[];
}

type SongInformation = {
  id: number;
  title: string;
  artist: string;
  ratings: number;
  imageUrl: string;
};

const levels: Level[] = [
  { difficulty: "Easy", subLevels: [{ name: "Whole" }] },
  { difficulty: "Intermediate", locked: true, subLevels: [{ name: "Whole" }, { name: "Chopped" }] },
  { difficulty: "Advance", locked: true, subLevels: [{ name: "Whole" }, { name: "Chopped" }] },
  { difficulty: "Professional", locked: true, subLevels: [{ name: "Whole" }, { name: "Chopped" }, { name: "Minced" }] },
];

export default function GetPopupContainer({ dialogueSong, openDialogue, setOpenDialogue }: { dialogueSong: SongInformation; openDialogue: boolean, setOpenDialogue: React.Dispatch<React.SetStateAction<boolean>>  }) {
  const [liked, setLiked] = useState<{ [id: string]: boolean }>({});
  const handleClick = (id:number) => {
     setLiked((prev) => ({
      ...prev,
      [id]: !prev[id],
    })); 
    };
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FEFEFE] rounded-4xl shadow-lg w-full max-w-[60%] p-6 flex flex-col  gap-6">
        
        {/* Left section: Title + Image */}
        <div className=" flex justify-between ">
          <h2 className="text-lg font-bold mb-4 text-black">{dialogueSong.title}</h2>
          <div className=" flex justify-space-between items-center gap-4">
            <div className=" cursor-pointer text-black"       onClick={() => handleClick(dialogueSong.id)}>
              <PopupHeartIcon isLiked={liked[dialogueSong.id]} />
            </div>
            <Image
              src="/assets/cross-circle.svg"
              alt="Album cover"
              height={32}
              width={32}
              className="rounded-2xl border cursor-pointer"
              onClick={() => setOpenDialogue(!openDialogue)}
            />
          </div>
        </div>

        {/* Right section: Levels */}
        <div className="flex relative">
          {/* Top right icons */}
          <div className='w-[40%] mr-10'>
            <Image
              src={dialogueSong.imageUrl || "/songs/s1.jpg"} 
              alt="Album cover"
              height={600}
              width={200}
              className="w-full h-[100%] rounded-2xl border"
            />
          </div>

          <div className="w-[60%]">
            {levels.map((level, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-none"
              >
                {/* Difficulty & lock */}
                <div className="flex items-center gap-2 sm:w-[70%]">
                  {/* {level.locked && <LockClosedIcon className="w-5 h-5 text-black" />} */}
                  <Image
                        src="/assets/lock.svg"
                        alt="Star icon"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                  <span className='text-black'>{level.difficulty}</span>
                </div>

                {/* Sub-levels */}
                <div className="flex items-center gap-12 flex-wrap mt-2 sm:mt-0 sm:w-2/3">
                  {level.subLevels.map((sub, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      {/* <StarIcon className="w-4 h-4" /> */}
                      <Image
                        src="/assets/Star.svg"
                        alt="Star icon"
                        width={16}
                        height={16}
                        className=""
                      />
                      <span className="text-sm text-black">{sub.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
     );
}