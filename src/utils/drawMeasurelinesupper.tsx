import React, { JSX } from 'react';

function drawMeasureLinesUpper(yStart:number, timeSignature: { top: number; bottom: number }, STAFF_WIDTH: number, CLEF_WIDTH: number): JSX.Element[] {
    const measureCount = 4;
    const totalBeats = timeSignature.top * measureCount;
    const beatWidth = (STAFF_WIDTH + 29 - CLEF_WIDTH) / totalBeats;
  
    return new Array(measureCount + 1).fill(0).map((_, i) => {
      const x = CLEF_WIDTH - 30 + i * timeSignature.top * beatWidth;
      return (
        <line
          key={`measure-${i}-${yStart}`}
          x1={x}
          y1={yStart}
          x2={x}
          y2={300}
          stroke="black"
          strokeWidth="1"
        />
      );
    });
  }

export default drawMeasureLinesUpper;