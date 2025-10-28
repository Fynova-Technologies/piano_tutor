type OnPlayClickProps = {
  audioContextRef: React.RefObject<AudioContext | null>;
  countInBuffers: React.RefObject<(AudioBuffer | null)[]>;
  metronomeVolume: number;  
};

export default function OnPlayClick({ audioContextRef, countInBuffers,metronomeVolume }: OnPlayClickProps) {

    const playClick = (time = 0, isDownbeat = false, countInIndex: number | null = null) => {
    if (!audioContextRef.current) return;
    
    if (countInIndex !== null && countInBuffers.current[countInIndex]) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = countInBuffers.current[countInIndex];
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = metronomeVolume;
      source.connect(gainNode);
      source.connect(audioContextRef.current.destination);
      source.start(time);
      return;
    }
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain(); 
    osc.type = 'square';
    osc.frequency.value = isDownbeat ? 330 : 330;
    if (metronomeVolume > 0) {
  gain.gain.setValueAtTime(metronomeVolume/100, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
} else {
  return; // muted
}
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  };

    return(playClick)
}