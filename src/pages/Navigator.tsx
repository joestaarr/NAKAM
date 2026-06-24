import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Navigation, Footprints, Bike, Car, Clock, ArrowUp, ArrowUpRight, ArrowUpLeft, MapPin, X, Volume2,
} from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type Mode = "walk" | "bike" | "car";

const SPEEDS: Record<Mode, number> = { walk: 5, bike: 25, car: 35 };

const STEP_TEMPLATES = [
  { icon: ArrowUp, dir: "Lurus" },
  { icon: ArrowUpRight, dir: "Belok kanan" },
  { icon: ArrowUp, dir: "Ikuti jalan utama" },
  { icon: ArrowUpLeft, dir: "Belok kiri" },
  { icon: ArrowUp, dir: "Lurus melewati lampu merah" },
  { icon: ArrowUpRight, dir: "Belok kanan di Indomaret" },
];

export function Navigator({ target, routeData, onCancel }: { target: any; routeData?: any; onCancel: () => void }) {
  const [mode, setMode] = useState<Mode>("walk");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const distance = routeData ? routeData.dist / 1000 : 1.5;
  const totalMin = routeData ? Math.max(1, Math.round(routeData.dur / 60)) : Math.max(1, Math.round((distance / SPEEDS[mode]) * 60));
  const etaMin = Math.max(0, Math.ceil(totalMin * (1 - progress / 100)));
  const remainingKm = (distance * (1 - progress / 100)).toFixed(2);

  const steps = STEP_TEMPLATES.slice(0, Math.min(5, Math.max(3, Math.round(distance * 2)))).map((s, i, arr) => {
    const segment = distance / arr.length;
    return { ...s, meters: Math.round(segment * 1000), street: ["Jl. Tlogomas", "Jl. Raya Sengkaling", "Jl. Tirto Utomo", "Gg. Mawar", "Jl. Bendungan"][i] || "Jl. Kampus" };
  });

  useEffect(() => {
    if (progress >= 100) return;
    const t = setInterval(() => {
      setProgress((p) => {
        const np = Math.min(100, p + 1.2);
        const segPct = 100 / steps.length;
        setStep(Math.min(steps.length - 1, Math.floor(np / segPct)));
        return np;
      });
    }, 250);
    return () => clearInterval(t);
  }, [steps.length, progress]);

  const StepIcon = steps[step]?.icon || ArrowUp;
  const arrived = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}
      className="absolute inset-0 z-[60] flex flex-col pointer-events-none text-white"
    >
      <div className="relative flex-1 overflow-hidden pointer-events-none">

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 px-4 pt-12 pointer-events-auto">
          <motion.button whileTap={{scale:0.9}} onClick={onCancel} className="rounded-full bg-black/50 p-2 backdrop-blur-xl border border-white/20 text-white">
            <ArrowLeft size={16} />
          </motion.button>
          <div className="flex-1 rounded-2xl border border-white/20 bg-black/50 px-3 py-2 backdrop-blur-xl text-white shadow-lg">
            <div className="text-[10px] text-white/70">Menuju</div>
            <div className="truncate text-sm" style={{fontWeight:700}}>{target.name}</div>
          </div>
          <button className="rounded-full bg-black/50 p-2 backdrop-blur-xl border border-white/20 text-white shadow-lg"><Volume2 size={16} /></button>
        </div>

        {/* Big turn instruction */}
        <AnimatePresence mode="wait">
          {!arrived && (
            <motion.div
              key={step}
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={spring}
              className="absolute left-3 right-3 top-28 z-10 flex items-center gap-3 rounded-3xl border border-white/15 bg-[#0a0e27]/85 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-[#FF6B1A]">
                <StepIcon size={28} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/60">{steps[step]?.meters} m</div>
                <div className="text-lg leading-tight tracking-tight" style={{fontWeight:800}}>{steps[step]?.dir}</div>
                <div className="text-[11px] text-white/50">di {steps[step]?.street}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {arrived && (
          <motion.div
            initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} transition={spring}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/95 px-7 py-6 text-center text-gray-900 shadow-2xl pointer-events-auto"
          >
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">🎉</div>
            <div className="text-xl tracking-tight" style={{fontWeight:800}}>Sampai!</div>
            <div className="mt-1 text-xs text-gray-500">Selamat menikmati di {target.name}</div>
            <button onClick={onCancel} className="mt-4 rounded-full bg-gradient-to-r from-blue-500 to-[#FF6B1A] px-5 py-2 text-xs text-white" style={{fontWeight:700}}>Selesai</button>
          </motion.div>
        )}
      </div>

      {/* Bottom info panel */}
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
        className="relative z-10 border-t border-white/10 bg-[#0a0e27]/95 p-4 backdrop-blur-xl pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:max-w-md md:rounded-t-3xl md:mx-auto md:border-x"
      >
        <div className="flex gap-1 rounded-2xl bg-white/5 p-1">
          {([
            { k: "walk", l: "Jalan", i: <Footprints size={13} /> },
            { k: "bike", l: "Motor", i: <Bike size={13} /> },
            { k: "car", l: "Ojek", i: <Car size={13} /> },
          ] as { k: Mode; l: string; i: any }[]).map((m) => {
            const active = mode === m.k;
            return (
              <button key={m.k} onClick={() => setMode(m.k)} className={`relative flex-1 rounded-xl py-2 text-xs ${active ? "text-[#0a0e27]" : "text-white/70"}`} style={{fontWeight:700}}>
                {active && <motion.div layoutId="navmode" transition={spring} className="absolute inset-0 rounded-xl bg-white" />}
                <span className="relative flex items-center justify-center gap-1.5">{m.i}{m.l}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="ETA" value={`${etaMin} mnt`} icon={<Clock size={12} />} />
          <Stat label="Sisa" value={`${remainingKm} km`} icon={<MapPin size={12} />} />
          <Stat label="Tiba" value={formatArrive(etaMin)} icon={<Navigation size={12} />} />
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/50">
            <span>Progres perjalanan</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#FF6B1A]"
              style={{ width: `${progress}%` }}
              transition={spring}
            />
          </div>
        </div>

        <motion.button whileTap={{scale:0.97}} onClick={onCancel}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/90 py-3 text-sm" style={{fontWeight:700}}>
          <X size={14} /> Akhiri Navigasi
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
      <div className="flex items-center gap-1 text-[10px] text-white/50">{icon}{label}</div>
      <div className="mt-0.5 text-sm tracking-tight" style={{fontWeight:800}}>{value}</div>
    </div>
  );
}

function formatArrive(mins: number) {
  const d = new Date(Date.now() + mins * 60000);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
