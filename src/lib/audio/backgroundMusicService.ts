import * as Tone from "tone";
import { useAudioSettingsStore } from "@/store/audioSettingsStore";

const DEFAULT_TRACK = "/songs/jungle-waves.mp3";

class BackgroundMusicService {
  private player: Tone.Player | null = null;
  private gain: Tone.Gain | null = null;
  private started = false;
  private trackUrl = DEFAULT_TRACK;
  private unsubscribe: (() => void) | null = null;

  async ensureInitialized(): Promise<void> {
    if (this.player && this.gain) return;
    await Tone.start();
    this.gain = new Tone.Gain(0).toDestination();
    this.player = new Tone.Player({
      url: this.trackUrl,
      loop: true,
      autostart: false,
    }).connect(this.gain);
    await Tone.loaded();
    this.applyVolume();
    this.unsubscribe = useAudioSettingsStore.subscribe((state, prev) => {
      if (
        state.background.volume !== prev.background.volume ||
        state.background.muted !== prev.background.muted
      ) {
        this.applyVolume();
      }
    });
  }

  setTrack(url: string): void {
    if (url === this.trackUrl) return;
    this.trackUrl = url;
    void this.dispose().then(() => {
      this.player = null;
      this.gain = null;
      this.started = false;
    });
  }

  private applyVolume(): void {
    if (!this.gain) return;
    const gain = useAudioSettingsStore.getState().getEffectiveVolume("background");
    this.gain.gain.rampTo(gain, 0.05);
  }

  async start(): Promise<void> {
    await this.ensureInitialized();
    if (!this.player || this.started) return;
    this.applyVolume();
    if (this.player.state !== "started") {
      this.player.start();
    }
    this.started = true;
  }

  stop(): void {
    if (!this.player) return;
    try {
      this.player.stop();
    } catch {
      /* already stopped */
    }
    this.started = false;
  }

  async dispose(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.player?.dispose();
    this.gain?.dispose();
    this.player = null;
    this.gain = null;
    this.started = false;
  }
}

export const backgroundMusicService = new BackgroundMusicService();
