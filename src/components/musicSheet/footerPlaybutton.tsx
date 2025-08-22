'use client'
import Image from "next/image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useRouter } from "next/navigation";
import { MutableRefObject, Dispatch, SetStateAction, useEffect } from "react";

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number;
};

type UnitLesson = {
  
     id: string, lessontitle: string, link: string, pattern: string, patternkey: string 
  
};

interface FooterPlayButtonProps {
  nextNoteTimeRef: MutableRefObject<number>;
  scheduleAheadTime: number;
  playClick: (time: number, isDownbeat: boolean, beatIndex: number) => void;
  audioContextRef: MutableRefObject<AudioContext | null>;
  currentBeatRef: MutableRefObject<number>;
  setSliderBeat: Dispatch<SetStateAction<number>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  scheduler: () => void;
  timerID: MutableRefObject<NodeJS.Timeout | null>;
  isCountingIn: boolean;
  isPlaying: boolean;
  bpm: number;
  setIsCountingIn: Dispatch<SetStateAction<boolean>>;
  setIsMetronomeRunning: Dispatch<SetStateAction<boolean>>;
  setCapturedNotes: React.Dispatch<React.SetStateAction<CapturedNoteGroup[]>>;
  setPlayCount: React.Dispatch<React.SetStateAction<number>>;
  unitLessonsData: UnitLesson[];
  initializeAudioContext: () => Promise<void>;
  id:string,
  backgroundSoundRef: MutableRefObject<HTMLAudioElement | null>;
}

export default function FooterPlayButton({nextNoteTimeRef,
  scheduleAheadTime,
  playClick,
  audioContextRef,
  currentBeatRef,
  setSliderBeat,
  setIsPlaying,
  scheduler,
  timerID,
  isCountingIn,
  isPlaying,
  bpm,
  setIsCountingIn,
  setIsMetronomeRunning,
  initializeAudioContext,
  setCapturedNotes,
  setPlayCount,
  unitLessonsData,
  id,
  backgroundSoundRef
}: FooterPlayButtonProps) {

  const searchParams = useSearchParams();
  const router = useRouter();
  const currentId = searchParams.get("unitId");
  const currentIndex = unitLessonsData.findIndex(lesson => lesson.id === currentId);

  const goToLesson = (lesson: unknown) => {
    const typedLesson = lesson as UnitLesson;
    console.log("typesLesson",typedLesson)
    const params = new URLSearchParams({
      id: id,
      title: typedLesson.lessontitle,
      pattern: typedLesson.pattern ?? "",
      patternkey: typedLesson.patternkey ?? "",
      unitId: typedLesson.id??""
    });
    router.push(`${typedLesson.link}?${params.toString()}`);
  };
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < unitLessonsData.length - 1;
  // const toggleMusic = () => {
  //   if (!backgroundSoundRef.current) return;

  //   if (isPlaying) {
  //     backgroundSoundRef.current.pause();
  //   } else {
  //     backgroundSoundRef.current.play();
  //   }
  // };

  useEffect(() => {
    if (!backgroundSoundRef.current) return;

    if (!isPlaying) {
      backgroundSoundRef.current.pause();
    } else {
      backgroundSoundRef.current.play();
    }
  })


    return(
        <div className="flex items-center justify-center w-full">
                <div className="flex items-center justify-center gap-2 w-full">
                  <button className="px-5 py-2 text-white"onClick={() => hasPrevious && !isPlaying && goToLesson(unitLessonsData[currentIndex - 1])}
                    disabled={!hasPrevious}>
                    <Image src="/skip_previous_filled.png" width={45} height={20} alt="skip previous" className="ml-2" />
                  </button>
                  <audio
                    ref={backgroundSoundRef}
                    src="/songs/jungle-waves.mp3"
                    loop
                  />
                <button
                  className=" px-5 py-4 bg-white text-white rounded-full hover:bg-zinc-300 cursor-pointer"
                  onClick={async () => {
                    if (isPlaying || isCountingIn) {
                      setIsPlaying(false);
                      return;
                    }
                    setCapturedNotes([])
                    setPlayCount(prev=>prev+1)
                    await Promise.resolve();
                    await initializeAudioContext();
                    setIsCountingIn(true);
                    setSliderBeat(0);
                    // toggleMusic();
                    currentBeatRef.current = 0;                  
                    const now = audioContextRef.current!.currentTime;
                    const scheduleTime = now;                  
                    for (let i = 0; i < 4; i++) {
                      const beatTime = scheduleTime + (i * 60) / bpm;
                      playClick(beatTime, i === 0, i);
                    }                  
                    const totalDelay = (4 * 60) / bpm + 0.5;
                    nextNoteTimeRef.current = scheduleTime + totalDelay;
                    currentBeatRef.current = 0;                  
                    const startTime = nextNoteTimeRef.current - scheduleAheadTime;
                    timerID.current = setInterval(scheduler, 25);
                  
                    setTimeout(() => {
                      setIsCountingIn(false);
                      setIsMetronomeRunning(true);
                      setIsPlaying(true);
                    }, (startTime - now) * 1000);
                  }}
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="lg" color="#0A0A0B" />
                </button>        
                <button className="px-4 py-2  text-white rounded"    onClick={() => hasNext && goToLesson(unitLessonsData[currentIndex + 1])}
                    disabled={!hasNext}>
                  <Image src="/skip_next_filled.png" width={45} height={20} alt="skip previous" className="ml-2" />
                </button>
                </div>
              </div>
    )
}