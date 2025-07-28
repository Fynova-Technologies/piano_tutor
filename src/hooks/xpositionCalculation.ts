export default function getSliderXForBeat(beat: number, timeSignature: { top: number },STAFF_WIDTH:number,CLEF_WIDTH:number): number {
       // two systems of `beatsPerSystem` each
       const beatsPerSystem = timeSignature.top * 4;
       // where in its own system this beat falls
       const beatInSystem   = beat % beatsPerSystem;
       const beatWidth      = (STAFF_WIDTH - CLEF_WIDTH) / beatsPerSystem;
       return CLEF_WIDTH + 15 + beatInSystem * beatWidth + beatWidth / 2;
  }