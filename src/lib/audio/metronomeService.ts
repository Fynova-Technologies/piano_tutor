import { useAudioSettingsStore } from "@/store/audioSettingsStore";

type MetronomeClickFn = (
  time: number,
  isDownbeat: boolean,
  countInIndex: number | null,
) => void;

class MetronomeService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private audioContext: AudioContext | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  private bpm = 100;
  private playClick: MetronomeClickFn | null = null;
  private scheduleAheadTime = 0.2;
  private running = false;

  setPlayClick(fn: MetronomeClickFn): void {
    this.playClick = fn;
  }

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private scheduler = (): void => {
    if (!this.audioContext || !this.playClick) return;
    while (
      this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime
    ) {
      const beat = this.currentBeat;
      const isDownbeat = beat % 4 === 0;
      this.playClick(this.nextNoteTime, isDownbeat, null);
      this.nextNoteTime += 60 / this.bpm;
      this.currentBeat += 1;
    }
  };

  start(bpm: number): void {
    if (this.running) {
      this.bpm = bpm;
      return;
    }
    this.bpm = bpm;
    this.running = true;
    void this.ensureAudioContext().then((ctx) => {
      this.nextNoteTime = ctx.currentTime + 0.05;
      this.currentBeat = 0;
      if (this.timerId) clearInterval(this.timerId);
      this.timerId = setInterval(this.scheduler, 25);
    });
  }

  stop(): void {
    this.running = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentBeat = 0;
  }

  isRunning(): boolean {
    return this.running;
  }

  updateTempo(bpm: number): void {
    this.bpm = bpm;
  }
}

export const metronomeService = new MetronomeService();

export function getMetronomeGain(): number {
  return useAudioSettingsStore.getState().getEffectiveVolume("metronome");
}
