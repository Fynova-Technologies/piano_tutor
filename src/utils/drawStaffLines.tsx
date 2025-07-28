export default function drawStaffLines (yStart: number,STAFF_WIDTH:number,STAFF_LINE_GAP:number) {
    return new Array(5).fill(0).map((_, i) => (
      <line
        key={i}
        x1={10}
        y1={yStart + i * STAFF_LINE_GAP}
        x2={STAFF_WIDTH +100}
        y2={yStart + i * STAFF_LINE_GAP}
        stroke="black"
        strokeWidth="1"
    />    
    ));
  };