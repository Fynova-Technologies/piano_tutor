type OnPlayClickProps = {
  audioContextRef: React.RefObject<AudioContext | null>;
  countInBuffers: React.RefObject<(AudioBuffer | null)[]>;
  getMetronomeGain: () => number;
  getCountdownGain?: () => number;
  onCountInClick?: (time: number, index: number) => void;
};

export default function OnPlayClick({
  audioContextRef,
  countInBuffers,
  getMetronomeGain,
  getCountdownGain,
  onCountInClick,
}: OnPlayClickProps) {
  const playClick = (
    time = 0,
    isDownbeat = false,
    countInIndex: number | null = null,
  ) => {
    if (!audioContextRef.current) return;

    if (countInIndex !== null) {
      const countdownGain = getCountdownGain?.() ?? getMetronomeGain();
      if (countdownGain <= 0) return;

      if (onCountInClick) {
        onCountInClick(time, countInIndex);
        return;
      }

      if (countInBuffers.current[countInIndex]) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = countInBuffers.current[countInIndex];
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = countdownGain;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        source.start(time);
      }
      return;
    }

    const metronomeGain = getMetronomeGain();
    if (metronomeGain <= 0) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.type = "square";
    osc.frequency.value = isDownbeat ? 440 : 330;
    gain.gain.setValueAtTime(metronomeGain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  };

  return playClick;
}
