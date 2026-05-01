"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NowPlayingResponse, TimelineSegment } from "@repo/core";

type PlaybackStatus = "idle" | "loading" | "playing" | "blocked" | "error";

export function RadioPlayer() {
  const primaryRef = useRef<HTMLAudioElement | null>(null);
  const secondaryRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<0 | 1>(0);
  const [payload, setPayload] = useState<NowPlayingResponse | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const activeSegmentId = payload?.currentAudio.audioId;

  const syncPlayback = useCallback(async (manualStart = false) => {
    try {
      setStatus((current) => (current === "playing" ? current : "loading"));
      const response = await fetch(`/api/now-playing?ts=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Now playing request failed: ${response.status}`);
      }

      const nextPayload = (await response.json()) as NowPlayingResponse;
      setPayload(nextPayload);
      setError(null);
      await playSegment(nextPayload, manualStart);
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Playback failed.");
    }
  }, []);

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

  async function playSegment(nextPayload: NowPlayingResponse, manualStart: boolean) {
    const audioElements = [primaryRef.current, secondaryRef.current] as const;
    const active = audioElements[activeRef.current];

    if (!active) {
      return;
    }

    if (!manualStart && active.dataset.audioId === nextPayload.currentAudio.audioId && !active.paused) {
      const drift = Math.abs(active.currentTime - nextPayload.currentAudio.offsetSec);

      if (drift > 1.5) {
        active.currentTime = nextPayload.currentAudio.offsetSec;
      }

      return;
    }

    const inactiveIndex = activeRef.current === 0 ? 1 : 0;
    const inactive = audioElements[inactiveIndex];

    if (!inactive) {
      return;
    }

    inactive.src = nextPayload.currentAudio.url;
    inactive.dataset.audioId = nextPayload.currentAudio.audioId;
    inactive.currentTime = nextPayload.currentAudio.offsetSec;
    inactive.volume = manualStart ? 1 : 0.92;

    try {
      await inactive.play();
      fadeOut(active);
      activeRef.current = inactiveIndex;
      setStatus("playing");

      if (musicRef.current) {
        musicRef.current.volume = 0.12;
        await musicRef.current.play().catch(() => undefined);
      }
    } catch {
      setStatus("blocked");
    }
  }

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

      <audio ref={primaryRef} crossOrigin="anonymous" />
      <audio ref={secondaryRef} crossOrigin="anonymous" />
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

function fadeOut(audio: HTMLAudioElement | null) {
  if (!audio || audio.paused) {
    return;
  }

  const start = audio.volume;
  const startedAt = performance.now();

  function tick(now: number) {
    if (!audio) {
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
