"use client";

export function Sparkline({ up = true }: { up?: boolean }) {
  const pts = "0,30 8,28 16,22 24,26 32,18 40,20 48,12 56,14 64,8 72,11 80,4";
  return (
    <svg viewBox="0 0 80 36" width="100%" height="100%">
      <polyline points={pts} fill="none" stroke={up ? "#39E36B" : "#FF5757"} strokeWidth="1.6" />
      <polyline
        points={`${pts} 80,36 0,36`}
        fill={up ? "rgba(57,227,107,0.22)" : "rgba(255,87,87,0.22)"}
        stroke="none"
      />
    </svg>
  );
}
