import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, User, MapPin, Dice5, Wallet, Eye, EyeOff, ChevronDown, Check, X,
  Navigation, Footprints, Bike, Car, Clock,
} from "lucide-react";
import { EateryDetail } from "./EateryDetail";
import { Navigator } from "./Navigator";
import { useStore, fmtRp } from "../store";
import { EATERIES_BY_CAMPUS } from "../data";
import confetti from "canvas-confetti";
import { NakamLogo } from "./Logo";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const FILTERS = ["⭐ Rating Tertinggi", "💸 Penyelamat Akhir Bulan", "🍚 Porsi Kuli", "🔌 Spot Nugas", "🅿️ Bebas Parkir"];
const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang", students: "30k+" },
  { code: "UB", name: "Universitas Brawijaya", students: "60k+" },
  { code: "UM", name: "Universitas Negeri Malang", students: "25k+" },
];

export function HomeMap({
  onOpenProfile, onOpenWallet,
}: {
  onOpenProfile: () => void;
  onOpenWallet: () => void;
}) {
  const [selected, setSelected] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusLoading, setCampusLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [routeTarget, setRouteTarget] = useState<any>(null);
  const [navTarget, setNavTarget] = useState<any>(null);
  const userPos = { x: 50, y: 86 };
  const { campus, setCampus, hideBalance, toggleHideBalance, budget, spent, merchant } = useStore();

  const merchantEatery = merchant.onboarded && merchant.campus === campus ? {
    id: "merchant-self",
    name: merchant.name,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
    walk: "kamu",
    dominance: 50,
    price: merchant.price,
    tags: ["Toko Kamu", merchant.status === "buka" ? "Buka" : merchant.status === "ramai" ? "Ramai" : "Tutup"],
    menu: merchant.menu.filter((m) => m.available).map((m) => ({ name: m.name, price: m.price, emoji: m.emoji })),
    gallery: ["https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800"],
    x: 50, y: 50, campus, filter: [],
    isMine: true,
    emoji: merchant.emoji,
  } : null;

  const baseList = [...(EATERIES_BY_CAMPUS[campus] || []), ...(merchantEatery ? [merchantEatery] : [])];
  
  let eateries = baseList.filter((e: any) => {
    if (!activeFilter) return true;
    if (activeFilter === "⭐ Rating Tertinggi") return true; // Keep all, just sort
    return (e.filter || []).includes(activeFilter);
  });

  if (activeFilter === "⭐ Rating Tertinggi") {
    eateries = eateries.sort((a: any, b: any) => b.dominance - a.dominance);
  }

  const triggerRandom = () => {
    setRolling(true);
    setShake(true);
    
    // Confetti effect
    const end = Date.now() + 1000;
    const colors = ['#FF6B1A', '#4285F4', '#10B981', '#F59E0B'];
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());

    setTimeout(() => setShake(false), 400);
    setTimeout(() => {
      setRolling(false);
      const list = EATERIES_BY_CAMPUS[campus];
      setSelected(list[Math.floor(Math.random() * list.length)]);
    }, 1100);
  };

  const switchCampus = (c: string) => {
    setCampusOpen(false);
    setCampusLoading(true);
    setTimeout(() => {
      setCampus(c);
      setCampusLoading(false);
    }, 900);
  };

  const remaining = budget - spent;
  const lowBalance = remaining / budget < 0.15;

  const distanceKm = (e: any) => {
    const dx = (e.x - userPos.x) * 0.012;
    const dy = (e.y - userPos.y) * 0.012;
    return Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
  };

  return (
    <motion.div
      animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative h-full w-full overflow-hidden bg-[#E8EEF4]"
    >
      {/* Map Layer */}
      <motion.div
        animate={{ filter: dragging ? "blur(2px)" : "blur(0px)" }}
        className="absolute inset-0"
        onPointerDown={() => setDragging(true)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <MapBackground />

        {/* Route overlay */}
        <AnimatePresence>
          {routeTarget && (
            <RouteLine key={routeTarget.id} from={userPos} to={{ x: routeTarget.x, y: routeTarget.y }} />
          )}
        </AnimatePresence>

        {/* User location */}
        <div style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 -m-4 animate-ping rounded-full bg-blue-500/30" />
          <span className="absolute inset-0 -m-2 rounded-full bg-blue-500/20" />
          <div className="relative h-5 w-5 rounded-full border-[3px] border-white bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
          <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-2 py-0.5 text-[9px] text-white shadow" style={{fontWeight:700}}>
            KAMU
          </div>
        </div>

        {/* Skeleton overlay during campus switch */}
        <AnimatePresence>
          {campusLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B1A] border-t-transparent" />
                <div className="text-xs text-gray-600" style={{fontWeight:600}}>Memuat area kampus...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {eateries.map((e: any) => (
            <motion.button
              key={e.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              transition={spring}
              onClick={() => setSelected(e)}
              style={{ left: `${e.x}%`, top: `${e.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              {e.isMine ? (
                <div className="relative">
                  <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-emerald-400/40" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl shadow-xl">
                    {e.emoji || merchantEatery?.name?.[0]}
                  </div>
                  <div className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] text-white shadow" style={{fontWeight:700}}>
                    TOKOMU
                  </div>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#1a1f4d] text-white shadow-xl">
                  <MapPin size={18} fill="white" />
                </div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Top Header */}
      <div className="absolute left-0 right-0 top-0 z-20 px-4 pt-12">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <NakamLogo size={32} />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCampusOpen(true)}
              className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1.5 shadow-md backdrop-blur-xl"
            >
              <span className="text-xs">📍</span>
              <span className="text-[11px]" style={{ fontWeight: 700 }}>{campus}</span>
              <ChevronDown size={11} />
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOpenWallet}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 shadow-md backdrop-blur-xl ${lowBalance ? "bg-red-50/90" : "bg-white/80"}`}
            >
              <Wallet size={12} className={lowBalance ? "text-red-500" : ""} />
              <span className="text-[10px]" style={{fontWeight:700}}>
                {hideBalance ? "••••" : "Rp " + (remaining / 1000).toFixed(0) + "k"}
              </span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleHideBalance} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-xl">
              {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenProfile} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-xl">
              <User size={15} />
            </motion.button>
          </div>
        </div>

        {/* Marquee recommendation */}
        <div className="mt-3 overflow-hidden rounded-full border border-white/60 bg-white/60 px-3 py-1.5 backdrop-blur-xl">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap text-[11px] text-gray-700"
          >
            🔥 Lagi rame: Warkop Mas Bro · 🎁 Promo Geprek Bensu 30% · 💸 Burjo Kuli buka 24 jam · 🌟 Cafe Nugas WiFi 100mbps
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay: 0.1 }}
          className="mt-3 flex items-center gap-2.5 rounded-2xl border border-white/50 bg-white/60 px-4 py-3 shadow-lg backdrop-blur-xl"
        >
          <Search size={18} className="text-gray-500" />
          <input placeholder="Cari warkop, ayam geprek, atau menu..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500" />
        </motion.div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <motion.button
                key={f} whileTap={{ scale: 0.95 }} layout transition={spring}
                onClick={() => setActiveFilter(active ? null : f)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs backdrop-blur-xl ${active ? "border-[#FF6B1A] bg-[#FF6B1A] text-white" : "border-white/60 bg-white/70 text-gray-800"}`}
                style={{ fontWeight: 600 }}
              >
                {f}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Low balance warning */}
      <AnimatePresence>
        {lowBalance && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={spring}
            className="absolute bottom-24 left-4 right-32 z-10 flex items-center gap-2 rounded-2xl bg-red-500 p-2.5 text-white shadow-lg"
          >
            <span className="text-xl">⚠️</span>
            <div className="flex-1 text-xs" style={{fontWeight:600}}>
              Awas dompet tipis! Cari promo di Cafe & Burjo terdekat.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={triggerRandom}
        animate={rolling ? { rotate: [0, 360, 720, 1080] } : { rotate: 0 }}
        transition={rolling ? { duration: 1 } : spring}
        style={{ boxShadow: "0 10px 40px rgba(255,107,26,0.5)" }}
        className="absolute bottom-8 right-5 z-20 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B1A] via-[#FF8C42] to-[#FFB347] px-5 py-4 text-white shadow-2xl"
      >
        <Dice5 size={22} />
        <span style={{ fontWeight: 800 }}>TERSERAH</span>
      </motion.button>

      {/* Route info card */}
      <AnimatePresence>
        {routeTarget && !selected && (
          <RouteInfoCard
            target={routeTarget}
            distance={distanceKm(routeTarget)}
            onClose={() => setRouteTarget(null)}
            onStart={() => { setNavTarget(routeTarget); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <EateryDetail
            eatery={selected}
            onClose={() => setSelected(null)}
            onRoute={() => { setRouteTarget(selected); setSelected(null); }}
            distance={distanceKm(selected)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {navTarget && (
          <Navigator
            target={navTarget}
            distance={distanceKm(navTarget)}
            onClose={() => { setNavTarget(null); setRouteTarget(null); }}
          />
        )}
      </AnimatePresence>

      {/* Campus selector bottom sheet */}
      <AnimatePresence>
        {campusOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setCampusOpen(false)} className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
              className="absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg" style={{fontWeight:800}}>Pilih Kampus</h3>
                <button onClick={() => setCampusOpen(false)} className="rounded-full bg-gray-100 p-1.5"><X size={16} /></button>
              </div>
              <div className="space-y-2">
                {CAMPUSES.map((c) => (
                  <motion.button
                    key={c.code} whileTap={{scale:0.97}}
                    onClick={() => switchCampus(c.code)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 ${campus === c.code ? "border-[#FF6B1A] bg-orange-50" : "border-gray-100"}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] text-white" style={{fontWeight:800}}>
                      {c.code}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm" style={{fontWeight:700}}>{c.name}</div>
                      <div className="text-xs text-gray-500">{c.students} mahasiswa</div>
                    </div>
                    {campus === c.code && <Check size={18} className="text-[#FF6B1A]" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RouteLine({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  // Curved bezier between two % points
  const cx = (from.x + to.x) / 2 + (to.y - from.y) * 0.25;
  const cy = (from.y + to.y) / 2 - (to.x - from.x) * 0.25;
  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="routeG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#FF6B1A" />
        </linearGradient>
      </defs>
      <motion.path
        d={d} stroke="url(#routeG)" strokeWidth="1.1" fill="none" strokeLinecap="round"
        strokeDasharray="2 1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        vectorEffect="non-scaling-stroke"
        style={{ filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.4))" }}
      />
    </svg>
  );
}

function RouteInfoCard({ target, distance, onClose, onStart }: { target: any; distance: number; onClose: () => void; onStart: () => void }) {
  const [mode, setMode] = useState<"walk" | "bike" | "car">("walk");
  const speeds = { walk: 5, bike: 25, car: 35 };
  const minutes = Math.max(1, Math.round((distance / speeds[mode]) * 60));
  const modes = [
    { k: "walk" as const, l: "Jalan", i: <Footprints size={14} /> },
    { k: "bike" as const, l: "Motor", i: <Bike size={14} /> },
    { k: "car" as const, l: "Ojek", i: <Car size={14} /> },
  ];

  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }} transition={spring}
      className="absolute bottom-24 left-3 right-3 z-30 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-[#FF6B1A] text-white">
          <Navigation size={20} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-blue-600" style={{fontWeight:700}}>Rute ke</div>
          <div className="text-base tracking-tight" style={{fontWeight:800}}>{target.name}</div>
        </div>
        <button onClick={onClose} className="rounded-full bg-gray-100 p-1.5"><X size={14} /></button>
      </div>

      <div className="mt-3 flex gap-1 rounded-2xl bg-gray-100 p-1">
        {modes.map((m) => {
          const active = mode === m.k;
          return (
            <button key={m.k} onClick={() => setMode(m.k)} className={`relative flex-1 rounded-xl py-2 text-xs ${active ? "text-white" : "text-gray-600"}`} style={{fontWeight:700}}>
              {active && <motion.div layoutId="modeb" transition={spring} className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-[#FF6B1A]" />}
              <span className="relative flex items-center justify-center gap-1.5">{m.i}{m.l}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-blue-50 p-2.5">
          <div className="text-[10px] text-gray-500">Jarak</div>
          <div className="text-sm tracking-tight" style={{fontWeight:800}}>{distance.toFixed(1)} km</div>
        </div>
        <div className="rounded-2xl bg-orange-50 p-2.5">
          <div className="text-[10px] text-gray-500">Estimasi</div>
          <div className="flex items-center gap-1 text-sm tracking-tight" style={{fontWeight:800}}><Clock size={11} /> {minutes} mnt</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-2.5">
          <div className="text-[10px] text-gray-500">Tercepat</div>
          <div className="text-sm tracking-tight text-emerald-700" style={{fontWeight:800}}>Via Jl. Tlogomas</div>
        </div>
      </div>

      <motion.button
        whileTap={{scale:0.97}} onClick={onStart}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-[#FF6B1A] py-3 text-white shadow-lg shadow-blue-500/30"
        style={{fontWeight:700}}
      >
        <Navigation size={16} /> Mulai Navigasi
      </motion.button>
    </motion.div>
  );
}

function MapBackground() {
  return (
    <svg className="h-full w-full" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D6DEE8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="800" fill="#E8EEF4" />
      <rect width="400" height="800" fill="url(#grid)" />
      <path d="M 0 350 Q 200 380 400 320" stroke="#FFFFFF" strokeWidth="22" fill="none" />
      <path d="M 150 0 Q 180 400 220 800" stroke="#FFFFFF" strokeWidth="18" fill="none" />
      <path d="M 0 600 L 400 580" stroke="#FFFFFF" strokeWidth="14" fill="none" />
      <circle cx="80" cy="500" r="60" fill="#C8E6C9" opacity="0.6" />
      <rect x="280" y="450" width="100" height="80" rx="12" fill="#C8E6C9" opacity="0.6" />
      <rect x="200" y="180" width="80" height="60" rx="6" fill="#D8DFEB" />
      <rect x="40" y="220" width="60" height="50" rx="6" fill="#D8DFEB" />
      <rect x="300" y="650" width="70" height="80" rx="6" fill="#D8DFEB" />
    </svg>
  );
}
