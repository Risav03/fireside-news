// Fireside News — Broadcast UI (static prototype)
// Serve from the Next dev server (same origin as /api/*). Open via apps/web after `bun dev`.
//
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const STORAGE_KEY = "fireside-broadcast-settings";
const LEGACY_DEFAULT_NETWORK_COLOR = "#c81e1e";

const CATEGORY_META = {
  news: { label: "TOP STORY", tone: "live", chyron: "DEVELOPING NOW" },
  crypto: { label: "CRYPTO DESK", tone: "crypto", chyron: "MARKETS LIVE" },
  stocks: { label: "MARKETS", tone: "stocks", chyron: "WALL STREET LIVE" },
  station: { label: "BULLETIN", tone: "live", chyron: "TOP OF THE HOUR" },
};

const DEFAULT_SETTINGS = {
  networkColor: "#eb6b34",
  anchorMode: "anchor",
  tickerSpeed: 80,
  crawlSpeed: 45,
  breakingMode: "auto",
  skin: "primetime",
};

function normalizeNetworkColor(value) {
  if (typeof value !== "string") return DEFAULT_SETTINGS.networkColor;
  return value.toLowerCase() === LEGACY_DEFAULT_NETWORK_COLOR ? DEFAULT_SETTINGS.networkColor : value;
}

function readSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, networkColor: normalizeNetworkColor(parsed.networkColor) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettingsPatch(patch) {
  const next = { ...readSettings(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useNowPlayingPayload() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  const fetchOnce = useCallback(async () => {
    try {
      const r = await fetch(`/api/now-playing?ts=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`now-playing ${r.status}`);
      const data = await r.json();
      setPayload(data);
      setError(null);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "now-playing failed");
      return null;
    }
  }, []);

  useEffect(() => {
    void fetchOnce();
    const id = setInterval(() => void fetchOnce(), 5000);
    return () => clearInterval(id);
  }, [fetchOnce]);

  return { payload, error, refresh: fetchOnce };
}

function useHeadlines() {
  const [headlines, setHeadlines] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`/api/headlines?ts=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`headlines ${r.status}`);
        const data = await r.json();
        if (!cancelled) {
          setHeadlines(data.headlines ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setHeadlines([]);
          setError(e instanceof Error ? e.message : "headlines failed");
        }
      }
    }
    void load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { headlines, error };
}

function useMarkets() {
  const [state, setState] = useState({ available: false, items: [], message: "Markets feed offline" });
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`/api/markets?ts=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`markets ${r.status}`);
        const data = await r.json();
        if (!cancelled) {
          setState({
            available: Boolean(data.available && data.items?.length),
            items: data.items ?? [],
            message: data.message || "Markets feed offline",
          });
        }
      } catch {
        if (!cancelled) {
          setState({ available: false, items: [], message: "Markets feed offline" });
        }
      }
    }
    void load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return state;
}

function NetworkBug({ live, blocked, onUnmute }) {
  return (
    <div className="netbug">
      <div className="netbug__mark">
        <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
          <path d="M16 3c2 5 7 6 7 12a7 7 0 1 1-14 0c0-3 2-5 4-7-1 4 1 6 3 6 0-4-2-6 0-11z" fill="url(#flameProto)" />
          <defs>
            <linearGradient id="flameProto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFD86B" />
              <stop offset="0.5" stopColor="#FF7A1A" />
              <stop offset="1" stopColor="#eb6b34" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="netbug__text">
        <div className="netbug__name">FIRESIDE</div>
        <div className="netbug__sub">NEWS NETWORK</div>
      </div>
      <div style={{ marginLeft: "auto" }}>
        {blocked ? (
          <button type="button" className="netbug__live" style={{ cursor: "pointer", border: "none", font: "inherit" }} onClick={onUnmute}>
            TAP TO LISTEN
          </button>
        ) : live ? (
          <div className="netbug__live">
            <span className="dot" /> LIVE
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TopStrap({ now, settingsPanel }) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  return (
    <div className="strap">
      <div className="strap__left">
        <span className="strap__pill">LIVE</span>
        <span className="strap__chan">CH 24 — FIRESIDE NEWS</span>
      </div>
      <div className="strap__center">HEADLINES • UPDATED EVERY HOUR • STREAMING WORLDWIDE</div>
      <div className="strap__right">
        <span>{date}</span>
        <span className="strap__time">{time} ET</span>
        {settingsPanel}
      </div>
    </div>
  );
}

function Sparkline({ up = true }) {
  const pts = "0,30 8,28 16,22 24,26 32,18 40,20 48,12 56,14 64,8 72,11 80,4";
  return (
    <svg viewBox="0 0 80 36" width="100%" height="100%">
      <polyline points={pts} fill="none" stroke={up ? "#39E36B" : "#FF5757"} strokeWidth="1.6" />
      <polyline points={`${pts} 80,36 0,36`} fill={up ? "rgba(57,227,107,0.22)" : "rgba(255,87,87,0.22)"} stroke="none" />
    </svg>
  );
}

function AnchorScene({ category }) {
  return (
    <div className="anchor">
      <div className="anchor__desk" />
      <div className="anchor__monitor monitor--l">
        <div className="monitor__inner monitor__inner--chart">
          <Sparkline up />
        </div>
      </div>
      <div className="anchor__monitor monitor--r">
        <div className="monitor__inner monitor__inner--logo">
          <div className="logo-mark">FN</div>
        </div>
      </div>
      <div className="anchor__figure">
        <div className="anchor__head" />
        <div className="anchor__neck" />
        <div className="anchor__torso" />
      </div>
      <div className="anchor__plaque">
        <div className="anchor__plaque-name">FIRESIDE ANCHOR</div>
        <div className="anchor__plaque-role">AI NEWSROOM · {category.toUpperCase()} DESK</div>
      </div>
    </div>
  );
}

function WaveformScene() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, []);
  const bars = Array.from({ length: 64 }, (_, i) => {
    const v = (Math.sin(i * 0.4 + tick * 0.3) * 0.5 + 0.5) * 0.7 + (Math.sin(i * 0.13 + tick * 0.18) * 0.5 + 0.5) * 0.3;
    return Math.max(0.08, v);
  });
  return (
    <div className="wave">
      <div className="wave__label">AUDIO FEED · ON AIR</div>
      <div className="wave__bars">
        {bars.map((b, i) => (
          <span key={i} style={{ height: `${b * 100}%` }} />
        ))}
      </div>
      <div className="wave__caption">FIRESIDE NEWS — LIVE TIMELINE</div>
    </div>
  );
}

function MapScene({ category }) {
  return (
    <div className="map">
      <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="dotsProto" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="rgba(255,255,255,0.16)" />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#dotsProto)" />
        <path d="M120 130 Q160 90 220 100 T340 140 Q360 180 320 220 T200 250 Q140 240 110 200 Z" fill="rgba(255,200,90,0.18)" stroke="rgba(255,200,90,0.55)" strokeWidth="1.4" />
        <path d="M380 100 Q450 80 540 110 T680 160 Q700 220 650 260 T500 280 Q420 260 390 200 Z" fill="rgba(255,200,90,0.14)" stroke="rgba(255,200,90,0.5)" strokeWidth="1.4" />
      </svg>
      <div className="map__cap">GLOBAL · {category.toUpperCase()} DESK</div>
    </div>
  );
}

function StudioStage({ current, breaking, anchorMode, progressPct, now }) {
  const meta = CATEGORY_META[current.category] || CATEGORY_META.news;
  const hourEt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(now);
  const tagId = String(current.audioId).slice(-8).toUpperCase();
  return (
    <div className="stage">
      <div className={`feed feed--${anchorMode}`}>
        <div className="feed__bg" />
        <div className="feed__grid" />
        <div className="feed__vignette" />
        {anchorMode === "anchor" && <AnchorScene category={current.category} />}
        {anchorMode === "waveform" && <WaveformScene />}
        {anchorMode === "map" && <MapScene category={current.category} />}
        <div className="feed__topright">
          <div className="ostg">
            <span className="ostg__live">
              <span className="dot" /> LIVE
            </span>
            <span className="ostg__loc">FIRESIDE STUDIO · NYC</span>
          </div>
        </div>
        <div className="feed__topleft">
          <div className="hour-bug">
            <div className="hour-bug__num">{hourEt.padStart(2, "0")}:00</div>
            <div className="hour-bug__lbl">HOUR ET</div>
          </div>
        </div>
        {breaking && (
          <div className="breaking">
            <div className="breaking__flash">BREAKING</div>
            <div className="breaking__text">DEVELOPING STORY — FIRESIDE NEWSROOM</div>
          </div>
        )}
        <div className={`lower3 lower3--${meta.tone}`}>
          <div className="lower3__cat">
            <div className="lower3__cat-lbl">{meta.label}</div>
            <div className="lower3__cat-sub">{meta.chyron}</div>
          </div>
          <div className="lower3__main">
            <div className="lower3__title">{current.title}</div>
            <div className="lower3__byline">
              <span>FIRESIDE NEWS</span>
              <span className="dotsep">•</span>
              <span>{String(current.category).toUpperCase()} DESK</span>
              <span className="dotsep">•</span>
              <span>{current.durationSec}s SEGMENT</span>
              {current.sourceUrl ? (
                <>
                  <span className="dotsep">•</span>
                  <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                    SOURCE
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <div className="lower3__tag">
            <div className="lower3__tag-l">ID</div>
            <div className="lower3__tag-n">{tagId}</div>
          </div>
        </div>
        <div className="feed__progress" aria-hidden="true">
          <div style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function Rundown({ next, playbackOk }) {
  const etFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <aside className="rundown">
      <div className="rundown__head">
        <div className="rundown__title">RUNDOWN</div>
        <div className="rundown__sub">NEXT IN QUEUE</div>
      </div>
      <ol className="rundown__list">
        {next.map((s, i) => {
          const meta = CATEGORY_META[s.category] || CATEGORY_META.news;
          return (
            <li key={`${s.audioId}-${s.startedAt}-${i}`} className={`rundown__item rundown__item--${meta.tone}`}>
              <div className="rundown__num">{String(i + 1).padStart(2, "0")}</div>
              <div className="rundown__body">
                <div className="rundown__cat">{meta.label}</div>
                <div className="rundown__hl">{s.title}</div>
                <div className="rundown__meta">
                  <span>{etFmt.format(new Date(s.startedAt))} ET</span>
                  <span className="dotsep">•</span>
                  <span>{s.durationSec}s</span>
                  <span className="dotsep">•</span>
                  <span>{String(s.category).toUpperCase()}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="rundown__foot">
        <div className="rundown__foot-l">
          <span className={`dot ${playbackOk ? "dot--green" : ""}`} />
          <span>{playbackOk ? "FEED HEALTHY" : "SYNCING…"}</span>
        </div>
        <div className="rundown__foot-r">TIMELINE LIVE</div>
      </div>
    </aside>
  );
}

function Ticker({ headlines, headlineError }) {
  const items =
    headlines.length === 0
      ? [headlineError ? `HEADLINE FEED ERROR — ${headlineError}` : "Awaiting headlines from ingestion…"]
      : headlines.map((h) => `${String(h.category).toUpperCase()}: ${h.headline}`);
  const track = [...items, ...items];
  const speed = Math.max(40, 20 + items.length * 6);
  return (
    <div className="ticker">
      <div className="ticker__brand">
        <div className="ticker__brand-l">FIRESIDE</div>
        <div className="ticker__brand-s">HEADLINES</div>
      </div>
      <div className="ticker__rail">
        <div className="ticker__track" style={{ animationDuration: `${speed}s` }}>
          {track.map((text, i) => (
            <span className="ticker__item" key={`${i}-${text.slice(0, 32)}`}>
              <span className="ticker__star">◆</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketsCrawl({ available, items, message, speed }) {
  const displayItems =
    available && items.length ? items : [{ sym: "—", val: "", chg: message || "Markets feed offline", pct: "", up: true }];
  const track = [...displayItems, ...displayItems];
  const mutedCls = !(available && items.length);
  return (
    <div className="crawl">
      <div className="crawl__brand">MARKETS</div>
      <div className="crawl__rail">
        <div
          className={`crawl__track ${mutedCls ? "crawl__track--muted" : ""}`}
          style={{ animationDuration: `${speed}s` }}
        >
          {track.map((m, i) => (
            <span className="crawl__item" key={`${m.sym}-${i}`}>
              <span className="crawl__sym">{m.sym}</span>
              {m.val ? <span className="crawl__val">{m.val}</span> : null}
              <span className={`crawl__chg ${!mutedCls && m.sym !== "—" ? (m.up ? "up" : "dn") : ""}`}>
                {!mutedCls && m.sym !== "—" ? (
                  <>
                    {m.up ? "▲" : "▼"} {m.chg} {m.pct ? `(${m.pct})` : ""}
                  </>
                ) : (
                  m.chg
                )}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="crawl__pill">
        <span className="dot" /> LIVE
      </div>
    </div>
  );
}

function SettingsPanel({ tweaks, setTweak }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", marginLeft: "8px" }}>
      <button type="button" className="broadcast-settings__toggle" onClick={() => setOpen(!open)}>
        ⚙
      </button>
      {open ? (
        <div className="broadcast-settings__panel">
          <div className="broadcast-settings__row">
            <label>Skin</label>
            <select value={tweaks.skin} onChange={(e) => setTweak("skin", e.target.value)}>
              <option value="primetime">Primetime</option>
              <option value="morning">Morning</option>
              <option value="wire">Wire</option>
            </select>
          </div>
          <div className="broadcast-settings__row">
            <label>Brand</label>
            <input type="color" value={tweaks.networkColor} onChange={(e) => setTweak("networkColor", e.target.value)} />
          </div>
          <div className="broadcast-settings__row">
            <label>Studio</label>
            <select value={tweaks.anchorMode} onChange={(e) => setTweak("anchorMode", e.target.value)}>
              <option value="anchor">Anchor</option>
              <option value="waveform">Waveform</option>
              <option value="map">Map</option>
            </select>
          </div>
          <div className="broadcast-settings__row">
            <label>Breaking</label>
            <select value={tweaks.breakingMode} onChange={(e) => setTweak("breakingMode", e.target.value)}>
              <option value="auto">Auto (≥8)</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const FALLBACK_CURRENT = {
  audioId: "pending",
  durationSec: 1,
  offsetSec: 0,
  remainingSec: 1,
  startedAt: Date.now(),
  type: "stinger",
  title: "Waiting for timeline… open this page from Next dev (`bun dev` in apps/web) so `/api/*` resolves.",
  category: "station",
  url: "",
  sourceUrl: null,
  priority: 0,
  publishedAt: null,
};

function App() {
  const now = useClock();
  const [tweaks, setTweaksState] = useState(readSettings);

  const setTweak = (key, val) => {
    setTweaksState(writeSettingsPatch({ [key]: val }));
  };

  useEffect(() => {
    document.body.dataset.skin = tweaks.skin;
  }, [tweaks.skin]);

  useEffect(() => {
    document.documentElement.style.setProperty("--brand", tweaks.networkColor);
  }, [tweaks.networkColor]);

  const { payload, error: npError, refresh } = useNowPlayingPayload();
  const { headlines, error: headlineError } = useHeadlines();
  const markets = useMarkets();
  const audioRef = useRef(null);
  const [playStatus, setPlayStatus] = useState("idle");

  const current = payload?.currentAudio ?? FALLBACK_CURRENT;
  const next = payload?.nextAudio ?? [];

  const breaking = useMemo(() => {
    const p = current.priority ?? 0;
    if (tweaks.breakingMode === "off") return false;
    if (tweaks.breakingMode === "on") return true;
    return p >= 8;
  }, [current.priority, tweaks.breakingMode]);

  const progressPct = payload ? Math.min(100, Math.round((current.offsetSec / current.durationSec) * 100)) : 0;

  const syncAudioWithPayload = async (data, manual) => {
    if (!data?.currentAudio?.url) return;
    const a = audioRef.current;
    if (!a) return;
    const cur = data.currentAudio;
    try {
      if (a.dataset.audioId === cur.audioId && !a.paused && !manual) {
        const drift = Math.abs(a.currentTime - cur.offsetSec);
        if (drift > 1.5) a.currentTime = cur.offsetSec;
        return;
      }
      a.src = cur.url;
      a.dataset.audioId = cur.audioId;
      a.currentTime = cur.offsetSec;
      await a.play();
      setPlayStatus("playing");
    } catch {
      setPlayStatus("blocked");
    }
  };

  const syncAudio = (manual) => syncAudioWithPayload(payload, manual);

  useEffect(() => {
    if (payload) void syncAudio(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload?.currentAudio?.audioId, payload?.serverTime]);

  useEffect(() => {
    if (!payload?.currentAudio?.remainingSec) return;
    const timer = window.setTimeout(
      () => void refresh(),
      Math.max(1000, (payload.currentAudio.remainingSec - 1) * 1000),
    );
    return () => clearTimeout(timer);
  }, [payload?.currentAudio?.remainingSec, payload?.currentAudio?.audioId, refresh]);

  const playbackOk = playStatus === "playing";

  const settingsPanelEl = (
    <>
      <SettingsPanel tweaks={tweaks} setTweak={(k, v) => setTweak(k, v)} />
      <style>{`
        .broadcast-settings__toggle{appearance:none;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.35);color:#f5f5f5;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:14px}
        .broadcast-settings__panel{position:absolute;top:100%;right:0;margin-top:8px;min-width:220px;padding:12px;background:rgba(12,14,20,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:4px;z-index:50}
        .broadcast-settings__row{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;align-items:center;font-size:11px;color:#9aa3b2}
      `}</style>
    </>
  );

  return (
    <div className="broadcast" data-screen-label="01 Broadcast Proto">
      <TopStrap now={now} settingsPanel={settingsPanelEl} />

      {(npError || headlineError) && (
        <div className={`broadcast-status ${npError ? "broadcast-status--error" : ""}`}>
          {[npError, headlineError].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="main">
        <div className="main__left">
          <NetworkBug
            live={playbackOk}
            blocked={playStatus === "blocked"}
            onUnmute={async () => {
              const data = await refresh();
              await syncAudioWithPayload(data ?? payload, true);
            }}
          />
          <StudioStage
            current={current}
            breaking={breaking}
            anchorMode={tweaks.anchorMode}
            progressPct={progressPct}
            now={now}
          />
        </div>
        <Rundown next={next} playbackOk={playbackOk} />
      </div>

      <Ticker headlines={headlines} headlineError={headlineError} />
      <MarketsCrawl available={markets.available} items={markets.items} message={markets.message} speed={tweaks.crawlSpeed} />

      <audio ref={audioRef} />
      <audio src="/api/fallback-audio?kind=bed" loop preload="auto" hidden aria-hidden />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
