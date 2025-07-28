import { useCallback } from 'react';
type SchedulerProps = {
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  bpm: number;
  nextNoteTimeRef: React.MutableRefObject<number>;
  scheduleAheadTime: number;
  currentBeatRef: React.MutableRefObject<number>;
  scheduleNote: (beatNumber: number, time: number | undefined) => void;
  setSliderBeat: (beat: number) => void;
};
export default function Scheduler({audioContextRef,bpm,nextNoteTimeRef,scheduleAheadTime,currentBeatRef,scheduleNote,setSliderBeat}:SchedulerProps){
    const scheduler = useCallback(() => {
        while (
          audioContextRef.current &&
          nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime
        ) {
      
          // Sync slider movement (in real-time) with audio schedule
          const scheduledBeat = currentBeatRef.current;
          const scheduledTime = nextNoteTimeRef.current;
          scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
    
    
      
          // This causes the slider to update at *exactly* the right time
          setTimeout(() => {
            setSliderBeat(scheduledBeat);
          }, (scheduledTime - audioContextRef.current!.currentTime) * 1000);
      
          nextNoteTimeRef.current += 60.0 / bpm;
          currentBeatRef.current++;
        }
      }, [audioContextRef, nextNoteTimeRef, scheduleAheadTime, currentBeatRef, scheduleNote, bpm, setSliderBeat]);
    return scheduler;
}