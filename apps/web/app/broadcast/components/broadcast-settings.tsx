"use client";

import { useEffect, useRef, useState } from "react";
import type { AnchorMode, BreakingMode, BroadcastSettings, BroadcastSkin } from "../use-broadcast-settings";

export function BroadcastSettingsPopover({
  settings,
  onChange,
}: {
  settings: BroadcastSettings;
  onChange: (patch: Partial<BroadcastSettings>) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="broadcast-settings" ref={wrapRef}>
      <button type="button" className="broadcast-settings__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ⚙
      </button>
      {open ? (
        <div className="broadcast-settings__panel">
          <div className="broadcast-settings__row">
            <label htmlFor="skin">Skin</label>
            <select
              id="skin"
              value={settings.skin}
              onChange={(e) => onChange({ skin: e.target.value as BroadcastSkin })}
            >
              <option value="primetime">Primetime</option>
              <option value="morning">Morning</option>
              <option value="wire">Wire</option>
            </select>
          </div>
          <div className="broadcast-settings__row">
            <label htmlFor="brand">Brand color</label>
            <input
              id="brand"
              type="color"
              value={settings.networkColor}
              onChange={(e) => onChange({ networkColor: e.target.value })}
            />
          </div>
          <div className="broadcast-settings__row">
            <label htmlFor="mode">Studio mode</label>
            <select
              id="mode"
              value={settings.anchorMode}
              onChange={(e) => onChange({ anchorMode: e.target.value as AnchorMode })}
            >
              <option value="anchor">Anchor</option>
              <option value="waveform">Waveform</option>
              <option value="map">Map</option>
            </select>
          </div>
          <div className="broadcast-settings__row">
            <label htmlFor="break">Breaking bug</label>
            <select
              id="break"
              value={settings.breakingMode}
              onChange={(e) => onChange({ breakingMode: e.target.value as BreakingMode })}
            >
              <option value="auto">Auto (priority ≥ 8)</option>
              <option value="on">Force on</option>
              <option value="off">Force off</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}
