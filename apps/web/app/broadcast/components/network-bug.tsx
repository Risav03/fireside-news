"use client";

export function NetworkBug({
  lastUpdatedAt,
  onRefreshPress,
}: {
  lastUpdatedAt: Date | null;
  onRefreshPress: () => void;
}) {
  const formatted =
    lastUpdatedAt === null
      ? "Waiting for headlines…"
      : new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(lastUpdatedAt);

  return (
    <div className="netbug">
      <div className="netbug__mark">
        <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
          <path
            d="M16 3c2 5 7 6 7 12a7 7 0 1 1-14 0c0-3 2-5 4-7-1 4 1 6 3 6 0-4-2-6 0-11z"
            fill="url(#flame)"
          />
          <defs>
            <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFD86B" />
              <stop offset="0.5" stopColor="#FF7A1A" />
              <stop offset="1" stopColor="#C81E1E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="netbug__text">
        <div className="netbug__name">FIRESIDE</div>
        <div className="netbug__sub">NEWS NETWORK</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="netbug__live" title="Headlines fetched from database">
          <span className="dot" />
          HEADLINES
        </div>
        <div className="muted" style={{ fontSize: "12px", textAlign: "right" }}>
          Updated {formatted}
        </div>
        <button
          type="button"
          className="netbug__live"
          style={{ cursor: "pointer", border: "none", font: "inherit", background: "transparent" }}
          onClick={() => onRefreshPress()}
        >
          FETCH NOW
        </button>
      </div>
    </div>
  );
}
