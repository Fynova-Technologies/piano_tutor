
export const loadCountInSound = async (
  audioContext: AudioContext,
    buffersRef: React.MutableRefObject<(AudioBuffer | null)[]>

) => {
  const soundUrls = [
    '/sound/one.mp3',
    '/sound/two.mp3',
    '/sound/three.mp3',
    '/sound/start.mp3',
  ];

  const promises = soundUrls.map(async (url, i) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    buffersRef.current[i] = buffer;
  });

  await Promise.all(promises);
};
