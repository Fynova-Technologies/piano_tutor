'use client'
import Image from "next/image";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { useSearchParams, useRouter } from "next/navigation";
import { MutableRefObject, Dispatch, SetStateAction, useEffect } from "react";
import { getUserUsage, recordPlay } from "@/lib/pyawallHelpers"
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PaywallButton from "../paywallcomponents/paywallWidget";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

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
  setBackgroundVolume?: Dispatch<SetStateAction<number>>;
  backgroundVolume?: number;
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
  backgroundSoundRef,
  backgroundVolume,
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

useEffect(() => {
if (!backgroundSoundRef.current) return;

  if (!isPlaying || (backgroundVolume ?? 0) / 100 === 0) {
    backgroundSoundRef.current.pause();
  } else {
    backgroundSoundRef.current.play();
  }
  if (backgroundSoundRef.current && backgroundVolume !== undefined) {
    backgroundSoundRef.current.volume = backgroundVolume / 100;
    console.log("Background Volume:", backgroundVolume / 100);
  }

  (async () => {
    try {
      const agent = await FingerprintJS.load();
      const result = await agent.get();
      console.log('Device ID:', result.visitorId);
    } catch (e) {
      console.error('FingerprintJS error:', e);
    }
  })();
}, [backgroundSoundRef, isPlaying, backgroundVolume]);
  const [isAuthorizedDevice, setIsAuthorizedDevice] = useState(false);

  // paywall integration here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [usage, setUsage] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [paywalled, setPaywalled] = useState(false)
    const [errMsg,setErrorMsg]=useState<string|null>(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [userLoggedIn,setUserLoggedIn]=useState<boolean>(false)
    const [count,setCount]=useState<number>(0)
    const [resultcount,setResultCount]=useState<number>(0)
  
useEffect(() => {
  (async () => {
    try {
      const usageData = await getUserUsage()
      setUsage(usageData)
      setPaywalled(usageData?.play_count >= 5 && !usageData?.is_subscribed)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load usage:', err)
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if(data.session){setUserLoggedIn(true);}
      if (error) throw error;
    } catch (error) {
      console.log("Error getting session:", error);
    }

    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const deviceId = result.visitorId;

      const res = await fetch('/api/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      const responseData = await res.json();
      setIsAuthorizedDevice(responseData.authorized);
      console.log('Authorization status:', responseData.authorized);
    } catch (err) {
      console.error('Verification failed:', err);
      setIsAuthorizedDevice(false);
    }

    try {
      const fp2 = await FingerprintJS.load();
      const result2 = await fp2.get();
      console.log(result2.visitorId);
    } catch (err) {
      console.error(err);
    }
  })();
}, [])
    const countIncreament = ()=>{
if(resultcount<5){
        setCount(resultcount)
      }
      if(resultcount===5){
        setCount(resultcount + 1);
      }
      if(!resultcount){
        setCount(prevCount => prevCount + 1);

      }
      console.log("Count clicked", count)
    }  
  
    const handlePlay = async () => {
      const result = await recordPlay()
      setResultCount(result.count)
      
      if (result.error){
        setErrorMsg(result.error)
        return
      }
      if (result.paywalled) {
        setPaywalled(true)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUsage((prev: any) => ({
          ...prev,
          play_count: result.count,
        }))
      }
    }
  
    if (loading) return <p>Loading...</p>
  
    if (paywalled) {
      return (
        <div className="flex flex-col justify-center items-center text-center p-8 rounded-xl fixed inset-24 bg-gray-100/80">
          <div className=" rounded-lg p-6 shadow-lg max-w-md w-full bg-white">
            <h2 className="text-2xl font-bold mb-4 text-black">🎵 You&apos;ve reached your free play limit!</h2>
            <p className="text-gray-600 mb-6">
              Subscribe to unlock unlimited access.
            </p>
            <PaywallButton />
          </div>
        </div>
      )
    }

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
                  disabled={!isAuthorizedDevice}
                  className=" px-5 py-4 bg-white text-white rounded-full hover:bg-zinc-300 cursor-pointer"
                  onClick={async () => {
                    if (isPlaying || isCountingIn) {
                      setIsPlaying(false);
                      return;
                    }      
                    countIncreament()              
                    handlePlay()

                    // if(userLoggedIn || count>=7){

                    setCapturedNotes([])
                    setPlayCount(prev=>prev+1)
                    await Promise.resolve();
                    await initializeAudioContext();
                    if(!errMsg){
                    setIsCountingIn(true);
                    setSliderBeat(0);}
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
                    if(!errMsg){
                    setTimeout(() => {
                      setIsCountingIn(false);
                      setIsMetronomeRunning(true);
                      setIsPlaying(true);
                    }, (startTime - now) * 1000);
                  }}
                  
                }
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="lg" color="#0A0A0B" />
                  
                </button>        
                <button className="px-4 py-2  text-white rounded"    onClick={() => hasNext && goToLesson(unitLessonsData[currentIndex + 1])}
                    disabled={!hasNext}>
                  <Image src="/skip_next_filled.png" width={45} height={20} alt="skip previous" className="ml-2" />
                </button>
                </div>
                <div className="flex bottom-4 left-1/2 transform -translate-x-1/2">
                  <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                    Play Note ({5 - (usage?.play_count || 0)} free left)
                  </button>
                  
                </div>
                {errMsg && (
        <div className="bg-red-100 text-red-600 border border-red-300 rounded-lg p-2 mb-3">
          {errMsg}
        </div>
      )}
              </div>
    )
}