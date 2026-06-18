import { loadCountInSound } from "@/utils/loadCountInSound";
import { useAudioSettingsStore } from "@/store/audioSettingsStore";
import { metronomeService } from "./metronomeService";

class CountdownSoundService {
  private buffersRef: { current: (AudioBuffer | null)[] } = {
    current: [null, null, null, null],
  };
  private loaded = false;
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];
  private activeSources: AudioBufferSourceNode[] = [];  // ← ADD

  private async ensureBuffers(): Promise<void> {
    const ctx = await metronomeService.ensureAudioContext();
    if (this.loaded && this.buffersRef.current.every(Boolean)) return;
    await loadCountInSound(ctx, {
      current: this.buffersRef.current,
    } as { current: (AudioBuffer | null)[] });
    this.loaded = true;
  }

  stop(): void {
    this.activeTimeouts.forEach(clearTimeout);
    this.activeTimeouts = [];

    // ← ADD: cancel scheduled audio sources
    this.activeSources.forEach(source => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
    });
    this.activeSources = [];
  }

  async playCountIn(bpm: number,stepMs: number, onComplete?: () => void): Promise<void> {
    this.stop();
    const enabled = useAudioSettingsStore.getState().getEffectiveVolume("countdown");
    if (enabled <= 0) {
      onComplete?.();
      return;
    }
    await this.ensureBuffers();
    const ctx = await metronomeService.ensureAudioContext();
    const gain = useAudioSettingsStore.getState().getEffectiveVolume("countdown");
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
          const beatTime = now + (i * stepMs) / 1000;  // UI-matched timing
      const buffer = this.buffersRef.current[i];
      if (!buffer) continue;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(beatTime);
      this.activeSources.push(source);  // ← ADD
    }

   const totalMs = stepMs * 3 + 100;
  const t = setTimeout(() => onComplete?.(), totalMs);
  this.activeTimeouts.push(t);
  }

  // playClickAt unchanged
  playClickAt(time: number, countInIndex: number): void {
    const gain = useAudioSettingsStore.getState().getEffectiveVolume("countdown");
    if (gain <= 0) return;
    void this.ensureBuffers().then(async () => {
      const ctx = await metronomeService.ensureAudioContext();
      const buffer = this.buffersRef.current[countInIndex];
      if (!buffer) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gainNode = ctx.createGain();
      gainNode.gain.value = gain;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(time);
    });
  }
}

export const countdownSoundService = new CountdownSoundService();