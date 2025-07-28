import React, { useEffect } from 'react';
interface NoteRendererProps {
  capturedNotes: CapturedNoteGroup[];
  timeSignature: { top: number; bottom: number };
  isPlaying: boolean;
  systemIndex: 0 | 1; // Add systemIndex property
  checking: boolean;
  UpperStaffpositions: { whole?: [number, number] }[];
  LowerStaffpositions: { whole?: [number, number] }[];
  keyspositions: { [key: string]: [number, number, number][] };
  THRESHOLD: number;
  setCorrectNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setInCorrectNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setChecking: React.Dispatch<React.SetStateAction<boolean>>;
  correctNotes: Note[];
  IncorrectNotes: Note[];
}

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};

type Note = { x_pos: number; y_pos: number; systemIndex: number };


const CheckNotesRender: React.FC<NoteRendererProps> = ({ 
        systemIndex, 
        isPlaying,
        checking,
        UpperStaffpositions, 
        LowerStaffpositions,
        keyspositions,
        THRESHOLD, 
        setCorrectNotes,
        setInCorrectNotes,
        setChecking,
        correctNotes,
        IncorrectNotes

    }) => {
    useEffect(() => {
      if (!isPlaying && checking) {
        const correct: Note[] = [];
        const incorrect: Note[] = [];
  
        const expectedUpper = UpperStaffpositions
          .filter(item => item.whole)
          .map(item => item.whole as [number, number]);
        const expectedLower = LowerStaffpositions
          .filter(item => item.whole)
          .map(item => item.whole as [number, number]);
        const playedNotes: [number, number,number][] = Object.values(keyspositions).flat();
        // Upper system (treble)
        const usedUpper: boolean[] = new Array(expectedUpper.length).fill(false);
        playedNotes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, y,z]) => z === 0 )
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .forEach(([x, y,_]) => {
            let matched = -1;
            for (let i = 0; i < expectedUpper.length; i++) {
              if (usedUpper[i]) continue;
              const [ex, ey] = expectedUpper[i];
              if (Math.abs(x - ex) < THRESHOLD && Math.abs(y - ey) < THRESHOLD) {
                matched = i;
                break;
              }
            }
            if (matched !== -1) {
              const [mx, my] = expectedUpper[matched];
              correct.push({ x_pos: mx, y_pos: my, systemIndex: 0 });
              usedUpper[matched] = true;
            } else {
              incorrect.push({ x_pos: x, y_pos: y, systemIndex: 0 });
            }
          });
  
        // Lower system (bass)
        const usedLower: boolean[] = new Array(expectedLower.length).fill(false);
        playedNotes
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, y,z]) => z === 1)
          .forEach(([x, y]) => {
            let matched = -1;
            for (let i = 0; i < expectedLower.length; i++) {
              if (usedLower[i]) continue;
              const [lx, ly] = expectedLower[i];
              if (Math.abs(x - lx) < THRESHOLD && Math.abs(y - ly) < THRESHOLD) {
                matched = i;
                break;
              }
            }
            if (matched !== -1) {
              const [mx, my] = expectedLower[matched];
              correct.push({ x_pos: mx, y_pos: my, systemIndex: 1 });
              usedLower[matched] = true;
            } else {
              incorrect.push({ x_pos: x, y_pos: y, systemIndex: 1 });
            }
          });
  
        setCorrectNotes(correct);
        setInCorrectNotes(incorrect);
        setChecking(false);
      }
    }, [LowerStaffpositions, THRESHOLD, UpperStaffpositions, checking, isPlaying, keyspositions, setChecking, setCorrectNotes, setInCorrectNotes]);
  
    return (
      <>
        {correctNotes
          .filter((note) => note.systemIndex === systemIndex)
          .map((note, idx) => (
            <g key={`correct-${idx}`} className="note-group">
              <circle cx={note.x_pos} cy={note.y_pos} r={6} fill="green" />
            </g>
          ))}
        {IncorrectNotes
          .filter((note) => note.systemIndex === systemIndex)
          .map((note, idx) => (
            <g key={`incorrect-${idx}`} className="note-group">
              <circle cx={note.x_pos} cy={note.y_pos} r={4} fill="red" />
            </g>
          ))}
      </>
    );
  };


export default CheckNotesRender;