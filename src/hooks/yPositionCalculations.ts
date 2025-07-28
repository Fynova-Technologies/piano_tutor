import  { useCallback } from 'react';
export default function GetNoteYposition({
  STAFF_LINE_GAP,
  getStaffPositionsFromSemitones
}: {
  STAFF_LINE_GAP: number;
  getStaffPositionsFromSemitones: (semitoneDistance: number) => number;
}) {
    const getNoteY = useCallback((
        note: number,
        clef: 'treble' | 'middle' | 'bass',
        systemIndex: number
      ): number => {
        
        const systemYOffset = systemIndex * 82;
        const baseY = clef === 'treble' ? 20 : clef === 'bass' ? 140 : 80; // middle ledger line ~80
        const baseYWithOffset = baseY + systemYOffset;
        const middleStaffLine = baseYWithOffset + 2 * STAFF_LINE_GAP;
      
        if(note>=65&&note<=71){
        const referenceNote =
          clef === 'treble' ? 71 :
          clef === 'bass' ? 50 :
          60;
      
        const referenceY = middleStaffLine;
        const semitoneDistance = referenceNote - note;
        const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
      
        return referenceY + staffPositions * ((STAFF_LINE_GAP / 2));}
        else if(note>=72){
          const referenceNote =
            clef === 'treble' ? 69 :
            clef === 'bass' ? 50 :
            60; // Middle C
        
          const referenceY = middleStaffLine;
          const semitoneDistance = referenceNote - note;
          const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
        
          return referenceY + staffPositions * ((STAFF_LINE_GAP / 2)-2);}
        else{
          const referenceNote =
          clef === 'treble' ? 72 :
          clef === 'bass' ? 50 :
          60; // Middle C
      
        const referenceY = middleStaffLine;
        const semitoneDistance = referenceNote - note;
        const staffPositions = getStaffPositionsFromSemitones(semitoneDistance);
        return referenceY + staffPositions * (STAFF_LINE_GAP / 2);
        }
      }, [STAFF_LINE_GAP, getStaffPositionsFromSemitones]);
    return getNoteY     
}