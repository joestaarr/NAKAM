import { useState, memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Zap, Edit2, TrendingUp, Eye, Plus, Trash2, X, Check, Store, MapPin,
  Bell, Sparkles, ChevronRight, Power, ShoppingBag,
} from "lucide-react";
import { useStore, fmtRp, MerchantMenuItem } from "@/store/store";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const STATUSES = [
  { key: "buka", label: "Buka", color: "bg-green-500" },
  { key: "ramai", label: "Ramai", color: "bg-amber-500" },
  { key: "tutup", label: "Tutup", color: "bg-gray-500" },
] as const;

const createMarkerIcon = (emoji: string) => L.divIcon({
  className: '',
  html: `<div class="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl shadow-xl">${emoji || '🍜'}</div><div class="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] text-white shadow" style="font-weight:700">LOKASI TOKO</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang" },
  { code: "UB", name: "Universitas Brawijaya" },
  { code: "UM", name: "Universitas Negeri Malang" },
];

const EMOJI_PRESET = ["🍜", "🍳", "🍗", "☕", "🍚", "🥘", "🍔", "🍱", "🧋", "🍡"];

export const MerchantDashboard = memo(function MerchantDashboard({ onBack }: { onBack: () => void }) {
  const { merchant } = useStore();
  if (!merchant.onboarded) return <Onboarding onBack={onBack} />;
  return <Dashboard onBack={onBack} />;
});

/* ---------------- ONBOARDING ---------------- */

function Onboarding({ onBack }: { onBack: () => void }) {
  const { finishOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍜");
  const [campus, setCampus] = useState("UMM");
  const [lat, setLat] = useState(-7.9213);
  const [lng, setLng] = useState(112.5990);
  const [price, setPrice] = useState("10k - 25k");
  const [menu, setMenu] = useState<MerchantMenuItem[]>([]);
  const [draft, setDraft] = useState({ name: "", price: "", emoji: "🍳" });

  const addItem = () => {
    if (!draft.name || !draft.price) return;
    setMenu([...menu, { id: "m" + Date.now(), name: draft.name, price: parseInt(draft.price) || 0, emoji: draft.emoji, available: true, sold: 0 }]);
    setDraft({ name: "", price: "", emoji: "🍳" });
  };

  const next = () => setStep((s) => s + 1);
  const finish = () => {
    finishOnboarding({ name, campus, emoji, price, lat, lng, menu });
  };

  const canNext = step === 0 ? name.trim().length >= 3 : step === 1 ? !!campus : step === 2 ? !!lat : true;

  function LocationMarker() {
    useMapEvents({ click(e) { setLat(e.latlng.lat); setLng(e.latlng.lng); } });
    return <Marker position={[lat, lng]} icon={createMarkerIcon(emoji)} />;
  }

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, map.getZoom());
    return null;
  }

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={spring}
      className="scroll-smooth-y no-scrollbar absolute inset-0 z-50 h-full w-full overflow-y-auto bg-gradient-to-b from-[#0a0e27] via-[#1a1f4d] to-[#0a0e27] text-white"
    >
      <div className="flex items-center gap-3 px-5 pt-12">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="rounded-full bg-white/10 p-2">
          <ArrowLeft size={18} />
        </motion.button>
        <div className="flex-1">
          <div className="text-xs text-white/60">Setup Toko · Langkah {step + 1}/4</div>
          <div className="mt-1 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#FF6B1A]" : "bg-white/15"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-32 pt-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-1 text-3xl">👋</div>
              <h1 className="text-2xl tracking-tight" style={{ fontWeight: 800 }}>Halo Juragan!</h1>
              <p className="mt-1 text-sm text-white/60">Yuk daftarin toko kamu biar bisa dilihat ribuan mahasiswa.</p>

              <div className="mt-6">
                <label className="text-xs text-white/60">Nama Toko</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Warkop Mas Bro"
                  className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-base outline-none placeholder:text-white/30"
                />
              </div>

              <div className="mt-5">
                <label className="text-xs text-white/60">Pilih Ikon Toko</label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {EMOJI_PRESET.map((e) => (
                    <motion.button
                      key={e} whileTap={{ scale: 0.9 }} onClick={() => setEmoji(e)}
                      className={`aspect-square rounded-2xl text-2xl ${emoji === e ? "border-2 border-[#FF6B1A] bg-orange-500/20" : "border border-white/10 bg-white/5"}`}
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs text-white/60">Range Harga (estimasi)</label>
                <input
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="10k - 25k"
                  className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-1 text-3xl">📍</div>
              <h1 className="text-2xl tracking-tight" style={{ fontWeight: 800 }}>Pilih Kampus Terdekat</h1>
              <p className="mt-1 text-sm text-white/60">Toko kamu bakal muncul di peta mahasiswa kampus ini.</p>

              <div className="mt-6 space-y-2">
                {CAMPUSES.map((c) => {
                  const active = campus === c.code;
                  return (
                    <motion.button
                      key={c.code} whileTap={{ scale: 0.97 }} onClick={() => setCampus(c.code)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${active ? "border-[#FF6B1A] bg-orange-500/15" : "border-white/10 bg-white/5"}`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? "bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42]" : "bg-white/10"}`} style={{ fontWeight: 800 }}>
                        {c.code}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm" style={{ fontWeight: 700 }}>{c.name}</div>
                        <div className="text-xs text-white/50">Radius peta 1km</div>
                      </div>
                      {active && <Check size={18} className="text-[#FF6B1A]" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col h-[60vh]">
              <div className="mb-1 text-3xl">📌</div>
              <h1 className="text-2xl tracking-tight" style={{ fontWeight: 800 }}>Tandai Lokasi Asli</h1>
              <p className="mt-1 text-sm text-white/60">Geser peta dan tap untuk menandai lokasi toko kamu persisnya di mana.</p>
              
              <div className="mt-5 flex-1 relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
                <MapContainer center={[lat, lng]} zoom={16} zoomControl={false} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  <LocationMarker />
                  <MapUpdater center={[lat, lng]} />
                </MapContainer>
                <div className="absolute top-4 left-4 right-4 z-[400] rounded-xl bg-black/60 backdrop-blur-md p-3 border border-white/10 text-xs text-center font-medium">
                  Klik di area peta untuk memindah Pin Lokasi
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-1 text-3xl">📝</div>
              <h1 className="text-2xl tracking-tight" style={{ fontWeight: 800 }}>Tambah Menu Awal</h1>
              <p className="mt-1 text-sm text-white/60">Boleh skip, bisa ditambah kapan aja nanti.</p>

              <div className="mt-5 space-y-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
                <div className="flex items-center gap-2">
                  <select
                    value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                    className="rounded-xl border border-white/10 bg-white/10 px-2 py-2.5 text-lg outline-none"
                  >
                    {EMOJI_PRESET.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input
                    value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Nama menu"
                    className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, "") })}
                    placeholder="Harga (Rp)" inputMode="numeric"
                    className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-white/30"
                  />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={addItem} className="flex items-center gap-1 rounded-xl bg-[#FF6B1A] px-4 py-2.5 text-sm" style={{ fontWeight: 700 }}>
                    <Plus size={14} /> Tambah
                  </motion.button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {menu.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-xs text-white/40">
                    Belum ada menu. Tambahkan di atas atau lewati.
                  </div>
                ) : (
                  menu.map((m) => (
                    <motion.div key={m.id} layout className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="text-2xl">{m.emoji}</div>
                      <div className="flex-1">
                        <div className="text-sm" style={{ fontWeight: 600 }}>{m.name}</div>
                        <div className="text-xs text-white/50">{fmtRp(m.price)}</div>
                      </div>
                      <button onClick={() => setMenu(menu.filter((x) => x.id !== m.id))} className="rounded-lg bg-red-500/20 p-1.5 text-red-300">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex gap-2.5 border-t border-white/10 bg-[#0a0e27]/95 p-4 backdrop-blur-xl">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm" style={{ fontWeight: 600 }}>
            Kembali
          </button>
        )}
        <motion.button
          whileTap={{ scale: canNext ? 0.97 : 1 }}
          disabled={!canNext}
          onClick={step < 3 ? next : finish}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm ${canNext ? "bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] text-white shadow-lg shadow-[#FF6B1A]/30" : "bg-white/10 text-white/40"}`}
          style={{ fontWeight: 700 }}
        >
          {step < 3 ? <>Lanjut <ChevronRight size={16} /></> : <>🚀 Publikasi Toko</>}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------------- DASHBOARD ---------------- */

function Dashboard({ onBack }: { onBack: () => void }) {
  const {
    merchant, setMerchantStatus, setMerchantInfo,
    addMenuItem, updateMenuItem, removeMenuItem, toggleMenuAvailable,
    pushMockOrder, completeOrder, deleteStore, addFlashPromo
  } = useStore();
  const [tab, setTab] = useState<"home" | "menu" | "order" | "info">("home");
  const [showBanner, setShowBanner] = useState(false);
  const [menuModal, setMenuModal] = useState<{ open: boolean; item?: MerchantMenuItem }>({ open: false });
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  const newOrders = merchant.orders.filter((o) => o.status === "baru").length;
  const totalSold = merchant.menu.reduce((s, m) => s + m.sold, 0);
  const revenue = merchant.menu.reduce((s, m) => s + m.sold * m.price, 0);

  const triggerPromo = () => {
    setPromoModalOpen(true);
  };

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={spring}
      className="scroll-smooth-y no-scrollbar absolute inset-0 z-50 h-full w-full overflow-y-auto bg-[#0a0e27] text-white"
    >
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} transition={spring}
            className="absolute left-3 right-3 top-3 z-50 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF3A3A] p-3.5 shadow-2xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Zap size={20} /></div>
            <div className="flex-1">
              <div className="text-sm" style={{ fontWeight: 800 }}>⚡ Promo disebar ke 150 mahasiswa!</div>
              <div className="text-xs opacity-90">Pesanan baru masuk 👀</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#0a0e27]/85 px-5 pb-3 pt-12 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="rounded-full bg-white/10 p-2"><ArrowLeft size={18} /></motion.button>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300">● Live di {merchant.campus}</div>
            <h1 className="text-xl tracking-tight" style={{ fontWeight: 800 }}>
              <span className="mr-1.5">{merchant.emoji}</span>{merchant.name}
            </h1>
          </div>
          <button onClick={() => pushMockOrder()} className="relative rounded-full bg-white/10 p-2">
            <Bell size={16} />
            {newOrders > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px]" style={{ fontWeight: 800 }}>{newOrders}</span>}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto rounded-2xl bg-white/5 p-1 no-scrollbar">
          {[
            { k: "home", l: "Beranda", i: <TrendingUp size={13} /> },
            { k: "menu", l: "Menu", i: <Sparkles size={13} /> },
            { k: "order", l: `Pesanan${newOrders ? ` (${newOrders})` : ""}`, i: <ShoppingBag size={13} /> },
            { k: "info", l: "Info", i: <Store size={13} /> },
          ].map((t) => {
            const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k as any)} className={`relative flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[11px] transition-colors ${active ? "text-[#0a0e27]" : "text-white/60"}`} style={{ fontWeight: 700 }}>
                {active && <motion.div layoutId="mtab" transition={spring} className="absolute inset-0 rounded-xl bg-white" />}
                <span className="relative flex items-center gap-1">{t.i}{t.l}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-32 pt-5">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Status */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/60">Status warung saat ini</div>
                    <div className="mt-0.5 text-base" style={{ fontWeight: 700 }}>Atur visibilitas di peta</div>
                  </div>
                  <Power size={18} className="text-white/40" />
                </div>
                <div className="mt-3 flex gap-2 rounded-2xl bg-black/30 p-1">
                  {STATUSES.map((s) => {
                    const active = merchant.status === s.key;
                    return (
                      <motion.button key={s.key} whileTap={{ scale: 0.95 }} onClick={() => setMerchantStatus(s.key)}
                        className={`relative flex-1 rounded-xl py-2.5 text-sm transition-colors ${active ? "text-[#0a0e27]" : "text-white/70"}`} style={{ fontWeight: 700 }}>
                        {active && <motion.div layoutId="status" transition={spring} className="absolute inset-0 rounded-xl bg-white" />}
                        <span className="relative flex items-center justify-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.color}`} />{s.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Stats Bento */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Stat icon={<Eye size={18} />} value={merchant.views.toLocaleString("id-ID")} label="Views hari ini" color="from-blue-500/20 to-blue-500/5" iconColor="text-blue-300" />
                <Stat icon={<ShoppingBag size={18} />} value={totalSold.toString()} label="Total terjual" color="from-orange-500/20 to-orange-500/5" iconColor="text-orange-300" />
                <Stat icon={<TrendingUp size={18} />} value={fmtRp(revenue)} label="Estimasi omzet" color="from-emerald-500/20 to-emerald-500/5" iconColor="text-emerald-300" wide />
              </div>

              {/* Best sellers */}
              <div className="mt-5">
                <h3 className="mb-2 text-sm" style={{ fontWeight: 700 }}>🔥 Menu Terlaris</h3>
                {merchant.menu.length === 0 ? (
                  <EmptyHint label="Belum ada menu. Tambah di tab Menu." />
                ) : (
                  <div className="space-y-2">
                    {[...merchant.menu].sort((a, b) => b.sold - a.sold).slice(0, 3).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42]" style={{ fontWeight: 800 }}>#{i + 1}</div>
                        <div className="text-xl">{m.emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm" style={{ fontWeight: 600 }}>{m.name}</div>
                          <div className="text-xs text-white/50">{m.sold} porsi terjual</div>
                        </div>
                        <div className="text-sm text-[#FF8C42]" style={{ fontWeight: 700 }}>{fmtRp(m.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                <MapPin size={16} className="text-emerald-300" />
                <div className="flex-1 text-xs text-emerald-100">Toko kamu live di peta mahasiswa {merchant.campus}.</div>
              </div>
            </motion.div>
          )}

          {tab === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg tracking-tight" style={{ fontWeight: 800 }}>Menu Manager</h2>
                  <div className="text-xs text-white/50">{merchant.menu.length} item · tersinkron ke peta</div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setMenuModal({ open: true })} className="flex items-center gap-1 rounded-full bg-[#FF6B1A] px-3 py-1.5 text-xs" style={{ fontWeight: 700 }}>
                  <Plus size={14} /> Tambah
                </motion.button>
              </div>

              {merchant.menu.length === 0 ? (
                <EmptyHint label="Belum ada menu. Yuk tambah biar muncul di peta!" />
              ) : (
                <div className="space-y-2">
                  {merchant.menu.map((m) => (
                    <motion.div key={m.id} layout className={`flex items-center gap-3 rounded-2xl border bg-white/5 p-3 backdrop-blur-xl ${m.available ? "border-white/10" : "border-white/5 opacity-60"}`}>
                      <div className="text-2xl">{m.emoji}</div>
                      <div className="flex-1">
                        <div className="text-sm" style={{ fontWeight: 600 }}>{m.name}</div>
                        <div className="text-xs text-white/50">{fmtRp(m.price)} · {m.sold} terjual</div>
                      </div>
                      <button onClick={() => toggleMenuAvailable(m.id)} className={`rounded-full px-2 py-1 text-[10px] ${m.available ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"}`} style={{ fontWeight: 700 }}>
                        {m.available ? "Tersedia" : "Habis"}
                      </button>
                      <button onClick={() => setMenuModal({ open: true, item: m })} className="rounded-xl bg-white/10 p-2 text-white/70"><Edit2 size={14} /></button>
                      <button onClick={() => removeMenuItem(m.id)} className="rounded-xl bg-red-500/15 p-2 text-red-300"><Trash2 size={14} /></button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "order" && (
            <motion.div key="order" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-lg tracking-tight" style={{ fontWeight: 800 }}>Pesanan Masuk</h2>
                  <div className="text-xs text-white/50">{newOrders} baru · {merchant.orders.length} total</div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={pushMockOrder} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs" style={{ fontWeight: 600 }}>
                  <Bell size={12} /> Simulasi
                </motion.button>
              </div>

              {merchant.orders.length === 0 ? (
                <EmptyHint label="Belum ada pesanan. Sebar promo biar laris!" />
              ) : (
                <div className="space-y-2">
                  {merchant.orders.map((o) => (
                    <motion.div key={o.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 rounded-2xl border p-3 ${o.status === "baru" ? "border-[#FF6B1A]/40 bg-orange-500/10" : "border-white/10 bg-white/5 opacity-70"}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">🛍️</div>
                      <div className="flex-1">
                        <div className="text-sm" style={{ fontWeight: 700 }}>{o.qty}× {o.item}</div>
                        <div className="text-[11px] text-white/50">{o.time}</div>
                      </div>
                      {o.status === "baru" ? (
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => completeOrder(o.id)}
                          className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] text-white" style={{ fontWeight: 700 }}>
                          <Check size={12} /> Selesai
                        </motion.button>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/50" style={{ fontWeight: 600 }}>Selesai</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "info" && (
            <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="mb-3 text-lg tracking-tight" style={{ fontWeight: 800 }}>Info Toko</h2>
              <div className="space-y-3">
                <InfoField label="Nama Toko" value={merchant.name} onChange={(v) => setMerchantInfo({ name: v })} />
                <div>
                  <label className="text-xs text-white/60">Ikon Toko</label>
                  <div className="mt-1.5 grid grid-cols-5 gap-2">
                    {EMOJI_PRESET.map((e) => (
                      <motion.button key={e} whileTap={{ scale: 0.9 }} onClick={() => setMerchantInfo({ emoji: e })}
                        className={`aspect-square rounded-2xl text-2xl ${merchant.emoji === e ? "border-2 border-[#FF6B1A] bg-orange-500/20" : "border border-white/10 bg-white/5"}`}>
                        {e}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <InfoField label="Range Harga" value={merchant.price} onChange={(v) => setMerchantInfo({ price: v })} />
                <div>
                  <label className="text-xs text-white/60">Kampus</label>
                  <div className="mt-1.5 space-y-2">
                    {CAMPUSES.map((c) => {
                      const active = merchant.campus === c.code;
                      return (
                        <motion.button key={c.code} whileTap={{ scale: 0.97 }} onClick={() => setMerchantInfo({ campus: c.code })}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${active ? "border-[#FF6B1A] bg-orange-500/10" : "border-white/10 bg-white/5"}`}>
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42]" : "bg-white/10"}`} style={{ fontWeight: 800 }}>{c.code}</div>
                          <div className="flex-1 text-sm">{c.name}</div>
                          {active && <Check size={16} className="text-[#FF6B1A]" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-red-500/20">
                  <h3 className="text-sm font-bold text-red-400">Zona Berbahaya</h3>
                  <p className="mt-1 text-xs text-red-400/60 mb-3">Tindakan ini tidak dapat dibatalkan. Semua data toko dan menu akan dihapus permanen.</p>
                  <button
                    onClick={() => {
                      if (window.confirm("Yakin ingin menghapus tokomu secara permanen?")) {
                        deleteStore();
                        onBack();
                      }
                    }}
                    className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-bold text-red-400"
                  >
                    Hapus Toko Permanen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky promo */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0a0e27]/95 p-4 backdrop-blur-xl">
        <motion.button whileTap={{ scale: 0.96 }} transition={spring} onClick={triggerPromo}
          className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF3A3A] via-[#FF6B1A] to-[#FF3A3A] py-3.5 text-white shadow-2xl shadow-red-500/40"
          style={{ fontWeight: 800 }}>
          <span className="absolute inset-0 animate-pulse bg-white/10" />
          <span className="relative flex items-center justify-center gap-2"><Zap size={18} fill="white" />⚡ SEBAR FLASH PROMO</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {menuModal.open && (
          <MenuItemModal
            item={menuModal.item}
            onClose={() => setMenuModal({ open: false })}
            onSave={(data) => {
              if (menuModal.item) updateMenuItem(menuModal.item.id, data);
              else addMenuItem({ ...data, available: true });
              setMenuModal({ open: false });
            }}
          />
        )}
        {promoModalOpen && (
          <FlashPromoModal
            merchant={merchant}
            onClose={() => setPromoModalOpen(false)}
            onSave={(promoData: any) => {
              addFlashPromo(promoData);
              setPromoModalOpen(false);
              setShowBanner(true);
              setTimeout(() => setShowBanner(false), 3000);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ icon, value, label, color, iconColor, wide }: any) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${color} p-4 ${wide ? "col-span-2" : ""}`}>
      <div className={iconColor}>{icon}</div>
      <div className="mt-2 text-2xl tracking-tight" style={{ fontWeight: 800 }}>{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-white/50">{label}</div>;
}

function InfoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/60">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" />
    </div>
  );
}

function MenuItemModal({ item, onClose, onSave }: { item?: MerchantMenuItem; onClose: () => void; onSave: (m: { name: string; price: number; emoji: string }) => void }) {
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [emoji, setEmoji] = useState(item?.emoji || "🍳");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={spring}
        className="w-full rounded-t-3xl bg-white p-6 text-gray-900">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xl tracking-tight" style={{ fontWeight: 800 }}>{item ? "Edit Menu" : "Tambah Menu"}</h3>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-1.5"><X size={14} /></button>
        </div>
        <p className="text-xs text-gray-500">Sinkron real-time ke peta mahasiswa.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500">Ikon</label>
            <div className="mt-1.5 grid grid-cols-5 gap-2">
              {EMOJI_PRESET.map((e) => (
                <motion.button key={e} whileTap={{ scale: 0.9 }} onClick={() => setEmoji(e)}
                  className={`aspect-square rounded-2xl text-2xl ${emoji === e ? "border-2 border-[#FF6B1A] bg-orange-50" : "border border-gray-200 bg-white"}`}>
                  {e}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Nama Menu</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Nasi Goreng Spesial"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Harga (Rp)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="15000" inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none" />
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => name && price && onSave({ name, price: parseInt(price), emoji })}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-3.5 text-white" style={{ fontWeight: 700 }}>
          {item ? "Simpan Perubahan" : "Tambah Menu"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function FlashPromoModal({ merchant, onClose, onSave }: any) {
  const [selectedMenu, setSelectedMenu] = useState<string>(merchant.menu[0]?.name || "");
  const [duration, setDuration] = useState<number>(30);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  const handleSave = () => {
    if (!selectedMenu) return;
    const menu = merchant.menu.find((m: any) => m.name === selectedMenu);
    
    let totalMinutes = duration;
    if (duration === -1) {
      totalMinutes = (parseInt(customHours) || 0) * 60 + (parseInt(customMinutes) || 0);
    }
    if (totalMinutes <= 0) return;

    const endTime = new Date(Date.now() + totalMinutes * 60000).toISOString();
    
    onSave({
      merchantName: merchant.name,
      merchantEmoji: merchant.emoji,
      menuName: menu.name,
      menuEmoji: menu.emoji,
      campus: merchant.campus,
      endTime
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }} transition={spring}
        className="w-full rounded-t-3xl bg-white p-6 text-gray-900 pb-10">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xl tracking-tight" style={{ fontWeight: 800 }}>⚡ Buat Flash Promo</h3>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-1.5"><X size={14} /></button>
        </div>
        <p className="text-xs text-gray-500">Kirim notifikasi ke semua mahasiswa di sekitar {merchant.campus}.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-bold">Pilih Menu Promo</label>
            <select value={selectedMenu} onChange={e => setSelectedMenu(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none font-bold">
              {merchant.menu.map((m: any) => (
                <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
              ))}
              {merchant.menu.length === 0 && <option value="">Belum ada menu</option>}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold">Durasi Promo</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <button onClick={() => setDuration(30)} className={`py-2 rounded-xl border text-sm font-bold transition-all ${duration === 30 ? "bg-[#FF6B1A] text-white border-[#FF6B1A]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>30 Menit</button>
              <button onClick={() => setDuration(60)} className={`py-2 rounded-xl border text-sm font-bold transition-all ${duration === 60 ? "bg-[#FF6B1A] text-white border-[#FF6B1A]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>1 Jam</button>
              <button onClick={() => setDuration(120)} className={`py-2 rounded-xl border text-sm font-bold transition-all ${duration === 120 ? "bg-[#FF6B1A] text-white border-[#FF6B1A]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>2 Jam</button>
            </div>
            
            <button onClick={() => setDuration(-1)} className={`mt-2 w-full py-2 rounded-xl border text-sm font-bold transition-all ${duration === -1 ? "bg-[#FF6B1A] text-white border-[#FF6B1A]" : "bg-gray-50 text-gray-600 border-gray-200"}`}>Manual / Kustom</button>
            
            {duration === -1 && (
              <div className="mt-2 flex gap-2">
                <input value={customHours} onChange={e => setCustomHours(e.target.value.replace(/\D/g, ''))} placeholder="Jam" type="number" className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none font-bold text-center" />
                <input value={customMinutes} onChange={e => setCustomMinutes(e.target.value.replace(/\D/g, ''))} placeholder="Menit" type="number" className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none font-bold text-center" />
              </div>
            )}
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={handleSave} disabled={!selectedMenu}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg disabled:opacity-50" style={{ fontWeight: 800 }}>
          <Zap size={18} fill="white" /> Kirim Flash Promo
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
