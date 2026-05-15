"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MidiDeviceOption = {
  id: string;
  name: string;
  manufacturer: string;
  state: "connected" | "disconnected";
};

function mapInputs(access: WebMidi.MIDIAccess): MidiDeviceOption[] {
  return Array.from(access.inputs.values()).map((input) => ({
    id: input.id,
    name: input.name || "Unnamed input",
    manufacturer: input.manufacturer || "",
    state: input.state as "connected" | "disconnected",
  }));
}

function mapOutputs(access: WebMidi.MIDIAccess): MidiDeviceOption[] {
  return Array.from(access.outputs.values()).map((output) => ({
    id: output.id,
    name: output.name || "Unnamed output",
    manufacturer: output.manufacturer || "",
    state: output.state as "connected" | "disconnected",
  }));
}

export function useWebMidi() {
  const accessRef = useRef<WebMidi.MIDIAccess | null>(null);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState<MidiDeviceOption[]>([]);
  const [outputs, setOutputs] = useState<MidiDeviceOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const applyAccess = useCallback((access: WebMidi.MIDIAccess) => {
    accessRef.current = access;
    setInputs(mapInputs(access));
    setOutputs(mapOutputs(access));
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      setSupported(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let access = accessRef.current;
      if (!access) {
        access = await navigator.requestMIDIAccess({ sysex: false });
        access.onstatechange = () => {
          if (accessRef.current) applyAccess(accessRef.current);
        };
      }
      applyAccess(access);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not access MIDI devices");
    } finally {
      setLoading(false);
    }
  }, [applyAccess]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasConnectedDevice =
    inputs.some((d) => d.state === "connected") ||
    outputs.some((d) => d.state === "connected");

  return {
    supported,
    loading,
    inputs,
    outputs,
    error,
    refresh,
    hasConnectedDevice,
  };
}
