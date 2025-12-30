import playCursor from "../playback/playcursor";
import pauseCursor from "../playback/pausecursor";
import clearHighlight from "../notes/clearhighlight";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import Image from "next/image";


type CursorControlsProps = {
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    osmdRef: React.MutableRefObject<OpenSheetMusicDisplay>;
    playModeRef: React.MutableRefObject<boolean>;
    totalStepsRef: React.MutableRefObject<number>;
    correctStepsRef: React.MutableRefObject<number>;
    scoredStepsRef: React.MutableRefObject<Set<number>>;
    currentCursorStepRef: React.MutableRefObject<number>;
    currentStepNotesRef: React.MutableRefObject<number[]>;
    setPlayIndex: (index: number) => void;
    playIndex: number;
    totalSteps: number;
    midiOutputs: MIDIOutput[];
    midiInRef: React.RefObject<MIDIInput | null>;
    playbackMidiGuard: React.MutableRefObject<number>;
    setCountdown: (countdown: number | null) => void;
    setHighScore: React.Dispatch<React.SetStateAction<number | null>>;
    setLastScore:  React.Dispatch<React.SetStateAction<number | null>>;
    score: number;
    highScore: number;
    lastScore: number | null,
    setCurrentStepNotes: (notes: number[]) => void,
    setScore: (score: number | null) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onProgressClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, osmdRef: React.MutableRefObject<any>, setPlayIndex: (n: number) => void) => void,
    containerRef: React.RefObject<HTMLDivElement | null>,
    countdown: number | null,
    progressPercent: number
}


export default function curosrControls (props: CursorControlsProps) {
        const {
            isPlaying,
            setIsPlaying,
            osmdRef,
            playModeRef,
            totalStepsRef,
            correctStepsRef,
            scoredStepsRef,
            currentCursorStepRef,
            currentStepNotesRef,
            setPlayIndex,
            playIndex,
            totalSteps,
            midiOutputs,
            midiInRef,
            playbackMidiGuard,
            setCountdown,
            setHighScore,
            setLastScore,
            // score,
            highScore,
            lastScore,
            setCurrentStepNotes,
            setScore,
            onProgressClick,
            containerRef,
            countdown,
            progressPercent
        } =  props;
    return(
        <>
          {/* ========== Original Controls ========== */}
          <div className="text-sm text-white mb-4">
            <strong>Keyboard Controls:</strong> Space = Play/Pause | Piano keys: A W S E D F T G Y H U J K (C to C, white & black keys)
          </div>
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>

            <div style={{ minWidth: 180 }}>
              <div style={{ fontSize: 12, color: "#fff" }}>Progress: {playIndex} / {totalSteps}</div>
            </div>

            <div style={{ marginLeft: "auto", fontSize: 13 }}>
              MIDI In: {midiInRef.current?.name || "none"} | Out: {midiOutputs.length > 0 ? midiOutputs[0].name : "none"}
            </div>
          </div>

          <div className="progress-bar" onClick={e => onProgressClick(e,osmdRef,setPlayIndex)} style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>

            <div>
              {/* <div style={{ display: "flex", gap: 16, fontSize: 16, marginBottom: 12 }}>
                <div>🎯 Score: <strong>{score}</strong></div>
                <div>🕘 Last: {lastScore ?? "-"}</div>
               <div>🏆 High: {highScore}</div>
              </div> */}
          </div>

          <div className={`bg-[#FEFEFE] w-full h-[20%] flex justify-between items-center ${isPlaying ? 'hidden' : ''}`} style={{
              boxShadow: '0 10px 30px rgba(50, 50, 93, 0.25)' // or use your own shadow
            }}>
                      <div className="p-5 flex-2">
                        <span className="text-[#0A0A0B] font-medium text-[24px] ml-10">courseTitle</span>
                      </div>
                      <div className="p-4 mr-12">
                        <div className="flex space-x-8 items-center">
                          <div className="flex items-center space-x-3">
                              <Image src="/Frame.svg" width={28} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> {highScore} </span>
                              <span className=" font-medium primary-color-text text-[16px]">  High Score</span>
                          </div>
                          <div className="flex items-center space-x-3">
                              <Image src="/SVGRepo_iconCarrier (1).svg" width={25} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> {lastScore} </span>
                              <span className="font-medium primary-color-text  text-[16px]">Last Score</span>
                          </div>
                          <div className="flex items-center space-x-3">
                              <Image src="/autoplay (1).svg" width={28} height={20} alt="icon"/>
                              <span className="font-semibold text-[24px] primary-color-text font-inter"> playCount </span>
                              <span className="font-medium primary-color-text  text-[16px]">Play Count</span>
                          </div>          
                        </div>
                      </div>
            </div>
          

      <div
        ref={containerRef}
        id="osmd-container"
        style={{ width: "100%", minHeight: "60vh", background: "white", border: "1px solid #ddd" }}
      />
    
    <div className="w-full h-20 flex items-center justify-center relative">

      {/* Left Icon — Far Left */}
      <button className="absolute left-4 p-3 rounded-full border border-solid shadow bg-white hover:shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Center Play Button */}
        <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center gap-2 w-full ">
              <button   className="bg-transparent p-0 border-0 outline-none appearance-none"
                // onClick={() => hasPrevious && !isPlaying && goToLesson(unitLessonsData[currentIndex - 1])}
                // disabled={!hasPrevious}
            >
                <Image src="/skip_previous_filled.svg" alt="skip previous" width={35} height={35} className="" />
              </button>
              {/* <audio
                ref={backgroundSoundRef}
                src="/songs/jungle-waves.mp3"
                loop
              /> */}
            <button
                className=" px-5 py-4 text-white rounded-full border border-solid hover:bg-zinc-300 cursor-pointer bg-white"
                onClick={() => {
                  if (isPlaying) {
                    pauseCursor(osmdRef,setIsPlaying,playModeRef);
                  } else {
                    playCursor({
                      osmdRef,
                      setIsPlaying,
                      playModeRef,
                      totalStepsRef,
                      correctStepsRef,
                      scoredStepsRef,
                      currentCursorStepRef,
                      currentStepNotesRef,
                      setPlayIndex,
                      setCurrentStepNotes,
                      setScore,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      midiOutputs: midiOutputs as any,
                      playbackMidiGuard,
                      setCountdown,
                      setHighScore,
                      setLastScore,
                      clearHighlight,
                  });
                  }
                }}
                //   style={{
                //     padding: "8px 12px",
                //     background: isPlaying ? "#f0a500" : "#4caf50",
                //     color: "white",
                //     border: "none",
                //     borderRadius: 6,
                //     cursor: "pointer",
                //   }}
            >
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="lg" color="#0A0A0B" />
            </button>

            <button className=" text-white rounded bg-transparent border-0 outline-none appearance-none"    
                // onClick={() => hasNext && goToLesson(unitLessonsData[currentIndex + 1])}
                // disabled={!hasNext}
            >
              <Image src="/skip_next_filled.png" width={35} height={35} alt="skip previous" className="" />
            </button>
             <div className="flex mb-5 ml-20 transform -translate-x-1/2">
              <button className="mt-6 text-white px-6 py-2 bg-black rounded-lg hover:bg-green-700 transition">
                Play Note 
                {/* ({5 - (usage?.play_count || 0)}  */}
                free left
                {/* ) */}
              </button>
            </div>
            {/* {errMsg && (
                <div className="bg-red-100 text-red-600 border border-red-300 rounded-lg p-2 mb-3">
                    {errMsg}
                </div>
            )} */}
            </div>
        </div>
         
      {/* Right Icon — Far Right */}
      <div className="Settings absolute right-4 p-3 gap-4">
        <div className="flex items-center justify-end gap-4">
            <button className="bg-[#D4AF37] py-[6px] w-[101px] h-[48px] px-[16px] rounded-2xl border border-solid flex gap-2 primary-color-text items-center text-[16px]">
                <Image src="/icon.svg" width={15} height={10} alt="icon"/> Learn
            </button>
              <Image src="/settings.svg" width={40} height={40} alt="icon" 
              className=" border-gray-300 cursor-pointer p-1"
                // onClick={()=> setOpenDialogue(!openDialogue)}
              />
        </div>
              
        </div>

    </div>      
      {countdown !== null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 96,
      color: "white",
      zIndex: 99999,
      fontWeight: "bold",
    }}
  >
    {countdown === 0 ? "GO!" : countdown}
  </div>
)}
        </>
    )
}