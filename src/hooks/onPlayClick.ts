type OnPlayClickProps = {
  audioContextRef: React.RefObject<AudioContext | null>;
  countInBuffers: React.RefObject<(AudioBuffer | null)[]>;
};

export default function OnPlayClick({ audioContextRef, countInBuffers }: OnPlayClickProps) {
    const playClick = (time = 0, isDownbeat = false, countInIndex: number | null = null) => {
    if (!audioContextRef.current) return;
    if (countInIndex !== null && countInBuffers.current[countInIndex]) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = countInBuffers.current[countInIndex];
      source.connect(audioContextRef.current.destination);
      source.start(time);
      return;
    }
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain(); 
    osc.type = 'square';
    osc.frequency.value = isDownbeat ? 330 : 330;
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  };

    return(playClick)
}