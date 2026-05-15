import type { Metadata } from "next";
import { InstrumentSettingsPage } from "@/components/instrument-settings/InstrumentSettingsPage";

export const metadata: Metadata = {
  title: "Instrument Settings | Piano Tutor",
  description:
    "Configure MIDI devices, keyboard range, metronome, audio levels, and practice visuals.",
};

export default function InstrumentSettingsRoute() {
  return <InstrumentSettingsPage />;
}
