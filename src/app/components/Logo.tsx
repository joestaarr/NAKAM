export function NakamLogo({ size = 64, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={glow ? { filter: "drop-shadow(0 0 18px rgba(255,107,26,0.6))" } : undefined}>
      <defs>
        <linearGradient id="nakamG" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF6B1A" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#nakamG)" />
      {/* stylized N + map pin combo */}
      <path
        d="M18 46 L18 22 L24 22 L40 38 L40 22 L46 22 L46 46 L40 46 L24 30 L24 46 Z"
        fill="white"
      />
      <circle cx="46" cy="22" r="4" fill="white" />
      <circle cx="46" cy="22" r="1.8" fill="url(#nakamG)" />
    </svg>
  );
}

export function NakamWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <NakamLogo size={36} />
      <span className="text-3xl tracking-tight" style={{ fontWeight: 800 }}>
        Nakam
      </span>
    </div>
  );
}
