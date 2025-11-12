import drawStaffLines from "@/utils/drawStaffLines";
import drawMeasureLinesUpper from "@/utils/drawMeasurelinesupper";
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
    wholeNotes: Array<{ whole?: [number, number]; imageSrc: string }>;
    restNotes: Array<{ rest?: [number, number]; imageSrc: string }>;
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
    getSliderXForBeat: (beat: number) => number;
    height: number;
    staffX1: number;
    staffX2: number;
};

export default function drawSvg({
    STAFF_WIDTH,
    CLEF_WIDTH,
    STAFF_LINE_GAP,
    beatsPerSystem,
    timeSignature,
    wholeNotes,
    restNotes,
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
    getSliderXForBeat,
    height,
    staffX1,
    staffX2
}: DrawSvgProps) {
    const getSliderXForBeatSimple = (beat: number) => getSliderXForBeat(beat);
    
    return(
        <div style={{overflow: 'visible'}}>
            <svg width="100%"   viewBox={`0 0 ${STAFF_WIDTH} 350`} height={height}  preserveAspectRatio="xMidYMid meet">  
                {drawStaffLines(staffX1,STAFF_WIDTH, STAFF_LINE_GAP)}
                {drawStaffLines(staffX2 ,STAFF_WIDTH, STAFF_LINE_GAP)}

                 {wholeNotes.map((item, idx) => {
                const [x, y] = item.whole!;
                return (
                  <image
                    key={`whole-${idx}`}
                    href={item.imageSrc}
                    transform={`translate(${x - 18}, ${y - 26}) scale(0.6)`}
                    width={60}
                    height={60}
                    className="transition duration-500 ease-in-out"
                  />
                );
                })}

                {restNotes.map((item, idx) => {
                    const [x, y] = item.rest!;
                    return (
                      <image
                        key={`rest-${idx}`}
                        href={item.imageSrc}
                        transform={`translate(${x - 18}, ${y - 26}) scale(0.6)`}
                        width={30}
                        height={30}
                        className="transition duration-300 ease-in"
                      />
                    );
                })}
                 <defs>
    <clipPath id="leftClip">
      <rect x="-185" y="-90" width="330" height="500" />
    </clipPath>
  </defs>

        
        <image href="/assets/black.svg" x={-185} y={-90} width="330" height="500" />

                <text x={5} y={32 + 3 * STAFF_LINE_GAP} fontSize="90" stroke="black" className="">𝄞</text>
                <text x={5} y={225 + 3 * STAFF_LINE_GAP} fontSize="80" stroke="black">𝄢</text>

                {drawMeasureLinesUpper(20,timeSignature, STAFF_WIDTH, CLEF_WIDTH)}
                <text x={(CLEF_WIDTH + 35) } y={20 + 1 * STAFF_LINE_GAP} className="text-[20px] md:text-[24px]">
                {timeSignature.top}
                </text>
                <text x={(CLEF_WIDTH + 35) } y={20 + 3 * STAFF_LINE_GAP} className="text-[20px] md:text-[24px]">
                  {timeSignature.bottom}
                </text>

                {/* Bass Clef time */}
                <text x={(CLEF_WIDTH + 35) } y={220 + 1 * STAFF_LINE_GAP} className="text-[20px] md:text-[24px]">
                  {timeSignature.top}
                </text>
                <text x={(CLEF_WIDTH + 35) } y={220 + 3 * STAFF_LINE_GAP} className="text-[20px] md:text-[24px]">
                  {timeSignature.bottom}
                </text>

                {drawSlider(0, beatsPerSystem, sliderBeat, STAFF_WIDTH, CLEF_WIDTH, STAFF_LINE_GAP)}
      
                <NoteRenderer
                    capturedNotes={capturedNotes}
                    timeSignature={timeSignature}
                    isPlaying={isPlaying}
                    systemIndex={0}
                    getSliderXForBeat={getSliderXForBeatSimple}
                    renderLedgerLines={renderLedgerLines}
                />      
                <CheckNotesRender capturedNotes={[]} timeSignature={{top: 0,bottom: 0}} isPlaying={isPlaying} systemIndex={0} 
                  checking={checking}  UpperStaffpositions={UpperStaffpositions} LowerStaffpositions={LowerStaffpositions} 
                  keyspositions={keyspositions} THRESHOLD={ THRESHOLD} setCorrectNotes={setCorrectNotes} setInCorrectNotes={setInCorrectNotes}
                  setChecking={setChecking} correctNotes={correctNotes}IncorrectNotes={IncorrectNotes} 
                />
            </svg>
      </div>
    )
}