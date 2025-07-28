import { useCallback } from "react";
type NoteEvent = { note: number; time: number };

type CaptureChordGroupProps = {
  sliderBeatRef: React.MutableRefObject<number>;
  getNoteY: (note: number, clef: "treble" | "middle" | "bass", systemIndex: number) => number;
  activeNotes: React.MutableRefObject<Map<number, number>>;
  setCapturedNotes: React.Dispatch<React.SetStateAction<
    {
      beat: number;
      notes: number[];
      x_position: number;
      y_position: number;
      systemIndex: 0 | 1;
    }[]
  >>;
  setKeysPositions: React.Dispatch<React.SetStateAction<{ [key: string]: [number, number, number][] }>>;
  getSliderXForBeat: (beat: number, timeSignature: { top: number }) => number;
  timeSignature: { top: number; bottom: number };
  getClefForNote: (note: number) => "treble" | "middle" | "bass";
};

export default function CaptureChordGroup({
  sliderBeatRef,
  getNoteY,
  activeNotes,
  setCapturedNotes,
  setKeysPositions,
  getSliderXForBeat,
  timeSignature,
  getClefForNote,
}: CaptureChordGroupProps) {
    const captureChordGroup = useCallback((group: NoteEvent[]) => {
      if (group.length === 0) return;
    
        const currentSliderBeat = sliderBeatRef.current;
        const x_absolute = getSliderXForBeat(currentSliderBeat, timeSignature);
        const systemIndex = currentSliderBeat < timeSignature.top * 4 ? 0 : 1;
        const newNotes = group.map((ev, i) => {
        const clef = getClefForNote(ev.note);
        const y = getNoteY(ev.note, clef, systemIndex);
        const isTreble = systemIndex === 0;
    
        setKeysPositions((prevPos) => {
          const currentPositions = prevPos[ev.note] || [];
          const newPosition: [number, number, number] = [x_absolute, y, isTreble ? 0 : 1];
    
          const alreadyExists = currentPositions.some(
            (pos) => pos[0] === newPosition[0] && pos[1] === newPosition[1] && pos[2] === newPosition[2]
          );
    
          if (alreadyExists) return prevPos;
    
          return {
            ...prevPos,
            [ev.note]: [...currentPositions, newPosition],
          };
        });
    
        activeNotes.current.set(ev.note, currentSliderBeat);
        console.log("i",i)
        return {
          beat: currentSliderBeat,
          notes: [ev.note],
          x_position: x_absolute,
          y_position: y,
          systemIndex: isTreble ? 0 : 1 as 0 | 1,
        };
      });
    
      setCapturedNotes((prev) => [...prev, ...newNotes]);
    }, [sliderBeatRef, getSliderXForBeat, timeSignature, setCapturedNotes, getClefForNote, getNoteY, setKeysPositions, activeNotes]);
    
    return (captureChordGroup);
}