"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Piano,
  Keyboard,
  Gauge,
  Drum,
  Volume2,
  Play,
  Eye,
  Timer,
  ChevronLeft,
} from "lucide-react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SliderSetting } from "@/components/settings/SliderSetting";
import { ToggleRow } from "@/components/settings/ToggleRow";
import { SegmentedSelector } from "@/components/settings/SegmentedSelector";
import {
  MIDISelector,
  MidiConnectionPanel,
} from "@/components/settings/MIDISelector";
import { KeyboardRangePreview } from "@/components/instrument-settings/KeyboardRangePreview";
import { LatencyCalibrationDialog } from "@/components/instrument-settings/LatencyCalibrationDialog";
import { useInstrumentSettingsPersisted } from "@/hooks/settings/useUserSettings";
import { useWebMidi } from "@/hooks/useWebMidi";
import type {
  KeyboardRange,
  MetronomeSound,
  NoteNaming,
  VelocityCurve,
} from "@/lib/userSettings/instrumentSettings";

function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 rounded-xl bg-[#ECECEC]/60"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function InstrumentSettingsPage() {
  const { value, update, ready, syncStatus } = useInstrumentSettingsPersisted();
  const midi = useWebMidi();
  const [refreshing, setRefreshing] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const patch = useCallback(
    (partial: Parameters<typeof update>[0]) => update(partial),
    [update],
  );

  const handleRefreshMidi = useCallback(async () => {
    setRefreshing(true);
    await midi.refresh();
    setRefreshing(false);
  }, [midi]);

  const connectedInputLabel =
    midi.inputs.find((d) => d.id === value.midiInputId)?.name ??
    value.midiInputLabel;

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-8 sm:px-8 sm:py-12 lg:px-16">
      <motion.div
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SettingsHeader
          title="Instrument Settings"
          subtitle="Customize your piano, MIDI devices, playback, metronome, and visual behavior. Changes save automatically."
          syncStatus={syncStatus}
          backLink={
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#581845] hover:text-[#4F163E] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back to lessons
            </Link>
          }
        />

        {!ready ? (
          <SettingsSkeleton />
        ) : (
          <div className="flex flex-col gap-5">
            {/* SECTION 1 — MIDI */}
            <SettingsSection
              id="midi"
              index={0}
              icon={Piano}
              title="MIDI device setup"
              description="Connect your keyboard via USB or Bluetooth. Select input and output for lessons and practice."
            >
              <MidiConnectionPanel
                supported={midi.supported}
                loading={midi.loading}
                hasDevice={midi.hasConnectedDevice}
                inputLabel={connectedInputLabel}
                onRefresh={handleRefreshMidi}
                refreshing={refreshing}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <MIDISelector
                  label="MIDI input"
                  devices={midi.inputs}
                  value={value.midiInputId}
                  savedLabel={value.midiInputLabel}
                  disabled={!midi.supported || midi.loading}
                  onChange={(id, label) =>
                    patch({ midiInputId: id, midiInputLabel: label })
                  }
                />
                <MIDISelector
                  label="MIDI output"
                  devices={midi.outputs}
                  value={value.midiOutputId}
                  savedLabel={value.midiOutputLabel}
                  disabled={!midi.supported || midi.loading}
                  onChange={(id, label) =>
                    patch({ midiOutputId: id, midiOutputLabel: label })
                  }
                />
              </div>
            </SettingsSection>

            {/* SECTION 2 — Keyboard range */}
            <SettingsSection
              id="keyboard-range"
              index={1}
              icon={Keyboard}
              title="Keyboard range"
              description="Match the on-screen keyboard to your physical instrument."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([61, 76, 88] as KeyboardRange[]).map((k) => (
                  <KeyboardRangePreview
                    key={k}
                    keys={k}
                    selected={value.keyboardKeys === k}
                    onSelect={() => patch({ keyboardKeys: k })}
                  />
                ))}
              </div>
            </SettingsSection>

            {/* SECTION 3 — Velocity */}
            <SettingsSection
              id="velocity"
              index={2}
              icon={Gauge}
              title="Velocity sensitivity"
              description="How strongly your playing dynamics are interpreted during scoring."
            >
              <SegmentedSelector<VelocityCurve>
                layoutId="velocity-curve"
                value={value.velocityCurve}
                onChange={(velocityCurve) => patch({ velocityCurve })}
                options={[
                  { value: "soft", label: "Soft" },
                  { value: "normal", label: "Normal" },
                  { value: "hard", label: "Hard" },
                ]}
              />
            </SettingsSection>

            {/* SECTION 4 — Metronome */}
            <SettingsSection
              id="metronome"
              index={3}
              icon={Drum}
              title="Metronome settings"
              description="Default tempo and count-in behavior for practice sessions."
            >
              <SliderSetting
                label="Default BPM"
                value={value.metronomeDefaultBpm}
                min={40}
                max={208}
                step={1}
                unit=""
                onChange={(metronomeDefaultBpm) => patch({ metronomeDefaultBpm })}
              />
              <div className="grid gap-1 sm:grid-cols-2">
                <ToggleRow
                  label="Count-in before start"
                  description="One measure click before playback begins"
                  checked={value.metronomeCountIn}
                  onChange={(metronomeCountIn) => patch({ metronomeCountIn })}
                />
                <ToggleRow
                  label="Accent first beat"
                  description="Emphasize downbeat in the click pattern"
                  checked={value.metronomeAccentBeat}
                  onChange={(metronomeAccentBeat) => patch({ metronomeAccentBeat })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[15px] font-medium text-[#1C1C1E]">
                  Metronome sound
                </label>
                <select
                  value={value.metronomeSound}
                  onChange={(e) =>
                    patch({ metronomeSound: e.target.value as MetronomeSound })
                  }
                  className="w-full rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-4 py-3 text-[15px] text-[#1C1C1E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                >
                  <option value="classic">Classic click</option>
                  <option value="wood">Wood block</option>
                  <option value="beep">Digital beep</option>
                </select>
              </div>
            </SettingsSection>

            {/* SECTION 5 — Audio */}
            <SettingsSection
              id="audio"
              index={4}
              icon={Volume2}
              title="Audio settings"
              description="Balance master, lesson playback, and metronome levels."
            >
              <SliderSetting
                label="Master volume"
                value={value.volumeMaster}
                min={0}
                max={100}
                onChange={(volumeMaster) => patch({ volumeMaster })}
              />
              <SliderSetting
                label="Playback volume"
                description="Lesson and demo audio"
                value={value.volumePlayback}
                min={0}
                max={100}
                onChange={(volumePlayback) => patch({ volumePlayback })}
              />
              <SliderSetting
                label="Metronome volume"
                value={value.volumeMetronome}
                min={0}
                max={100}
                onChange={(volumeMetronome) => patch({ volumeMetronome })}
              />
            </SettingsSection>

            {/* SECTION 6 — Playback */}
            <SettingsSection
              id="playback"
              index={5}
              icon={Play}
              title="Playback options"
              description="Control how sheet music and practice modes behave during lessons."
            >
              <ToggleRow
                label="Auto-scroll sheet music"
                checked={value.autoScrollSheet}
                onChange={(autoScrollSheet) => patch({ autoScrollSheet })}
              />
              <ToggleRow
                label="Loop practice sections"
                checked={value.loopPracticeSections}
                onChange={(loopPracticeSections) => patch({ loopPracticeSections })}
              />
              <ToggleRow
                label="Hands separate mode"
                description="Practice left or right hand independently"
                checked={value.handsSeparateMode}
                onChange={(handsSeparateMode) => patch({ handsSeparateMode })}
              />
              <ToggleRow
                label="Follow playback cursor"
                checked={value.followPlaybackCursor}
                onChange={(followPlaybackCursor) => patch({ followPlaybackCursor })}
              />
            </SettingsSection>

            {/* SECTION 7 — Visual */}
            <SettingsSection
              id="visual"
              index={6}
              icon={Eye}
              title="Visual settings"
              description="Note labels, fingerings, and sheet appearance."
            >
              <div className="flex flex-col gap-2">
                <p className="text-[15px] font-medium text-[#1C1C1E]">Note naming</p>
                <SegmentedSelector<NoteNaming>
                  layoutId="note-naming"
                  value={value.noteNaming}
                  onChange={(noteNaming) => patch({ noteNaming })}
                  options={[
                    { value: "cde", label: "C D E" },
                    { value: "solfege", label: "Do Re Mi" },
                  ]}
                />
              </div>
              <ToggleRow
                label="Show finger numbers"
                checked={value.fingerNumbersOn}
                onChange={(fingerNumbersOn) => patch({ fingerNumbersOn })}
              />
              <ToggleRow
                label="Highlight active notes"
                checked={value.highlightedNotesOn}
                onChange={(highlightedNotesOn) => patch({ highlightedNotesOn })}
              />
              <ToggleRow
                label="Dark mode sheet"
                description="Invert sheet colors for low-light practice"
                checked={value.darkSheet}
                onChange={(darkSheet) => patch({ darkSheet })}
              />
            </SettingsSection>

            {/* SECTION 8 — Latency */}
            <SettingsSection
              id="latency"
              index={7}
              icon={Timer}
              title="Latency calibration"
              description="Compensate for audio and MIDI delay so scoring stays in sync."
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#ECECEC] bg-gradient-to-br from-[#FAFAFA] to-[#F5F0EB] px-5 py-4">
                <div>
                  <p className="text-[14px] font-medium text-[#1C1C1E]">
                    Saved latency offset
                  </p>
                  <p className="text-2xl font-semibold text-[#581845] tabular-nums mt-1">
                    {value.latencyOffsetMs} ms
                  </p>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Positive values play your input slightly earlier in scoring.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCalOpen(true)}
                  className="shrink-0 rounded-xl bg-[#581845] px-5 py-3 text-[15px] font-medium text-white hover:bg-[#4F163E] transition-colors shadow-sm"
                >
                  Start calibration
                </button>
              </div>
            </SettingsSection>
          </div>
        )}
      </motion.div>

      <LatencyCalibrationDialog
        open={calOpen}
        onClose={() => setCalOpen(false)}
        currentOffsetMs={value.latencyOffsetMs}
        onSave={(latencyOffsetMs) => patch({ latencyOffsetMs })}
      />
    </div>
  );
}
