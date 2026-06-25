import { useState, useMemo, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, MapPin, Star, Sparkles, SlidersHorizontal, Bell, Zap, Dice5,
  ChevronRight, TrendingUp, Clock, UtensilsCrossed, Coffee, Flame, BadgePercent,
  ArrowRight, Timer, Store, Wallet,
} from "lucide-react";
import { useStore, fmtRp } from "@/store/store";
import { EATERIES_BY_CAMPUS } from "@/data/mockData";
import { FilterModal } from "@/components/FilterModal";
import type { FilterOptions } from "@/components/FilterModal";
import { TerserahRoulette } from "@/components/TerserahRoulette";
import { fetchEateriesFromSupabase } from "@/services/supabaseData";

// ─── Category Config ───
const SERVICE_CATEGORIES = [
  { id: "aneka_nasi", label: "Aneka Nasi", emoji: "🍚", filterKey: "nasi" },
  { id: "ayam_bebek", label: "Ayam & Bebek", emoji: "🍗", filterKey: "ayam" },
  { id: "bakso_soto", label: "Bakso & Soto", emoji: "🍲", filterKey: "bakso" },
  { id: "mie", label: "Mie", emoji: "🍜", filterKey: "mie" },
  { id: "cepat_saji", label: "Cepat Saji", emoji: "⚡", filterKey: "cepat saji" },
  { id: "jajanan", label: "Jajanan", emoji: "🧁", filterKey: "jajanan" },
  { id: "roti_kue", label: "Roti & Kue", emoji: "🍰", filterKey: "roti" },
  { id: "minuman", label: "Minuman", emoji: "🧃", filterKey: "minuman" },
  { id: "western", label: "Western", emoji: "🍔", filterKey: "western" },
  { id: "chinese", label: "Chinese", emoji: "🥡", filterKey: "chinese" },
  { id: "jepang", label: "Jepang", emoji: "🍣", filterKey: "jepang" },
  { id: "korea", label: "Korea", emoji: "🥘", filterKey: "korea" },
];

// ─── Promo Banner Data ───
const PROMO_BANNERS = [
  {
    id: "promo1",
    title: "Diskon spesial",
    highlight: "45%",
    subtitle: "untuk mahasiswa baru",
    cta: "Klaim Voucher",
    gradient: "from-orange-600 via-red-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  },
  {
    id: "promo2",
    title: "Gratis ongkir",
    highlight: "0 Rp",
    subtitle: "semua pesanan hari ini",
    cta: "Pesan Sekarang",
    gradient: "from-emerald-600 via-teal-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  },
  {
    id: "promo3",
    title: "Cashback hingga",
    highlight: "30%",
    subtitle: "pakai dompet digital",
    cta: "Lihat Promo",
    gradient: "from-violet-600 via-purple-500 to-fuchsia-600",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
  },
];

// ─── Fun Facts ───
const FOOD_FACTS = [
  { emoji: "🌶️", text: "Makanan pedas mempercepat metabolisme tubuh hingga 8%!" },
  { emoji: "🍜", text: "Indonesia punya 5.300+ jenis makanan tradisional!" },
  { emoji: "☕", text: "Kopi Malang termasuk salah satu yang terbaik di Indonesia." },
  { emoji: "🍚", text: "Rata-rata mahasiswa makan 3x sehari, budget pas-pasan!" },
  { emoji: "🔥", text: "Geprek level 10 setara dengan 100.000 Scoville Heat Units." },
  { emoji: "🧊", text: "Es teh termasuk minuman paling dicari di warung kampus." },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat Pagi";
  if (h < 15) return "Selamat Siang";
  if (h < 18) return "Selamat Sore";
  return "Selamat Malam";
}

function getMealSuggestion(): string {
  const h = new Date().getHours();
  if (h < 10) return "🌅 Sarapan dulu yuk!";
  if (h < 14) return "🍱 Waktunya makan siang!";
  if (h < 17) return "🍵 Snack sore, siapa?";
  if (h < 21) return "🌙 Makan malam menanti!";
  return "🦉 Ngemil malam-malam nih?";
}

export const HomeTab = memo(function HomeTab({ onOpenWallet, onNavigateToEatery, onSeeAllRestaurants }: { onOpenWallet: () => void; onNavigateToEatery?: (eatery: any) => void; onSeeAllRestaurants?: () => void }) {
  const { user, budget, spent, campus, flashPromos, merchant, transactions } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTerserahOpen, setIsTerserahOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ categories: [], minRating: 0, priceRange: "any" });
  const [supabaseEateries, setSupabaseEateries] = useState<any[] | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Supabase data fetch (synced with campus) ───
  useEffect(() => {
    let cancelled = false;
    fetchEateriesFromSupabase(campus).then((data) => {
      if (!cancelled && data && data.length > 0) setSupabaseEateries(data);
      else if (!cancelled) setSupabaseEateries(null);
    });
    return () => { cancelled = true; };
  }, [campus]);

  // ─── Live timer for flash promos ───
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // ─── Auto-scroll promo banner ───
  useEffect(() => {
    bannerInterval.current = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 4000);
    return () => { if (bannerInterval.current) clearInterval(bannerInterval.current); };
  }, []);

  // ─── Flash promos (synced with campus + time) ───
  const activeFlashPromos = useMemo(() => {
    return flashPromos.filter((p) => p.campus === campus && new Date(p.endTime).getTime() > now);
  }, [flashPromos, campus, now]);

  // ─── Build eateries list (synced: merchant + supabase + mock) ───
  const remaining = budget - spent;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  let eateries = useMemo(() => {
    const base = [
      ...(merchant.onboarded && merchant.campus === campus
        ? [{
          id: "merchant-self", name: merchant.name,
          image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
          walk: "kamu", dominance: 50, price: merchant.price,
          lat: merchant.lat, lng: merchant.lng, isMine: true,
          emoji: merchant.emoji, rating: "Baru", menu: merchant.menu,
          tags: [], filter: [],
        }] : []),
      ...(supabaseEateries || EATERIES_BY_CAMPUS[campus] || []),
    ];
    return base;
  }, [merchant, campus, supabaseEateries]);

  // ─── Apply search filter ───
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    eateries = eateries.filter((e) => {
      if (e.name.toLowerCase().includes(q)) return true;
      if (e.menu && e.menu.some((m: any) => m.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }

  // ─── Apply category filter (synced with activeCategory) ───
  if (activeCategory) {
    const cat = SERVICE_CATEGORIES.find((c) => c.id === activeCategory);
    if (cat) {
      const key = cat.filterKey.toLowerCase();
      eateries = eateries.filter((e) => {
        const haystack = [
          e.name,
          ...(e.tags || []),
          ...(e.filter || []),
          ...(e.menu ? e.menu.map((m: any) => m.name) : []),
        ].join(" ").toLowerCase();
        return haystack.includes(key);
      });
    }
  }

  // ─── Apply advanced filters ───
  if (filters.minRating > 0) {
    eateries = eateries.filter((e) => (e.dominance ? e.dominance / 20 : 4.5) >= filters.minRating);
  }
  if (filters.categories.length > 0) {
    eateries = eateries.filter((e) => {
      const eCats = [...(e.tags || []), ...(e.filter || [])].map((t: string) => t.toLowerCase().replace(/[^a-z]/g, ""));
      return filters.categories.some((c) => eCats.some((ec: string) => ec.includes(c.toLowerCase().replace(/[^a-z]/g, ""))));
    });
  }
  if (filters.priceRange !== "any") {
    eateries = eateries.filter((e) => {
      if (!e.price) return true;
      const p = e.price.toLowerCase();
      if (filters.priceRange === "cheap") return p.includes("5k") || p.includes("8k") || p.includes("10k") || p.includes("12k");
      if (filters.priceRange === "mid") return p.includes("15k") || p.includes("20k") || p.includes("25k");
      if (filters.priceRange === "expensive") return p.includes("30k") || p.includes("40k") || p.includes("50k");
      return true;
    });
  }

  // ─── Derived lists ───
  const popular = useMemo(() => {
    return [...eateries].sort((a, b) => (b.dominance || 0) - (a.dominance || 0)).slice(0, 6);
  }, [eateries]);

  const recommended = useMemo(() => {
    // Recommend affordable ones based on remaining budget
    const sorted = [...eateries].sort((a, b) => {
      const aScore = (a.dominance || 50) + (a.price?.includes("10k") || a.price?.includes("8k") ? 20 : 0);
      const bScore = (b.dominance || 50) + (b.price?.includes("10k") || b.price?.includes("8k") ? 20 : 0);
      return bScore - aScore;
    });
    return sorted.slice(0, 4);
  }, [eateries]);

  // ─── Random food fact ───
  const todayFact = useMemo(() => {
    const idx = Math.floor(now / 86400000) % FOOD_FACTS.length;
    return FOOD_FACTS[idx];
  }, [now]);

  // ─── Stats ───
  const totalEateries = eateries.length;
  const totalMenuItems = eateries.reduce((sum, e) => sum + (e.menu?.length || 0), 0);
  const todayTxCount = transactions.filter((t) => t.date === "Baru saja" || t.date === "Hari ini").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] dark:bg-[#0a0e27] pb-24 font-sans text-slate-800 dark:text-slate-200">

      {/* ═══════════ HEADER ═══════════ */}
      <div className="px-6 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatar && user.avatar.length > 2 ? user.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{getGreeting()},</div>
            <div className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{user.name || "Mahasiswa"}!</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-[10px] font-bold text-[#FF6B1A] flex items-center gap-1">
            <MapPin size={10} /> {campus}
          </div>
          <button onClick={() => console.log("Notifikasi dibuka")} className="relative w-10 h-10 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm text-gray-700 dark:text-white border border-gray-100 dark:border-white/10 active:scale-95 transition-transform">
            <Bell size={20} />
            {activeFlashPromos.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{activeFlashPromos.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════ MEAL SUGGESTION STRIP ═══════════ */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-4 py-2.5 rounded-2xl">
          <span className="text-base">{getMealSuggestion().split(" ")[0]}</span>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-1">{getMealSuggestion().substring(getMealSuggestion().indexOf(" ") + 1)}</span>
          <Timer size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-amber-500">
            {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ═══════════ AUTO-SCROLLING PROMO CAROUSEL ═══════════ */}
      <div className="px-6 mb-5">
        <div className="relative rounded-3xl overflow-hidden shadow-lg h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={PROMO_BANNERS[activeBanner].id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={PROMO_BANNERS[activeBanner].image}
                alt="Promo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${PROMO_BANNERS[activeBanner].gradient} opacity-80`} />
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-white text-xl font-bold leading-tight max-w-[220px]">
                    {PROMO_BANNERS[activeBanner].title}{" "}
                    <span className="text-yellow-300 text-2xl">{PROMO_BANNERS[activeBanner].highlight}</span>
                  </h3>
                  <p className="text-white/80 text-xs mt-1 font-medium">{PROMO_BANNERS[activeBanner].subtitle}</p>
                </div>
                <button className="self-start bg-white text-gray-900 font-bold py-2 px-5 rounded-full text-xs shadow-md hover:bg-gray-100 transition-colors active:scale-95">
                  {PROMO_BANNERS[activeBanner].cta}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
            {PROMO_BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeBanner ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ BUDGET CARD (Wallet) ═══════════ */}
      <div className="px-6 mb-5">
        <button
          onClick={onOpenWallet}
          className="w-full bg-white dark:bg-white/5 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B1A] to-orange-400 flex items-center justify-center text-white shadow-sm">
                <Wallet size={18} />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Sisa Budget Bulanan</div>
                <div className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">{fmtRp(remaining)}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-bold ${budgetPct > 80 ? "text-red-500" : budgetPct > 50 ? "text-amber-500" : "text-emerald-500"}`}>
                {budgetPct}% terpakai
              </span>
              <ChevronRight size={16} className="text-gray-400 mt-1" />
            </div>
          </div>
          {/* Budget progress bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${budgetPct > 80 ? "bg-gradient-to-r from-red-400 to-red-500" : budgetPct > 50 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
            <span>Pengeluaran: {fmtRp(spent)}</span>
            <span>Budget: {fmtRp(budget)}</span>
          </div>
        </button>
      </div>

      {/* ═══════════ QUICK STATS STRIP ═══════════ */}
      <div className="px-6 mb-5 grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-[#FF6B1A] mb-1">
            <Store size={14} />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{totalEateries}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Tempat Makan</div>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
            <UtensilsCrossed size={14} />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{totalMenuItems}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Menu Tersedia</div>
        </div>
        <div className="bg-white dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center gap-1 text-violet-500 mb-1">
            <TrendingUp size={14} />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{todayTxCount}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Transaksi Hari Ini</div>
        </div>
      </div>

      {/* ═══════════ FLASH PROMOS ═══════════ */}
      {activeFlashPromos.length > 0 && (
        <div className="px-6 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center">
              <Zap size={14} fill="white" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Flash Promo</h2>
            <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full animate-pulse">LIVE</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {activeFlashPromos.map((promo) => {
              const endsIn = Math.max(0, new Date(promo.endTime).getTime() - now);
              const hrs = Math.floor(endsIn / 3600000);
              const mins = Math.floor((endsIn % 3600000) / 60000);
              return (
                <button
                  key={promo.id}
                  onClick={() => {
                    const matchedEatery = eateries.find((e) => e.name === promo.merchantName);
                    if (matchedEatery && onNavigateToEatery) onNavigateToEatery(matchedEatery);
                  }}
                  className="min-w-[260px] text-left flex-shrink-0 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur-sm">{promo.merchantEmoji}</div>
                    <div>
                      <div className="font-bold text-sm">{promo.merchantName}</div>
                      <div className="text-[11px] font-medium opacity-90">{promo.menuEmoji} {promo.menuName}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-sm">
                      <Clock size={12} />
                      {hrs > 0 ? `${hrs}j ` : ""}{mins}m lagi
                    </div>
                    <BadgePercent size={20} className="opacity-60" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════ BINGUNG MAKAN ROULETTE ═══════════ */}
      <div className="px-6 mb-5">
        <button
          onClick={() => setIsTerserahOpen(true)}
          className="w-full relative overflow-hidden rounded-3xl bg-[#121212] text-white p-5 flex items-center justify-between shadow-xl shadow-black/10 active:scale-[0.98] transition-transform group border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B1A]/10 via-transparent to-purple-500/10 group-hover:from-[#FF6B1A]/20 group-hover:to-purple-500/20 transition-all duration-500" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B1A] to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
              <Dice5 size={24} className="text-white group-hover:rotate-180 transition-transform duration-500" />
            </div>
            <div className="text-left">
              <div className="font-black tracking-tight text-lg leading-none mb-1">BINGUNG MAKAN?</div>
              <div className="text-xs text-gray-400 font-medium">Biar takdir yang memilih 🎲</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center relative z-10 group-hover:bg-[#FF6B1A] group-hover:text-white transition-all duration-300">
            <ArrowRight size={18} />
          </div>
        </button>
      </div>

      {/* ═══════════ SEARCH BAR ═══════════ */}
      <div className="px-6 mb-6 flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-white/5 px-4 py-3.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
          <Search size={20} className="text-[#FF6B1A]" />
          <input
            placeholder="Cari tempat makan atau menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 text-gray-800 dark:text-white"
          />
        </div>
        <button onClick={() => setIsFilterOpen(true)} className="w-[52px] h-[52px] flex-shrink-0 bg-[#FF6B1A] rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 active:scale-95 transition-transform">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* ═══════════ CATEGORIES (Working filter) ═══════════ */}
      <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex-1 tracking-tight">Kategori</h2>
            {activeCategory ? (
              <button onClick={() => setActiveCategory(null)} className="text-xs text-[#FF6B1A] font-bold">
                Clear
              </button>
            ) : (
              <button onClick={onSeeAllRestaurants} className="text-xs font-semibold text-[#FF6B1A] hover:text-[#FF8C42] transition-colors">
                Lihat Semua
              </button>
            )}
          </div>
        <div className="flex gap-2.5 overflow-x-auto px-6 pb-2 no-scrollbar">
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`flex flex-col items-center gap-1.5 min-w-[64px] py-2.5 px-2 rounded-2xl text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-[#FF6B1A] text-white border-[#FF6B1A] shadow-md shadow-orange-500/20 scale-105"
                    : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-white/10 hover:border-[#FF6B1A]/40"
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="whitespace-nowrap text-[10px] font-semibold">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════ FOOD FACT ═══════════ */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-r from-sky-50 dark:from-sky-500/10 to-indigo-50 dark:to-indigo-500/10 border border-sky-100 dark:border-sky-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">{todayFact.emoji}</span>
          <div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider mb-0.5">Tahukah Kamu?</div>
            <div className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{todayFact.text}</div>
          </div>
        </div>
      </div>

      {/* ═══════════ REKOMENDASI UNTUKMU ═══════════ */}
      <div className="mb-6">
        <div className="px-6 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <Sparkles size={12} />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Rekomendasi Untukmu</h2>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-3 no-scrollbar">
          {recommended.map((e) => (
            <button
              key={e.id}
              onClick={() => onNavigateToEatery?.(e)}
              className="w-[150px] flex-shrink-0 bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <div className="relative h-[100px]">
                <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-[10px] font-bold text-gray-800 dark:text-white px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Star size={10} fill="#FFB347" className="text-[#FFB347]" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                </div>
                {e.isMine && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">MILIKMU</div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{e.name}</h4>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  <MapPin size={10} className="text-gray-400" />
                  <span className="truncate">{e.walk}</span>
                </div>
                <div className="text-[10px] font-bold text-[#FF6B1A] mt-1">{e.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ EKSPLORASI (NEW) ═══════════ */}
      {!searchQuery && !activeCategory && (
        <div className="mb-6 px-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-pink-100 dark:bg-pink-500/20 text-pink-500 flex items-center justify-center">
              <Store size={12} />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Eksplor Lebih Banyak</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {eateries.slice(0, 10).map((e) => (
              <button
                key={`explore-${e.id}`}
                onClick={() => onNavigateToEatery?.(e)}
                className="flex flex-col text-left bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10 active:scale-[0.98] transition-transform"
              >
                <div className="relative h-28 w-full">
                  <img src={e.image} alt={e.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-[10px] font-bold text-gray-800 dark:text-white px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                    <Star size={10} fill="#FFB347" className="text-[#FFB347]" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{e.name}</h4>
                  <div className="text-[10px] font-bold text-[#FF6B1A] mt-1">{e.price}</div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    <MapPin size={10} className="text-gray-400" />
                    <span className="truncate">{e.walk}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ ALL EATERIES LIST ═══════════ */}
      {(searchQuery || activeCategory) && (
        <div className="px-6 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            Hasil Pencarian {eateries.length > 0 ? `(${eateries.length})` : ""}
          </h2>
          {eateries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <Coffee size={48} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Tidak ditemukan tempat makan.</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci atau kategori lain.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eateries.map((e) => (
                <button
                  key={`search-${e.id}`}
                  onClick={() => onNavigateToEatery?.(e)}
                  className="w-full text-left flex gap-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <img src={e.image} alt={e.name} className="w-[72px] h-[72px] rounded-xl object-cover" />
                  <div className="flex-1 py-0.5 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{e.name}</h4>
                      <div className="flex items-center gap-1 text-[#FFB347] font-bold text-xs">
                        <Star size={12} fill="currentColor" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      <MapPin size={11} className="text-gray-400" />
                      <span className="truncate">{e.price} • {e.walk}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ MODALS ═══════════ */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      <TerserahRoulette
        isOpen={isTerserahOpen}
        eateries={eateries}
        onClose={() => setIsTerserahOpen(false)}
        onAccept={(eatery) => {
          setIsTerserahOpen(false);
          if (onNavigateToEatery) onNavigateToEatery(eatery);
        }}
      />
    </div>
  );
});
