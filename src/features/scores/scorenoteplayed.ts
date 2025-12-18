function scoreNotePlayed(
  midiNote: number,
  playModeRef: { current: boolean },
  currentCursorStepRef: { current: number },
  scoredStepsRef: { current: Set<number> },
  currentStepNotesRef: { current: number[] },
  correctStepsRef: { current: number }
) {
  if (!playModeRef.current) return;

  const step = currentCursorStepRef.current;
  if (scoredStepsRef.current.has(step)) return;

  const expected = currentStepNotesRef.current || [];

  if (expected.includes(midiNote)) {
    correctStepsRef.current += 1;
  }

  // lock this step (right or wrong)
  scoredStepsRef.current.add(step);
}

export default scoreNotePlayed;
