"use client";

import { useEffect, useRef, useState } from "react";
import type { BroadcastSettings, BroadcastSkin } from "../use-broadcast-settings";

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
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="cursor-pointer appearance-none rounded border border-white/15 bg-black/35 px-2.5 py-1.5 text-sm leading-none text-[var(--ink)]"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⚙
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 min-w-60 rounded border border-[var(--line)] bg-[rgba(12,14,20,0.95)] px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <div className="mb-2.5 flex items-center justify-between gap-2.5 text-[11px] tracking-[0.12em] text-[var(--mute)]">
            <label className="font-bold" htmlFor="skin">
              Skin
            </label>
            <select
              className="max-w-[140px]"
              id="skin"
              value={settings.skin}
              onChange={(e) => onChange({ skin: e.target.value as BroadcastSkin })}
            >
              <option value="primetime">Primetime</option>
              <option value="morning">Morning</option>
              <option value="wire">Wire</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-2.5 text-[11px] tracking-[0.12em] text-[var(--mute)]">
            <label className="font-bold" htmlFor="brand">
              Brand color
            </label>
            <input
              className="max-w-[140px]"
              id="brand"
              type="color"
              value={settings.networkColor}
              onChange={(e) => onChange({ networkColor: e.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
