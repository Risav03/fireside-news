"use client";

import { useCallback, useEffect, useState } from "react";

export type BroadcastSkin = "primetime" | "morning" | "wire";
export type AnchorMode = "anchor" | "waveform" | "map";
export type BreakingMode = "auto" | "on" | "off";

export type BroadcastSettings = {
  networkColor: string;
  skin: BroadcastSkin;
  anchorMode: AnchorMode;
  breakingMode: BreakingMode;
};

const STORAGE_KEY = "fireside-broadcast-settings";

const DEFAULTS: BroadcastSettings = {
  networkColor: "#C81E1E",
  skin: "primetime",
  anchorMode: "anchor",
  breakingMode: "auto",
};

function readStored(): BroadcastSettings {
  if (typeof window === "undefined") {
    return DEFAULTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<BroadcastSettings>;
    return {
      networkColor: typeof parsed.networkColor === "string" ? parsed.networkColor : DEFAULTS.networkColor,
      skin: parsed.skin === "morning" || parsed.skin === "wire" || parsed.skin === "primetime" ? parsed.skin : DEFAULTS.skin,
      anchorMode:
        parsed.anchorMode === "waveform" || parsed.anchorMode === "map" || parsed.anchorMode === "anchor"
          ? parsed.anchorMode
          : DEFAULTS.anchorMode,
      breakingMode:
        parsed.breakingMode === "on" || parsed.breakingMode === "off" || parsed.breakingMode === "auto"
          ? parsed.breakingMode
          : DEFAULTS.breakingMode,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useBroadcastSettings() {
  const [settings, setSettings] = useState<BroadcastSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(readStored());
  }, []);

  const update = useCallback((patch: Partial<BroadcastSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota
      }
      return next;
    });
  }, []);

  return { settings, update };
}
