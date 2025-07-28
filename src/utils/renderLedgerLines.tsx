import React, { JSX } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderLedgerLines(x: number, y: number, isTreble: boolean, _note: number): JSX.Element {
    const lines: JSX.Element[] = [];
    const staffTop = isTreble ? 20 : 140;
    const staffBottom = staffTop + 4 * 20; // 4 spaces between 5 lines
    
    if (y < staffTop) {
      // Add ledger lines above the staff
      let lineY = staffTop;
      while (lineY >= y) {
        lines.push(
          <line
            key={`ledger-above-${lineY}`}
            x1={x - 10}
            y1={lineY}
            x2={x + 10}
            y2={lineY}
            stroke="black"
            strokeWidth="1"
          />
        );
        lineY -= 20; // Move up one staff line gap
      }
    } else if (y > staffBottom) {
      // Add ledger lines below the staff
      let lineY = staffBottom;
      while (lineY <= y) {
        lines.push(
          <line
            key={`ledger-below-${lineY}`}
            x1={x - 10}
            y1={lineY}
            x2={x + 10}
            y2={lineY}
            stroke="black"
            strokeWidth="1"
          />
        );
        lineY += 20; // Move down one staff line gap
      }
    }
    
    return <>{lines}</>;
}
export default renderLedgerLines;