import React, { JSX } from 'react';


type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};

interface NoteRendererProps {
  capturedNotes: CapturedNoteGroup[];
  timeSignature: { top: number; bottom: number };
  isPlaying: boolean;
  systemIndex: 0 | 1; // Add systemIndex property,
  getSliderXForBeat: (beat: number, timeSignature: { top: number }) => number;
  renderLedgerLines: (x: number, y: number, isTreble: boolean, note: number) => JSX.Element;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({
    capturedNotes,
    timeSignature,
    systemIndex,
    getSliderXForBeat,
    renderLedgerLines
  }) => {
    const beatsPerSystem = timeSignature.top * 4;
  
    const notesInThisSystem = capturedNotes.filter(group =>
      systemIndex === 0
        ? group.beat < beatsPerSystem
        : group.beat >= beatsPerSystem
    );

    function isAccidental(note: number): boolean {
    const pitch = note % 12;
    return [1, 3, 6, 8, 10].includes(pitch);
  }

  function getAccidentalSymbol(note: number): string {
      const pitch = note % 12;
      
      // C#, D#, F#, G#, A#
      if ([1, 3, 6, 8, 10].includes(pitch)) {
        return "♯";
      }
      return "";
    }


    return (
      <>
        
        {notesInThisSystem.map((group, gi) =>
          group.notes.map((note, ni) => {
            const x = getSliderXForBeat(group.beat, timeSignature);
            const y = group.y_position; // Use precomputed Y
  
            const showAccidental = isAccidental(note);
            const accidentalSymbol = getAccidentalSymbol(note);
            // offset for simultaneously pressed key notes
            const xOffset = ni * 8; // 8px spacing

  
            return (
              <g key={`${systemIndex}-${gi}-${ni}`} className="note-group">
                {renderLedgerLines(x+xOffset, y, systemIndex === 0, note)}
                {showAccidental && (
                  <text
                    x={x + xOffset - 12}
                    y={y + 5}
                    fontSize="16"
                    fill="#64B5F6"
                    className="accidental"
                  >
                    {accidentalSymbol}
                  </text>
                  
                )}
                <circle
                  cx={x }
                  cy={y}
                  r={4}
                  fill="#64B5F6"
                  className="note-head"
                />
              </g>
            );
          })
        )}
      </>
    );
  };

export default NoteRenderer;
