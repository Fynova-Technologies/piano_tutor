export const INSTRUMENT_SETTINGS_KEY = "piano_instrument_settings_v1";

export type VelocityCurve = "soft" | "normal" | "hard";
export type KeyboardRange = 61 | 76 | 88;
export type MetronomeSound = "classic" | "wood" | "beep";
export type NoteNaming = "cde" | "solfege";

export type InstrumentSettings = {
  midiInputId: string | null;
  midiOutputId: string | null;
  /** Display labels at time of save (for dropdown when device unplugged) */
  midiInputLabel: string | null;
  midiOutputLabel: string | null;
  keyboardKeys: KeyboardRange;
  velocityCurve: VelocityCurve;
  metronomeDefaultBpm: number;
  metronomeCountIn: boolean;
  metronomeAccentBeat: boolean;
  metronomeSound: MetronomeSound;
  volumeMaster: number;
  volumePlayback: number;
  volumeMetronome: number;
  autoScrollSheet: boolean;
  loopPracticeSections: boolean;
  handsSeparateMode: boolean;
  followPlaybackCursor: boolean;
  noteNaming: NoteNaming;
  fingerNumbersOn: boolean;
  highlightedNotesOn: boolean;
  darkSheet: boolean;
  /** Positive = play earlier (hear sooner); scoring listens use this hint */
  latencyOffsetMs: number;
};

export const defaultInstrumentSettings: InstrumentSettings = {
  midiInputId: null,
  midiOutputId: null,
  midiInputLabel: null,
  midiOutputLabel: null,
  keyboardKeys: 88,
  velocityCurve: "normal",
  metronomeDefaultBpm: 92,
  metronomeCountIn: true,
  metronomeAccentBeat: true,
  metronomeSound: "classic",
  volumeMaster: 85,
  volumePlayback: 80,
  volumeMetronome: 70,
  autoScrollSheet: true,
  loopPracticeSections: false,
  handsSeparateMode: false,
  followPlaybackCursor: true,
  noteNaming: "cde",
  fingerNumbersOn: true,
  highlightedNotesOn: true,
  darkSheet: false,
  latencyOffsetMs: 0,
};

export function loadInstrumentSettings(): InstrumentSettings {
  if (typeof window === "undefined") return defaultInstrumentSettings;
  try {
    const raw = localStorage.getItem(INSTRUMENT_SETTINGS_KEY);
    if (!raw) return defaultInstrumentSettings;
    const parsed = JSON.parse(raw) as Partial<InstrumentSettings>;
    return { ...defaultInstrumentSettings, ...parsed };
  } catch {
    return defaultInstrumentSettings;
  }
}

export function saveInstrumentSettings(s: InstrumentSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INSTRUMENT_SETTINGS_KEY, JSON.stringify(s));
}
