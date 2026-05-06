"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NowPlayingResponse } from "@repo/core";

export type PlaybackStatus = "idle" | "loading" | "playing" | "blocked" | "error";

type FadeVersions = WeakMap<HTMLAudioElement, number>;

function stopAudio(audio: HTMLAudioElement | null, fadeVersions: FadeVersions) {
  if (!audio) {
    return;
  }

  nextFadeVersion(audio, fadeVersions);
  audio.pause();

  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers reject seeking during media replacement.
  }

  audio.volume = 1;
}

function fadeOut(audio: HTMLAudioElement | null, fadeVersions: FadeVersions) {
  if (!audio || audio.paused) {
    return;
  }

  const fadeVersion = nextFadeVersion(audio, fadeVersions);
  const start = audio.volume;
  const startedAt = performance.now();

  function tick(now: number) {
    if (!audio || fadeVersions.get(audio) !== fadeVersion) {
      return;
    }

    const elapsed = now - startedAt;
    audio.volume = Math.max(0, start * (1 - elapsed / 350));

    if (elapsed < 350) {
      requestAnimationFrame(tick);
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  }

  requestAnimationFrame(tick);
}

function nextFadeVersion(audio: HTMLAudioElement, fadeVersions: FadeVersions) {
  const version = (fadeVersions.get(audio) ?? 0) + 1;
  fadeVersions.set(audio, version);
  return version;
}

/** Dual-buffer playback + polling (extracted from prior RadioPlayer). */
export function useRadioPlayback() {
  const primaryRef = useRef<HTMLAudioElement | null>(null);
  const secondaryRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<0 | 1>(0);
  const syncInFlightRef = useRef(false);
  const queuedSyncRef = useRef(false);
  const queuedManualStartRef = useRef(false);
  const syncVersionRef = useRef(0);
  const transitionVersionRef = useRef(0);
  const fadeVersionsRef = useRef(new WeakMap<HTMLAudioElement, number>());
  /** Waveform scene only — headline `<audio>` stays on native output (Web Audio MediaElementSource + suspended AudioContext caused silent playback). */
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [payload, setPayload] = useState<NowPlayingResponse | null>(null);
  /** Advances UI progress between `/api/now-playing` polls (offsetSec is server snapshot only). */
  const [progressClock, setProgressClock] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const activeSegmentId = payload?.currentAudio.audioId;

  const stopAllAudio = useCallback(() => {
    stopAudio(primaryRef.current, fadeVersionsRef.current);
    stopAudio(secondaryRef.current, fadeVersionsRef.current);
    stopAudio(musicRef.current, fadeVersionsRef.current);
  }, []);

  const playSegment = useCallback(
    async (nextPayload: NowPlayingResponse, manualStart: boolean, syncVersion: number) => {
      const transitionVersion = transitionVersionRef.current + 1;
      transitionVersionRef.current = transitionVersion;
      const audioElements = [primaryRef.current, secondaryRef.current] as const;
      const active = audioElements[activeRef.current];
      const inactiveIndex = activeRef.current === 0 ? 1 : 0;
      const inactive = audioElements[inactiveIndex];

      if (!active || !inactive) {
        return;
      }

      if (!manualStart && active.dataset.audioId === nextPayload.currentAudio.audioId && !active.paused) {
        stopAudio(inactive, fadeVersionsRef.current);
        const drift = Math.abs(active.currentTime - nextPayload.currentAudio.offsetSec);

        if (drift > 1.5) {
          active.currentTime = nextPayload.currentAudio.offsetSec;
        }

        return;
      }

      stopAudio(inactive, fadeVersionsRef.current);
      inactive.src = nextPayload.currentAudio.url;
      inactive.dataset.audioId = nextPayload.currentAudio.audioId;
      inactive.currentTime = nextPayload.currentAudio.offsetSec;
      inactive.volume = manualStart ? 1 : 0.92;

      try {
        await inactive.play();

        if (syncVersion !== syncVersionRef.current || transitionVersion !== transitionVersionRef.current) {
          stopAudio(inactive, fadeVersionsRef.current);
          return;
        }

        fadeOut(active, fadeVersionsRef.current);
        activeRef.current = inactiveIndex;
        setStatus("playing");

        if (musicRef.current) {
          musicRef.current.volume = 0.12;
          await musicRef.current.play().catch(() => undefined);
        }
      } catch {
        stopAllAudio();
        setStatus("blocked");
      }
    },
    [stopAllAudio],
  );

  const syncPlayback = useCallback(
    async (manualStart = false) => {
      if (syncInFlightRef.current) {
        queuedSyncRef.current = true;
        queuedManualStartRef.current ||= manualStart;
        return;
      }

      syncInFlightRef.current = true;
      let nextManualStart = manualStart;

      try {
        do {
          queuedSyncRef.current = false;
          const shouldManualStart = nextManualStart || queuedManualStartRef.current;
          queuedManualStartRef.current = false;
          nextManualStart = false;
          await runSync(shouldManualStart);
        } while (queuedSyncRef.current);
      } finally {
        syncInFlightRef.current = false;
      }

      async function runSync(shouldManualStart: boolean) {
        const syncVersion = syncVersionRef.current + 1;
        syncVersionRef.current = syncVersion;

        try {
          setStatus((current) => (current === "playing" ? current : "loading"));
          const response = await fetch(`/api/now-playing?ts=${Date.now()}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(`Now playing request failed: ${response.status}`);
          }

          const nextPayload = (await response.json()) as NowPlayingResponse;

          if (syncVersion !== syncVersionRef.current) {
            return;
          }

          setPayload(nextPayload);
          setError(null);
          await playSegment(nextPayload, shouldManualStart, syncVersion);
        } catch (cause) {
          if (syncVersion !== syncVersionRef.current) {
            return;
          }

          stopAllAudio();
          setStatus("error");
          setError(cause instanceof Error ? cause.message : "Playback failed.");
        }
      }
    },
    [playSegment, stopAllAudio],
  );

  useEffect(() => {
    void syncPlayback();
    const rafId = requestAnimationFrame(() => void syncPlayback());
    const interval = window.setInterval(() => void syncPlayback(), 5_000);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(interval);
    };
  }, [syncPlayback]);

  useEffect(() => {
    const id = window.setInterval(() => setProgressClock(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!payload?.nextAudio[0]) {
      return;
    }

    const preload = new Audio(payload.nextAudio[0].url);
    preload.preload = "auto";
  }, [payload?.nextAudio]);

  useEffect(() => {
    if (!payload?.currentAudio.remainingSec) {
      return;
    }

    const timer = window.setTimeout(
      () => void syncPlayback(),
      Math.max(1_000, (payload.currentAudio.remainingSec - 1) * 1_000),
    );

    return () => window.clearTimeout(timer);
  }, [payload?.currentAudio.remainingSec, activeSegmentId, syncPlayback]);

  const progress = useMemo(() => {
    if (!payload) {
      return 0;
    }

    const { offsetSec, durationSec } = payload.currentAudio;
    if (durationSec <= 0) {
      return 0;
    }

    const serverSkewMs = Date.now() - payload.serverTime;
    const elapsedSec = offsetSec + serverSkewMs / 1_000;
    const clamped = Math.max(0, Math.min(durationSec, elapsedSec));

    return Math.min(100, (clamped / durationSec) * 100);
  }, [payload, progressClock]);

  return {
    primaryRef,
    secondaryRef,
    musicRef,
    payload,
    status,
    error,
    progress,
    syncPlayback,
    analyserRef,
  };
}
