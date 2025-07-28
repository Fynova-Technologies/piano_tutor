import drawStaffLines from "@/utils/drawStaffLines";
import drawMeasureLinesLower from "./drawMeasurelinesLower";
import { drawSlider } from "@/utils/drawSlider";
import NoteRenderer from "@/components/musicSheet/noteRenderer";
import CheckNotesRender from "@/components/musicSheet/notesCheckingforender";
import { Dispatch, SetStateAction } from "react";
import renderLedgerLines from "@/utils/renderLedgerLines";

type correctNotes={
  systemIndex: number;
  x_pos : number,
  y_pos : number
}

type CapturedNoteGroup = {
  beat: number;
  notes: number[];
  x_position: number;
  systemIndex: 0 | 1;
  y_position: number; // <-- add this
};

type PatternItem = {
  whole?: [number, number];
  rest?: [number, number];
  imageSrc: string;
};
type Note = { x_pos: number; y_pos: number; systemIndex: number };




type DrawSvgProps = {
    STAFF_WIDTH: number;
    CLEF_WIDTH: number;
    STAFF_LINE_GAP: number;
    beatsPerSystem: number;
    timeSignature: { top: number; bottom: number };
    lowerwholeNotes: Array<{ whole?: [number, number]; imageSrc: string }>;
    lowerrestNotes: Array<{ rest?: [number, number]; imageSrc: string }>;
    sliderBeat: number;
    isPlaying: boolean;
    capturedNotes: CapturedNoteGroup[];
    checking: boolean;
    UpperStaffpositions: PatternItem[];
    LowerStaffpositions: PatternItem[];
    keyspositions: { [key: string]: [number, number, number][] };
    THRESHOLD: number;
    setCorrectNotes: Dispatch<SetStateAction<correctNotes[]>>;
    setInCorrectNotes: Dispatch<SetStateAction<correctNotes[]>>;
    setChecking: Dispatch<SetStateAction<boolean>>;
    correctNotes: Note[];
    IncorrectNotes: Note[];
    getSliderXForBeatSimple: (beat: number) => number;    
    height: number;
    staffX1: number;
    staffX2: number;
};

export default function drawSvgLower({
    STAFF_WIDTH,
    CLEF_WIDTH,
    STAFF_LINE_GAP,
    beatsPerSystem,
    timeSignature,
    lowerwholeNotes,
    lowerrestNotes,
    sliderBeat,
    isPlaying,
    capturedNotes,
    checking,
    UpperStaffpositions,
    LowerStaffpositions,
    keyspositions,
    THRESHOLD,
    setCorrectNotes,
    setInCorrectNotes,
    setChecking,
    correctNotes,
    IncorrectNotes,
    getSliderXForBeatSimple,
    height,
    staffX1,
    staffX2
}: DrawSvgProps) {
    
    return(
        <div>
        <svg width="100%"   viewBox={`0 0 ${STAFF_WIDTH} 350`} height={height}  preserveAspectRatio="xMidYMid meet">

        {drawStaffLines(staffX1,STAFF_WIDTH, STAFF_LINE_GAP)}
        {drawStaffLines(staffX2,STAFF_WIDTH, STAFF_LINE_GAP)}

        {lowerwholeNotes.map((item, idx) => {
        const [x, y] = item.whole!;
        return (
          <image
            key={`whole-${idx}`}
            href={item.imageSrc}
            transform={`translate(${x-18}, ${y-26}) scale(0.6)`}
            width={60}
            height={60}
            className="transition duration-500 ease-in-out"
          />
        );
      })}

          {lowerrestNotes.map((item, idx) => {
        const [x, y] = item.rest!;
        return (
          <image
            key={`rest-${idx}`}
            href={item.imageSrc}
            transform={`translate(${x}, ${y}) scale(0.5)`}
            width={30}
            height={30}
            className="transition duration-300 ease-in"
          />
        );
      })}
        
        <text x={5} y={110 + 3 * STAFF_LINE_GAP} fontSize="90" stroke="black">𝄞</text>
        <text x={5} y={305 + 3 * STAFF_LINE_GAP} fontSize="80" stroke="black">𝄢</text>

        {drawMeasureLinesLower(100,timeSignature,STAFF_WIDTH, CLEF_WIDTH)}

        <text x={CLEF_WIDTH + 35} y={100 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text  x={CLEF_WIDTH + 35} y={100 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

        <text x={CLEF_WIDTH + 35} y={300 + 1 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.top}
        </text>
        <text x={CLEF_WIDTH + 35} y={300 + 3 * STAFF_LINE_GAP} className="text-[24px]">
          {timeSignature.bottom}
        </text>

        {drawSlider(1, beatsPerSystem, sliderBeat, STAFF_WIDTH, CLEF_WIDTH, STAFF_LINE_GAP)}


        
        <NoteRenderer
          capturedNotes={capturedNotes}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          systemIndex={1}
          getSliderXForBeat={getSliderXForBeatSimple}
          renderLedgerLines={renderLedgerLines}
        />      
        

        <CheckNotesRender capturedNotes={[]} timeSignature={{top: 0,bottom: 0}} isPlaying={isPlaying} systemIndex={1} 
    checking={checking}  UpperStaffpositions={UpperStaffpositions} LowerStaffpositions={LowerStaffpositions} 
    keyspositions={keyspositions} THRESHOLD={ THRESHOLD} setCorrectNotes={setCorrectNotes} setInCorrectNotes={setInCorrectNotes}
    setChecking={setChecking}correctNotes={correctNotes}IncorrectNotes={IncorrectNotes} 
  />
    </svg>      </div>
    )
}