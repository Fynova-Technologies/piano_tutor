"use client";

import { motion } from "motion/react";
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { MidiDeviceOption } from "@/hooks/useWebMidi";

type MIDISelectorProps = {
  label: string;
  devices: MidiDeviceOption[];
  value: string | null;
  savedLabel: string | null;
  onChange: (id: string | null, label: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function deviceLabel(d: MidiDeviceOption): string {
  const mfg = d.manufacturer ? ` · ${d.manufacturer}` : "";
  return `${d.name}${mfg}`;
}

export function MIDISelector({
  label,
  devices,
  value,
  savedLabel,
  onChange,
  disabled,
  placeholder = "No device selected",
}: MIDISelectorProps) {
  const selected = devices.find((d) => d.id === value);
  const displayName =
    selected?.name ?? (value && savedLabel ? `${savedLabel} (offline)` : null);

  return (
    <motion.div layout className="flex flex-col gap-2">
      <label className="text-[15px] font-medium text-[#1C1C1E]">{label}</label>
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => {
          const id = e.target.value || null;
          const dev = devices.find((d) => d.id === id);
          onChange(id, dev ? dev.name : null);
        }}
        className="w-full rounded-xl border border-[#ECECEC] bg-[#FAFAFA] px-4 py-3 text-[15px] text-[#1C1C1E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:opacity-50"
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {deviceLabel(d)}
            {d.state === "disconnected" ? " (disconnected)" : ""}
          </option>
        ))}
        {value && !selected && savedLabel && (
          <option value={value}>{savedLabel} (saved, not connected)</option>
        )}
      </select>
      {displayName && (
        <p className="text-[13px] text-[#6E6E73]">
          Active: <span className="text-[#581845] font-medium">{displayName}</span>
        </p>
      )}
    </motion.div>
  );
}

type MidiConnectionStatusProps = {
  supported: boolean;
  loading: boolean;
  hasDevice: boolean;
  inputLabel: string | null;
  onRefresh: () => void;
  refreshing?: boolean;
};

export function MidiConnectionPanel({
  supported,
  loading,
  hasDevice,
  inputLabel,
  onRefresh,
  refreshing,
}: MidiConnectionStatusProps) {
  if (!supported) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden />
        <motion.div>
          <p className="text-[14px] font-medium text-amber-900">Web MIDI not supported</p>
          <p className="text-[13px] text-amber-800/90 mt-0.5">
            Use Chrome, Edge, or Opera on desktop for MIDI keyboard support.
          </p>
        </motion.div>
      </div>
    );
  }

  const connected = hasDevice && !!inputLabel;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#ECECEC] bg-gradient-to-r from-[#FAFAFA] to-[#FEFEFE] px-4 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            connected
              ? "bg-[#2E7D32]/10 text-[#2E7D32]"
              : "bg-[#6E6E73]/10 text-[#6E6E73]"
          }`}
        >
          {connected ? (
            <Wifi className="h-5 w-5" aria-hidden />
          ) : (
            <WifiOff className="h-5 w-5" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#1C1C1E]">
            {loading
              ? "Scanning devices…"
              : connected
                ? "Keyboard connected"
                : "No keyboard detected"}
          </p>
          <p className="text-[13px] text-[#6E6E73] truncate">
            {connected
              ? inputLabel
              : "Plug in a USB or Bluetooth MIDI keyboard, then refresh."}
          </p>
        </div>
        <span
          className={`ml-auto sm:ml-0 shrink-0 inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-[#2E7D32] animate-pulse" : "bg-[#C7C7CC]"
          }`}
          aria-hidden
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading || refreshing}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECECEC] bg-white px-4 py-2.5 text-[14px] font-medium text-[#581845] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 shrink-0"
      >
        <RefreshCw
          className={`h-4 w-4 ${loading || refreshing ? "animate-spin" : ""}`}
          aria-hidden
        />
        Refresh devices
      </button>
    </div>
  );
}
