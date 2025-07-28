import React, {JSX} from 'react';

export function drawSlider(
  systemIndex: 0 | 1,
  beatsPerSystem: number,
  sliderBeat: number,
  STAFF_WIDTH: number,
  CLEF_WIDTH: number,
  STAFF_LINE_GAP: number
): JSX.Element | null {
  const totalBeats = beatsPerSystem * 2;
  if (sliderBeat < 0 || sliderBeat >= totalBeats) return null;

  const isUpper = systemIndex === 0;
  const inUpper = sliderBeat < beatsPerSystem;
  if (isUpper !== inUpper) return null;

  const beatInSystem = inUpper
    ? sliderBeat
    : sliderBeat - beatsPerSystem;

  const beatWidth = (STAFF_WIDTH - CLEF_WIDTH) / beatsPerSystem;
  const x = CLEF_WIDTH + 15 + beatInSystem * beatWidth + beatWidth / 2;

  if (isUpper) {
    const y1 = 20;
    const y2 = 200 + 4 * STAFF_LINE_GAP + STAFF_LINE_GAP;
    return (
      <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} width={STAFF_WIDTH} height={y2 + 20}>
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="red"
          strokeWidth="20"
          opacity={0.6}
        />
      </svg>
    );
  }
  else {
    const y1 = 100;
    const y2 = 280 + 4 * STAFF_LINE_GAP + STAFF_LINE_GAP;
    return (
      <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} width={STAFF_WIDTH} height={y2 + 20}>
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="red"
          strokeWidth="20"
          opacity={0.6}
        />
      </svg>
    );
  }
}
