export default function finalizeScore(totalStepsRef: { current: number }, correctStepsRef: { current: number }) {
    const total = totalStepsRef.current;
    const correct = correctStepsRef.current;
  
    if (total === 0) return 0;
  
    return Math.round((correct / total) * 100);
  }