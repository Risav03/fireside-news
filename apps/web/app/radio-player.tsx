"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NowPlayingResponse, TimelineSegment } from "@repo/core";

type PlaybackStatus = "idle" | "loading" | "playing" | "blocked" | "error";

export function RadioPlayer() {
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
  const [payload, setPayload] = useState<NowPlayingResponse | null>(null);
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

  const syncPlayback = useCallback(async (manualStart = false) => {
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
  }, [playSegment, stopAllAudio]);

  useEffect(() => {
    void syncPlayback();
    const interval = window.setInterval(() => void syncPlayback(), 5_000);
    return () => window.clearInterval(interval);
  }, [syncPlayback]);

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

    return Math.min(100, Math.round((payload.currentAudio.offsetSec / payload.currentAudio.durationSec) * 100));
  }, [payload]);

  const current = payload?.currentAudio;

  return (
    <section className="player-shell">
      <div className="hero-card">
        <div className="eyebrow">AI News Radio</div>
        <h1>Fireside News Channel</h1>
        <p className="lede">
          A scheduled audio playback system that feels live: generated headlines, hourly bulletins, and a rolling
          server-driven timeline.
        </p>

        <div className="now-card">
          <div>
            <span className="label">Now Playing</span>
            <h2>{current?.title ?? "Preparing the live timeline"}</h2>
            <p>{current ? `${current.category.toUpperCase()} • ${current.durationSec}s segment` : "Waiting for the first segment."}</p>
            {current?.sourceUrl ? (
              <p className="muted source-line">
                <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Read original article
                </a>
              </p>
            ) : null}
          </div>
          <button onClick={() => void syncPlayback(true)}>{status === "playing" ? "Resync" : "Tap to listen"}</button>
        </div>

        <div className="progress-track" aria-label="Current segment progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <StatusLine status={status} error={error} />
      </div>

      <aside className="queue-card">
        <span className="label">Coming Up</span>
        <div className="queue-list">
          {(payload?.nextAudio ?? []).map((segment) => (
            <QueueItem key={`${segment.audioId}-${segment.startedAt}`} segment={segment} />
          ))}
          {payload?.nextAudio.length === 0 ? <p className="muted">Timeline is filling.</p> : null}
        </div>
      </aside>

      <audio ref={primaryRef} />
      <audio ref={secondaryRef} />
      <audio ref={musicRef} src="/api/fallback-audio?kind=bed" loop preload="auto" />
    </section>
  );
}

function QueueItem({ segment }: { segment: TimelineSegment }) {
  return (
    <article className="queue-item">
      <span>{new Date(segment.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      <strong>{segment.title}</strong>
      <small>
        {segment.category} • {segment.durationSec}s
        {segment.sourceUrl ? (
          <>
            {" "}
            •{" "}
            <a href={segment.sourceUrl} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          </>
        ) : null}
      </small>
    </article>
  );
}

function StatusLine({ status, error }: { status: PlaybackStatus; error: string | null }) {
  if (status === "blocked") {
    return <p className="status">Browser autoplay is blocked. Tap “Tap to listen” to start the station.</p>;
  }

  if (status === "error") {
    return <p className="status error">{error}</p>;
  }

  return <p className="status">Status: {status}</p>;
}

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
    // Some browsers can reject seeking while media metadata is being replaced.
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
