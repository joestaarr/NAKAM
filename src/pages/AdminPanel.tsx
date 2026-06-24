import { useState, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, Store, Image as ImageIcon, Loader2, LayoutDashboard, Database, PlusCircle, Megaphone, Trash2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { adminAddEatery, fetchAllEateriesForAdmin, deleteEateryByAdmin, uploadImageToSupabase } from "@/services/supabaseData";
import { useStore } from "@/store/store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang" },
  { code: "UB", name: "Universitas Brawijaya" },
  { code: "UM", name: "Universitas Negeri Malang" },
];

const EMOJI_PRESET = ["🍜", "🍳", "🍗", "☕", "🍚", "🥘", "🍔", "🍱", "🧋", "🍡"];
const FILTERS = ["⭐ Rating Tertinggi", "💸 Penyelamat Akhir Bulan", "🍚 Porsi Kuli", "🔌 Spot Nugas", "🅿️ Bebas Parkir"];

const createMarkerIcon = (emoji: string) => L.divIcon({
  className: '',
  html: `<div class="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl shadow-xl">${emoji || '🍜'}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export const AdminPanel = memo(function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "data" | "add" | "promo">("overview");

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={spring}
      className="scroll-smooth-y no-scrollbar absolute inset-0 z-50 flex flex-col h-[100dvh] bg-[#f8f9fa] text-gray-900"
    >
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-white shadow-sm z-10">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="rounded-full bg-gray-100 p-2 text-gray-600">
          <ArrowLeft size={18} />
        </motion.button>
        <div className="flex-1">
          <div className="text-xl tracking-tight text-[#1a1f4d]" style={{fontWeight:800}}>Nakam Admin</div>
          <div className="text-xs text-gray-500 font-medium">Dashboard Control Center</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-2 pt-2 border-b border-gray-200 overflow-x-auto no-scrollbar shadow-sm z-10">
        <TabButton id="overview" active={activeTab} setActive={setActiveTab} icon={<LayoutDashboard size={16}/>} label="Overview" />
        <TabButton id="data" active={activeTab} setActive={setActiveTab} icon={<Database size={16}/>} label="Data Mitra" />
        <TabButton id="add" active={activeTab} setActive={setActiveTab} icon={<PlusCircle size={16}/>} label="Tambah" />
        <TabButton id="promo" active={activeTab} setActive={setActiveTab} icon={<Megaphone size={16}/>} label="Promo" />
      </div>

      <div className="flex-1 overflow-y-auto relative bg-[#f8f9fa]">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && <TabOverview key="overview" />}
          {activeTab === "data" && <TabData key="data" />}
          {activeTab === "add" && <TabAdd key="add" />}
          {activeTab === "promo" && <TabPromo key="promo" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TabButton({ id, active, setActive, icon, label }: any) {
  const isActive = active === id;
  return (
    <button onClick={() => setActive(id)} className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors whitespace-nowrap ${isActive ? "text-[#FF6B1A]" : "text-gray-500 hover:text-gray-700"}`}>
      {icon} {label}
      {isActive && <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B1A] rounded-t-full" />}
    </button>
  );
}

function TabOverview() {
  const [stats, setStats] = useState({ total: 0, umm: 0, ub: 0, um: 0 });

  useEffect(() => {
    fetchAllEateriesForAdmin().then(res => {
      if (res) {
        setStats({
          total: res.length,
          umm: res.filter(e => e.campus === "UMM").length,
          ub: res.filter(e => e.campus === "UB").length,
          um: res.filter(e => e.campus === "UM").length,
        });
      }
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="text-3xl text-[#1a1f4d] mb-1" style={{fontWeight:800}}>{stats.total}</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Mitra</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="text-3xl text-emerald-600 mb-1" style={{fontWeight:800}}>24k+</div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Users</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Sebaran Mitra Kampus</h3>
        <div className="space-y-4">
          <CampusStatBar label="UMM" count={stats.umm} max={stats.total || 1} color="bg-red-500" />
          <CampusStatBar label="UB" count={stats.ub} max={stats.total || 1} color="bg-blue-500" />
          <CampusStatBar label="UM" count={stats.um} max={stats.total || 1} color="bg-yellow-500" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1a1f4d] to-blue-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-1">Performa Baik! 🚀</h3>
          <p className="text-xs text-white/70">Aplikasi berjalan lancar tanpa kendala server.</p>
        </div>
        <div className="absolute -right-4 -bottom-4 text-white/10">
          <LayoutDashboard size={100} />
        </div>
      </div>
    </motion.div>
  );
}

function CampusStatBar({ label, count, max, color }: any) {
  const pct = Math.max(5, (count / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5">
        <span>{label}</span>
        <span>{count} Mitra</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 }} className={`h-full ${color} rounded-full`} />
      </div>
    </div>
  );
});

function TabData() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAllEateriesForAdmin().then(res => {
      if (res) setData(res);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Hapus warung ini dari database?")) {
      await deleteEateryByAdmin(id);
      load();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 pb-20 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Daftar Warung (Publik)</h2>
        <button onClick={load} className="text-xs text-[#FF6B1A] font-bold">Refresh</button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : data.length === 0 ? (
        <div className="text-center text-sm text-gray-500 py-10">Tidak ada data.</div>
      ) : (
        <div className="space-y-3">
          {data.map(e => (
            <div key={e.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">{e.emoji || "🍜"}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-900 leading-tight" style={{fontWeight:800}}>{e.name}</div>
                <div className="text-xs text-gray-500 font-medium">{e.campus} • {e.price_range}</div>
              </div>
              <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TabAdd() {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍜");
  const [campus, setCampus] = useState("UMM");
  const [price, setPrice] = useState("10k - 25k");
  const [lat, setLat] = useState(-7.9213);
  const [lng, setLng] = useState(112.5990);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [menus, setMenus] = useState<{name: string; price: number; emoji: string}[]>([]);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuEmoji, setNewMenuEmoji] = useState("🍽️");
  const MENU_EMOJIS = ["🍽️", "🍜", "🍚", "🍲", "🍗", "🥩", "🍔", "🍕", "🌭", "🥪", "🌮", "🌯", "🥗", "🍨", "🍩", "🍰", "☕", "🧋", "🍹", "🥤"];
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddMenu = () => {
    if (!newMenuName || !newMenuPrice) return;
    setMenus([...menus, { name: newMenuName, price: parseInt(newMenuPrice.replace(/\D/g, "") || "0"), emoji: newMenuEmoji }]);
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuEmoji("🍽️");
  };

  const handleRemoveMenu = (index: number) => {
    setMenus(menus.filter((_, i) => i !== index));
  };

  function LocationMarker() {
    useMapEvents({ click(e) { setLat(e.latlng.lat); setLng(e.latlng.lng); } });
    return <Marker position={[lat, lng]} icon={createMarkerIcon(emoji)} />;
  }

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    map.flyTo(center, map.getZoom());
    return null;
  }

  const toggleFilter = (f: string) => {
    setSelectedFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = async () => {
    if (!name || name.length < 3) return;
    setLoading(true);
    let imageUrl = "";
    if (imageFile) {
      const url = await uploadImageToSupabase(imageFile);
      if (url) imageUrl = url;
    }
    const ok = await adminAddEatery({ name, campus, emoji, price, lat, lng, image: imageUrl, filters: selectedFilters, menus });
    setLoading(false);
    if (ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setSelectedFilters([]);
        setImageFile(null);
        setImagePreview(null);
        setMenus([]);
      }, 2000);
    } else {
      alert("Gagal menyimpan ke database.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 pb-24 space-y-6">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-bold text-[#FF6B1A]">1. Identitas Toko</h2>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 w-1/3">
            <label className="text-xs text-gray-500 font-bold">Ikon</label>
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xl outline-none">
              {EMOJI_PRESET.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-2/3">
            <label className="text-xs text-gray-500 font-bold">Nama Warung</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Misal: Warkop Pak Man" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none font-bold text-gray-900" />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-bold">Gambar Cover (Opsional)</label>
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 rounded-full bg-white p-1.5 shadow">
                  <Check className="text-green-500" size={16} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-4 text-gray-400 hover:text-gray-600 transition-colors">
                <ImageIcon size={24} />
                <span className="text-xs font-bold">Pilih File dari Galeri</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                  }
                }} />
              </label>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-bold">Range Harga</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Misal: 10k - 25k" className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none font-bold text-gray-900" />
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-bold text-[#FF6B1A]">2. Menu & Harga</h2>
        <div className="space-y-3">
          {menus.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-xl">{m.emoji}</div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{m.name}</div>
                  <div className="text-xs font-bold text-[#FF6B1A]">Rp {m.price.toLocaleString("id-ID")}</div>
                </div>
              </div>
              <button onClick={() => handleRemoveMenu(i)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          <div className="flex flex-col gap-3 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="flex gap-2">
              <select value={newMenuEmoji} onChange={(e) => setNewMenuEmoji(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-lg outline-none w-1/4">
                {MENU_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
              <input value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} placeholder="Nama Menu" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none font-bold text-gray-900 flex-1" />
            </div>
            <div className="flex gap-2">
              <input value={newMenuPrice} onChange={(e) => setNewMenuPrice(e.target.value)} placeholder="Harga (Misal: 15000)" type="number" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none font-bold text-gray-900 flex-1" />
              <button onClick={handleAddMenu} className="px-4 py-2 bg-[#1a1f4d] text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-blue-900 transition-colors">Tambah</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-bold text-[#FF6B1A]">3. Label & Filter Khusus</h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = selectedFilters.includes(f);
            return (
              <button
                key={f} onClick={() => toggleFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all border ${active ? "bg-[#FF6B1A] text-white border-[#FF6B1A]" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-sm font-bold text-[#FF6B1A]">4. Area & Lokasi</h2>
        <div className="flex gap-2">
          {CAMPUSES.map((c) => (
            <button key={c.code} onClick={() => setCampus(c.code)} className={`flex-1 rounded-xl border p-3 text-center transition-all ${campus === c.code ? "border-[#FF6B1A] bg-orange-50 text-[#FF6B1A]" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
              <div className="text-sm font-bold">{c.code}</div>
            </button>
          ))}
        </div>
        <div className="h-48 w-full rounded-2xl overflow-hidden border border-gray-200 relative z-0">
          <MapContainer center={[lat, lng]} zoom={16} zoomControl={false} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <LocationMarker />
            <MapUpdater center={[lat, lng]} />
          </MapContainer>
          <div className="absolute top-2 left-2 right-2 z-[400] rounded-xl bg-white/90 backdrop-blur shadow p-2 text-center text-xs font-bold text-gray-800">Ketuk peta untuk geser Pin</div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }} disabled={loading || !name} onClick={handleSave}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-xl transition-all ${
          success ? "bg-emerald-500 text-white" : loading || !name ? "bg-gray-300 text-gray-500" : "bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] text-white"
        }`}
      >
        {loading ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : success ? <><Check size={18} /> Tersimpan!</> : <><Store size={18} /> Daftarkan Warung Publik</>}
      </motion.button>
    </motion.div>
  );
}

function TabPromo() {
  const { globalPromo, setGlobalPromo } = useStore();
  const [val, setVal] = useState(globalPromo);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setGlobalPromo(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-5 space-y-4">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Pesan Broadcast Global</h2>
        <p className="text-xs text-gray-500 mb-4 font-medium">Pesan ini akan muncul di bagian paling atas aplikasi untuk seluruh pengguna Nakam. Kosongkan jika tidak ada promo.</p>
        <textarea
          value={val} onChange={(e) => setVal(e.target.value)} placeholder="Contoh: Diskon 50% di Warkop Pak Man spesial Hari Ini!"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm outline-none font-bold text-gray-800 min-h-[120px] mb-4"
        />
        <button onClick={save} className="w-full py-3 rounded-xl bg-[#1a1f4d] text-white font-bold hover:bg-blue-900 transition-colors">
          {saved ? "Berhasil Disimpan!" : "Terapkan Broadcast"}
        </button>
      </div>

      {val && (
        <div className="p-4 bg-orange-50 border border-[#FF6B1A]/20 rounded-2xl">
          <div className="text-xs font-bold text-[#FF6B1A] mb-1">Live Preview</div>
          <div className="text-sm text-gray-800 font-medium">📢 {val}</div>
        </div>
      )}
    </motion.div>
  );
}
