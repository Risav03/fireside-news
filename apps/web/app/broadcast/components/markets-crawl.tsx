"use client";

import type { MarketItem } from "../use-markets";

function ChainMark({ chain }: { chain: MarketItem["chain"] }) {
  if (chain === "solana") {
    return (
      <span className="w-5 aspect-square" title="Solana">
        <svg xmlns="http://www.w3.org/2000/svg" width="101" height="88" viewBox="0 0 101 88" fill="none" aria-hidden className="w-5 aspect-square">
          <path
            d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z"
            fill="url(#solana-chain-mark-gradient)"
          />
          <defs>
            <linearGradient id="solana-chain-mark-gradient" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse">
              <stop offset="0.08" stopColor="#9945FF" />
              <stop offset="0.3" stopColor="#8752F3" />
              <stop offset="0.5" stopColor="#5497D5" />
              <stop offset="0.6" stopColor="#43B4CA" />
              <stop offset="0.72" stopColor="#28E0B9" />
              <stop offset="0.97" stopColor="#19FB9B" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  return (
    <span className="w-5 aspect-square" title="Base">
      <svg width="249" height="249" viewBox="0 0 249 249" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="w-5 aspect-square">
        <path d="M0 19.671C0 12.9332 0 9.56425 1.26956 6.97276C2.48511 4.49151 4.49151 2.48511 6.97276 1.26956C9.56425 0 12.9332 0 19.671 0H229.329C236.067 0 239.436 0 242.027 1.26956C244.508 2.48511 246.515 4.49151 247.73 6.97276C249 9.56425 249 12.9332 249 19.671V229.329C249 236.067 249 239.436 247.73 242.027C246.515 244.508 244.508 246.515 242.027 247.73C239.436 249 236.067 249 229.329 249H19.671C12.9332 249 9.56425 249 6.97276 247.73C4.49151 246.515 2.48511 244.508 1.26956 242.027C0 239.436 0 236.067 0 229.329V19.671Z" fill="#0000FF" />
      </svg>
    </span>
  );
}

export function MarketsCrawl({
  available,
  items,
  message,
  onCycleComplete,
}: {
  available: boolean;
  items: MarketItem[];
  message: string;
  onCycleComplete?: () => void;
}) {
  const displayItems: MarketItem[] =
    available && items.length > 0
      ? items
      : [{ sym: "—", name: message, val: "", chg: message, pct: "", up: true, chain: "base", url: "#" }];

  const track = [...displayItems, ...displayItems];
  const speedSec = available ? Math.max(180, displayItems.length * 4.5) : 70;

  return (
    <div className="grid h-[38px] grid-cols-[auto_1fr_auto] overflow-hidden border-t border-[var(--line)] bg-[#050608] max-[640px]:h-9">
      <div className="relative grid place-items-center bg-[var(--gold)] px-[18px] font-[var(--display)] text-[17px] font-bold tracking-[0.16em] text-[#1a1208] after:absolute after:top-0 after:right-[-10px] after:bottom-0 after:z-[2] after:w-5 after:bg-[var(--gold)] after:[clip-path:polygon(0_0,50%_50%,0_100%)] after:content-[''] max-[640px]:px-3 max-[640px]:text-[13px] max-[640px]:tracking-[0.1em]">
        MARKETS
      </div>
      <div className="relative flex items-center overflow-hidden">
        <div
          className="flex animate-scroll-left items-center gap-9 whitespace-nowrap pl-[30px] font-[var(--mono)] text-[13px] font-semibold text-[var(--ink)] max-[640px]:gap-6 max-[640px]:pl-6 max-[640px]:text-[11px]"
          style={{ animationDuration: `${speedSec}s` }}
          onAnimationIteration={() => {
            if (available) {
              onCycleComplete?.();
            }
          }}
        >
          {track.map((m, i) => (
            <a
              className="inline-flex items-center gap-2.5 text-[var(--ink)] no-underline transition hover:text-white max-[640px]:gap-1.5"
              href={available && m.sym !== "—" ? m.url : undefined}
              key={`${m.sym}-${i}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={available && m.sym !== "—" ? undefined : true}
            >
              {available && m.sym !== "—" ? <ChainMark chain={m.chain} /> : null}
              {available && m.iconUrl ? (
                <img src={m.iconUrl} alt="" className="h-5 w-5 rounded-full bg-white/10 object-cover max-[640px]:h-4 max-[640px]:w-4" loading="lazy" />
              ) : null}
              <span className={`font-bold tracking-[0.04em] ${available ? "text-[var(--gold)]" : "text-[var(--mute)]"}`}>{m.sym}</span>
              {m.val ? <span className={available ? "text-[var(--ink)]" : "text-[var(--mute)]"}>{m.val}</span> : null}
              <span className={available && m.sym !== "—" ? (m.up ? "text-[var(--green)]" : "text-[var(--red)]") : "text-[var(--mute)]"}>
                {available && m.sym !== "—" ? (
                  <>
                    {m.up ? "▲" : "▼"} {m.chg} {m.pct ? `(${m.pct})` : ""}
                  </>
                ) : (
                  m.chg
                )}
              </span>
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-[var(--brand)] px-4 text-[11px] font-extrabold tracking-[0.22em] text-white max-[640px]:hidden">
        <span className="h-2 w-2 animate-blink rounded-full bg-white" /> LIVE
      </div>
    </div>
  );
}
