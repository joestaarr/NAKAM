import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plug, Users, Wallet, Footprints, Flame, Navigation,
  Plus, ChevronUp, Star, ChevronLeft, ChevronRight, Delete, Check,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useStore, fmtRp } from "@/store/store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export type Eatery = {
  id: string;
  name: string;
  image: string;
  walk: string;
  dominance: number;
  price: string;
  tags: string[];
  rating: number;
  reviews: number;
  menu: { name: string; price: number; emoji: string }[];
  gallery: string[];
};

export function EateryDetail({
  eatery,
  onClose,
  onRoute,
  distance,
}: {
  eatery: Eatery;
  onClose: () => void;
  onRoute?: () => void;
  distance?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overlay, setOverlay] = useState<null | "gallery" | "checkin" | "expense" | "success">(null);
  const [amount, setAmount] = useState("");
  const { addExpense } = useStore();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0, height: expanded ? "100%" : "auto" }}
        exit={{ y: "100%" }}
        transition={spring}
        drag={!expanded ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(_, info) => {
          if (info.offset.y < -80) setExpanded(true);
          else if (info.offset.y > 100) onClose();
        }}
        className={`absolute left-0 right-0 z-[70] overflow-hidden bg-white dark:bg-[#0a0e27] shadow-2xl ${expanded ? "top-0 bottom-0 rounded-none" : "bottom-0 max-h-[90%] rounded-t-[28px]"}`}
      >
        {!expanded && (
          <div className="flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
        )}

        <div className="overflow-y-auto" style={{ maxHeight: expanded ? "100vh" : "85vh" }}>
          {/* Hero */}
          <div className="relative w-full">
            <div onClick={() => setOverlay("gallery")} className="cursor-pointer">
              <ImageWithFallback
                src={eatery.image}
                alt={eatery.name}
                className={`w-full object-cover transition-all ${expanded ? "h-64" : "h-44"}`}
              />
            </div>
            {expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="absolute left-3 top-12 rounded-full bg-black/40 p-2 text-white backdrop-blur-md"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-md"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-[#1a2340]/90 px-3 py-1.5 backdrop-blur-md">
              <Footprints size={14} className="text-[#FF6B1A]" />
              <span className="text-xs text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>🚶 {eatery.walk} jalan kaki</span>
            </div>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] text-white backdrop-blur-md">
              📷 {eatery.gallery?.length || 0} foto
            </div>
          </div>

          <div className="px-5 pb-6 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>{eatery.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{eatery.tags?.join(" · ") || "Warung Makan"}</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs">
                <Star size={12} fill="#FFB800" stroke="#FFB800" />
                <span className="text-amber-900 dark:text-amber-400" style={{ fontWeight: 700 }}>{eatery.rating?.toFixed(1) || "4.7"}</span>
                <span className="text-amber-700/60 dark:text-amber-400/60 font-medium ml-0.5">({eatery.reviews || 0})</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-50 dark:from-orange-500/10 to-red-50 dark:to-red-500/10 p-3 ring-1 ring-orange-100 dark:ring-orange-500/20">
              <div className="rounded-xl bg-[#FF6B1A] p-2 text-white"><Flame size={18} /></div>
              <div>
                <div className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>🔥 {eatery.dominance}% Anak UMM sering ke sini</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Campus Dominance</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <BentoTile icon={<Plug size={20} />} title="Colokan" subtitle="Melimpah" color="from-blue-50 to-blue-100 text-blue-600" />
              <BentoTile icon={<Users size={20} />} title="Rombongan" subtitle="Friendly" color="from-purple-50 to-purple-100 text-purple-600" />
              <BentoTile icon={<Wallet size={20} />} title="Estimasi" subtitle={eatery.price} color="from-green-50 to-green-100 text-green-600" />
              <BentoTile icon={<Navigation size={20} />} title="Parkir" subtitle="Bebas" color="from-amber-50 to-amber-100 text-amber-600" />
            </div>

            {/* Menu */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5"
                >
                  <h3 className="mb-2 text-base text-gray-900 dark:text-white" style={{ fontWeight: 700 }}>Menu Andalan</h3>
                  <div className="space-y-2">
                    {(eatery.menu || []).map((m) => (
                      <div key={m.name} className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/10 text-2xl">{m.emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 600 }}>{m.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{fmtRp(m.price)}</div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            addExpense({ place: eatery.name, items: [m.name], amount: m.price, emoji: m.emoji });
                            setOverlay("success");
                            setTimeout(() => { setOverlay(null); }, 1400);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF6B1A] text-white"
                        >
                          <Plus size={16} />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-gray-200 dark:border-white/10 py-2.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <ChevronUp size={14} /> Geser ke atas untuk Menu Lengkap
              </button>
            )}

            <div className="mt-5 flex gap-2.5">
              {onRoute && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onRoute}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-blue-500 bg-white dark:bg-transparent py-3.5 text-blue-600 dark:text-blue-400"
                  style={{ fontWeight: 700 }}
                >
                  <Navigation size={16} />
                  Rute{distance !== undefined ? ` · ${distance.toFixed(1)}km` : ""}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setOverlay("expense")}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-3.5 text-white shadow-lg shadow-[#FF6B1A]/30"
                style={{ fontWeight: 700 }}
              >
                <Plus size={18} /> Input Manual
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {overlay === "gallery" && eatery.gallery?.length > 0 && (
          <Gallery photos={eatery.gallery} onClose={() => setOverlay(null)} />
        )}
        {overlay === "checkin" && (
          <CheckInModal
            place={eatery.name}
            onCancel={() => setOverlay(null)}
            onConfirm={() => setOverlay("expense")}
          />
        )}
        {overlay === "expense" && (
          <AddExpenseModal
            place={eatery.name}
            amount={amount}
            setAmount={setAmount}
            onCancel={() => setOverlay(null)}
            onConfirm={() => {
              if (amount) {
                addExpense({ place: eatery.name, items: ["Check-in"], amount: parseInt(amount), emoji: "🍽️" });
              }
              setOverlay("success");
              setTimeout(() => { setOverlay(null); onClose(); }, 1400);
            }}
          />
        )}
        {overlay === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={spring}
              className="rounded-3xl bg-white dark:bg-[#1a2340] px-8 py-7 text-center"
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20 text-3xl">✅</div>
              <div className="text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>Check-in berhasil!</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pengeluaran tercatat di Wallet</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function BentoTile({ icon, title, subtitle, color }: any) {
  // Add dark mode support to the bento tiles by injecting dark variants dynamically or using transparent backgrounds
  const isBlue = color.includes('blue');
  const isPurple = color.includes('purple');
  const isGreen = color.includes('green');
  const isAmber = color.includes('amber');
  
  const darkClass = isBlue ? 'dark:from-blue-500/10 dark:to-blue-500/20 dark:text-blue-400' 
                  : isPurple ? 'dark:from-purple-500/10 dark:to-purple-500/20 dark:text-purple-400'
                  : isGreen ? 'dark:from-green-500/10 dark:to-green-500/20 dark:text-green-400'
                  : 'dark:from-amber-500/10 dark:to-amber-500/20 dark:text-amber-400';

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} ${darkClass} p-3.5`}>
      <div className="opacity-90">{icon}</div>
      <div className="mt-2 text-xs opacity-70">{title}</div>
      <div className="text-sm" style={{ fontWeight: 700 }}>{subtitle}</div>
    </div>
  );
}

function Gallery({ photos, onClose }: { photos: string[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-12 text-white">
        <button onClick={onClose}><X size={22} /></button>
        <span className="text-sm">{i + 1} / {photos.length}</span>
        <span className="w-5" />
      </div>
      <div className="flex flex-1 items-center">
        <button onClick={() => setI((i - 1 + photos.length) % photos.length)} className="px-2 text-white/70">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1">
          <ImageWithFallback src={photos[i]} alt="" className="h-[60vh] w-full object-cover" />
        </div>
        <button onClick={() => setI((i + 1) % photos.length)} className="px-2 text-white/70">
          <ChevronRight size={28} />
        </button>
      </div>
      <div className="flex justify-center gap-2 pb-12">
        {photos.map((_, idx) => (
          <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
        ))}
      </div>
    </motion.div>
  );
}

function CheckInModal({ place, onCancel, onConfirm }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-end justify-center bg-black/60"
    >
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        exit={{ y: 200 }}
        transition={spring}
        className="w-full rounded-t-3xl bg-white dark:bg-[#1a2340] p-6"
      >
        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Check-in</div>
        <h3 className="text-xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>Konfirmasi Check-in</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kamu akan check-in di <span className="text-gray-900 dark:text-white" style={{fontWeight:700}}>{place}</span>. Lanjut catat pengeluaran?</p>

        <div className="mt-5 flex gap-2.5">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-gray-200 dark:border-white/10 py-3.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5" style={{fontWeight:600}}>Batal</button>
          <motion.button whileTap={{scale:0.95}} onClick={onConfirm} className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-3.5 text-white" style={{fontWeight:700}}>
            Lanjut
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddExpenseModal({ place, amount, setAmount, onCancel, onConfirm }: any) {
  const press = (k: string) => {
    if (k === "del") setAmount(amount.slice(0, -1));
    else setAmount(amount + k);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-end justify-center bg-black/60"
    >
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        transition={spring}
        className="w-full rounded-t-3xl bg-white dark:bg-[#1a2340] p-6"
      >
        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Tambah Pengeluaran · {place}</div>
        <h3 className="text-xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>Habis berapa di sini?</h3>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-white dark:from-orange-500/10 dark:to-[#1a2340] p-5 ring-1 ring-orange-100 dark:ring-orange-500/20">
          <div className="text-xs text-gray-500 dark:text-gray-400">Jumlah</div>
          <div className="mt-1 text-3xl tracking-tight text-gray-900 dark:text-white" style={{ fontWeight: 800 }}>
            Rp {(parseInt(amount) || 0).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","000","0","del"].map((k) => (
            <motion.button
              key={k}
              whileTap={{scale:0.9}}
              onClick={() => press(k)}
              className="rounded-2xl bg-gray-100 dark:bg-white/10 py-3.5 text-lg text-gray-900 dark:text-white"
              style={{ fontWeight: 700 }}
            >
              {k === "del" ? <Delete size={18} className="mx-auto text-gray-700 dark:text-white" /> : k}
            </motion.button>
          ))}
        </div>

        <div className="mt-4 flex gap-2.5">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-gray-200 dark:border-white/10 py-3.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5" style={{fontWeight:600}}>Skip</button>
          <motion.button whileTap={{scale:0.95}} onClick={onConfirm} className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-3.5 text-white" style={{fontWeight:700}}>
            Simpan
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
