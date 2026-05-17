import { usePlaybackStore, type PlaybackStatus } from "@/store/playbackStore";
import { useAudioSettingsStore } from "@/store/audioSettingsStore";
import { loadInstrumentSettings } from "@/lib/userSettings/instrumentSettings";
import { backgroundMusicService } from "./backgroundMusicService";
import { metronomeService } from "./metronomeService";
import { countdownSoundService } from "./countdownSoundService";
import OnPlayClick from "@/hooks/onPlayClick";

let initialized = false;
let unsubscribePlayback: (() => void) | null = null;

function handlePlaybackChange(
  status: PlaybackStatus,
  tempo: number,
  countInEnabled: boolean,
  metronomeMode: "internal" | "external",
): void {
  switch (status) {
    case "counting_in":
      backgroundMusicService.stop();
      if (metronomeMode === "internal") {
        metronomeService.stop();
      }
      if (countInEnabled && metronomeMode === "internal") {
        void countdownSoundService.playCountIn(tempo);
      }
      break;
    case "playing":
      countdownSoundService.stop();
      if (metronomeMode === "internal") {
        metronomeService.start(tempo);
      }
      void backgroundMusicService.start();
      break;
    case "paused":
      if (metronomeMode === "internal") {
        metronomeService.stop();
      }
      backgroundMusicService.stop();
      countdownSoundService.stop();
      break;
    case "stopped":
    default:
      if (metronomeMode === "internal") {
        metronomeService.stop();
      }
      backgroundMusicService.stop();
      countdownSoundService.stop();
      break;
  }
}

export function initAudioEngine(): () => void {
  if (initialized) {
    return () => disposeAudioEngine();
  }
  initialized = true;

  const inst = loadInstrumentSettings();
  usePlaybackStore.getState().setCountInEnabled(inst.metronomeCountIn);
  usePlaybackStore.getState().setTempo(inst.metronomeDefaultBpm);

  const audioContextRef = { current: null as AudioContext | null };
  const countInBuffers = { current: [null, null, null, null] as (AudioBuffer | null)[] };

  void metronomeService.ensureAudioContext().then((ctx) => {
    audioContextRef.current = ctx;
    const playClick = OnPlayClick({
      audioContextRef,
      countInBuffers,
      getMetronomeGain: () =>
        useAudioSettingsStore.getState().getEffectiveVolume("metronome"),
      getCountdownGain: () =>
        useAudioSettingsStore.getState().getEffectiveVolume("countdown"),
      onCountInClick: (time, index) => countdownSoundService.playClickAt(time, index),
    });
    metronomeService.setPlayClick(playClick);
    metronomeService.setAudioContext(ctx);
  });

  const { status, tempo, countInEnabled, metronomeMode } = usePlaybackStore.getState();
  handlePlaybackChange(status, tempo, countInEnabled, metronomeMode);

  unsubscribePlayback = usePlaybackStore.subscribe((state, prev) => {
    if (
      state.status === prev.status &&
      state.tempo === prev.tempo &&
      state.countInEnabled === prev.countInEnabled &&
      state.metronomeMode === prev.metronomeMode
    ) {
      return;
    }
    if (state.status === "playing" && state.tempo !== prev.tempo && state.metronomeMode === "internal") {
      metronomeService.updateTempo(state.tempo);
    }
    handlePlaybackChange(state.status, state.tempo, state.countInEnabled, state.metronomeMode);
  });

  return () => disposeAudioEngine();
}

export function disposeAudioEngine(): void {
  unsubscribePlayback?.();
  unsubscribePlayback = null;
  metronomeService.stop();
  backgroundMusicService.stop();
  countdownSoundService.stop();
  void backgroundMusicService.dispose();
  initialized = false;
}

export function notifyPlaybackStarted(opts?: { countingIn?: boolean; tempo?: number }): void {
  const store = usePlaybackStore.getState();
  if (opts?.tempo !== undefined) store.setTempo(opts.tempo);
  store.setStatus(opts?.countingIn ? "counting_in" : "playing");
}

export function notifyPlaybackPaused(): void {
  usePlaybackStore.getState().setStatus("paused");
}

export function notifyPlaybackStopped(): void {
  usePlaybackStore.getState().stop();
}
