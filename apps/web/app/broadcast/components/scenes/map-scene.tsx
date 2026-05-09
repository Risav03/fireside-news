"use client";

export function MapScene({ category }: { category: string }) {
  return (
    <div className="absolute inset-0">
      <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="dots" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="rgba(255,255,255,0.16)" />
          </pattern>
        </defs>
        <rect width="800" height="400" fill="url(#dots)" />
        <path
          d="M120 130 Q160 90 220 100 T340 140 Q360 180 320 220 T200 250 Q140 240 110 200 Z"
          fill="rgba(255,200,90,0.18)"
          stroke="rgba(255,200,90,0.55)"
          strokeWidth="1.4"
        />
        <path
          d="M380 100 Q450 80 540 110 T680 160 Q700 220 650 260 T500 280 Q420 260 390 200 Z"
          fill="rgba(255,200,90,0.14)"
          stroke="rgba(255,200,90,0.5)"
          strokeWidth="1.4"
        />
        <path
          d="M520 290 Q570 280 620 300 T700 340 Q700 380 640 380 T540 360 Z"
          fill="rgba(255,200,90,0.14)"
          stroke="rgba(255,200,90,0.5)"
          strokeWidth="1.4"
        />
        {[
          { x: 250, y: 170 },
          { x: 500, y: 200 },
          { x: 600, y: 320 },
          { x: 180, y: 220 },
          { x: 420, y: 150 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="14" fill="none" stroke="#FF3B3B" strokeWidth="1.5">
              <animate attributeName="r" values="3;22;3" dur="2.4s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values="1;0;1"
                dur="2.4s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={p.x} cy={p.y} r="3.4" fill="#FF3B3B" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 font-[var(--display)] text-[26px] font-bold tracking-[0.2em] text-[var(--gold)] [text-shadow:0_0_18px_rgba(255,170,40,0.4)]">
        GLOBAL · {category.toUpperCase()} DESK
      </div>
    </div>
  );
}
