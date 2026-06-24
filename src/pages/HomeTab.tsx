import { useState, useMemo, useEffect, memo } from "react";
import { motion } from "motion/react";
import { Search, MapPin, Star, Sparkles, SlidersHorizontal, Bell, Zap, Dice5 } from "lucide-react";
import { useStore, fmtRp } from "@/store/store";
import { EATERIES_BY_CAMPUS } from "@/data/mockData";
import { FilterModal, FilterOptions } from "@/components/FilterModal";
import { TerserahRoulette } from "@/components/TerserahRoulette";
import { AnimatePresence } from "motion/react";

const SERVICE_CATEGORIES = [
  { id: "aneka_nasi", label: "Aneka Nasi", filterKey: "nasi" },
  { id: "ayam_bebek", label: "Ayam & Bebek", filterKey: "ayam" },
  { id: "bakso_soto", label: "Bakso & Soto", filterKey: "bakso" },
  { id: "mie", label: "Mie", filterKey: "mie" },
  { id: "cepat_saji", label: "Cepat Saji", filterKey: "cepat saji" },
  { id: "jajanan", label: "Jajanan", filterKey: "jajanan" },
  { id: "roti_kue", label: "Roti & Kue", filterKey: "roti" },
  { id: "minuman", label: "Minuman", filterKey: "minuman" },
  { id: "western", label: "Barat (Western)", filterKey: "western" },
  { id: "chinese", label: "Chinese", filterKey: "chinese" },
  { id: "jepang", label: "Jepang", filterKey: "jepang" },
  { id: "korea", label: "Korea", filterKey: "korea" },
];

export const HomeTab = memo(function HomeTab({ onOpenWallet }: { onOpenWallet: () => void }) {
  const { user, budget, spent, campus, flashPromos } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTerserahOpen, setIsTerserahOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ categories: [], minRating: 0, priceRange: "any" });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeFlashPromos = useMemo(() => {
    return flashPromos.filter(p => p.campus === campus && new Date(p.endTime).getTime() > now);
  }, [flashPromos, campus, now]);

  const remaining = budget - spent;
  let eateries = EATERIES_BY_CAMPUS[campus] || [];

  if (searchQuery) {
    eateries = eateries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  if (filters.minRating > 0) {
    eateries = eateries.filter(e => (e.dominance ? e.dominance / 20 : 4.5) >= filters.minRating);
  }
  if (filters.categories.length > 0) {
    eateries = eateries.filter(e => {
      const eCats = [...(e.tags || []), ...(e.filter || [])].map(t => t.toLowerCase().replace(/[^a-z]/g, ''));
      return filters.categories.some(c => eCats.some(ec => ec.includes(c.toLowerCase().replace(/[^a-z]/g, ''))));
    });
  }
  if (filters.priceRange !== "any") {
    eateries = eateries.filter(e => {
      if (!e.price) return true;
      const p = e.price.toLowerCase();
      if (filters.priceRange === "cheap") return p.includes("5k") || p.includes("8k") || p.includes("10k") || p.includes("12k");
      if (filters.priceRange === "mid") return p.includes("15k") || p.includes("20k") || p.includes("25k");
      if (filters.priceRange === "expensive") return p.includes("30k") || p.includes("40k") || p.includes("50k");
      return true;
    });
  }

  const popular = useMemo(() => {
    return [...eateries].sort((a, b) => (b.dominance || 0) - (a.dominance || 0)).slice(0, 4);
  }, [eateries]);

  return useMemo(() => (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-800">
      {/* Header Profile & Notification */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <div className="text-xs text-gray-500 font-medium">Hello,</div>
            <div className="text-xl font-bold tracking-tight text-gray-900">{user.name || "Kate"}!</div>
          </div>
        </div>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-700 border border-gray-100">
          <Bell size={20} />
        </button>
      </div>

      {/* Budget Summary & Promo Card merged to look like reference */}
      <div className="px-6 mb-6">
        <div className="relative rounded-3xl overflow-hidden shadow-lg bg-[#2A2A2A] text-white">
          <img 
            src="/promo-banner.png" 
            alt="Promo" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            onError={(e) => {
              // Fallback to unsplash if local image not found
              e.currentTarget.src = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
          <div className="relative p-6 flex flex-col items-start justify-between min-h-[140px]">
            <div>
              <h3 className="text-2xl font-bold leading-tight max-w-[200px]">Get special discount<br/>up to <span className="text-[#FF6B1A]">45%</span></h3>
            </div>
            <button className="mt-4 bg-[#FF6B1A] text-white font-bold py-2 px-5 rounded-full text-sm shadow-md hover:bg-orange-600 transition-colors">
              Claim voucher
            </button>
          </div>
        </div>
      </div>

      {/* Wallet / Budget quick stats (optional addition since user asked to keep it) */}
      <div className="px-6 mb-6">
        <button 
          onClick={onOpenWallet}
          className="w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B1A]">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium">Sisa Saldo</div>
              <div className="font-bold text-gray-900">{fmtRp(remaining)}</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Flash Promos */}
      {activeFlashPromos.length > 0 && (
        <div className="px-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} className="text-[#FF6B1A] fill-[#FF6B1A]" />
            <h2 className="text-lg font-bold text-gray-900">Flash Promo di Sekitarmu!</h2>
          </div>
          <div className="flex flex-col gap-3">
            {activeFlashPromos.map(promo => {
              const endsIn = Math.max(0, new Date(promo.endTime).getTime() - now);
              const hrs = Math.floor(endsIn / 3600000);
              const mins = Math.floor((endsIn % 3600000) / 60000);
              return (
                <div key={promo.id} className="bg-gradient-to-r from-orange-500 to-[#FF6B1A] rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">{promo.merchantEmoji}</div>
                    <div>
                      <div className="font-bold text-sm">{promo.merchantName}</div>
                      <div className="text-xs font-medium opacity-90 mt-0.5">Spesial: {promo.menuEmoji} {promo.menuName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase opacity-80">Berakhir dalam</div>
                    <div className="text-sm font-bold bg-black/20 px-2 py-1 rounded-lg mt-1 inline-block">
                      {hrs > 0 ? `${hrs}j ` : ''}{mins}m
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terserah Feature Button */}
      <div className="px-6 mb-6">
        <button 
          onClick={() => setIsTerserahOpen(true)}
          className="w-full relative overflow-hidden rounded-3xl bg-[#121212] text-white p-5 flex items-center justify-between shadow-xl shadow-black/10 active:scale-[0.98] transition-transform group border border-white/10"
        >
          {/* Animated background shine */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B1A] to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
              <Dice5 size={24} className="text-white group-hover:rotate-180 transition-transform duration-500" />
            </div>
            <div className="text-left">
              <div className="font-black tracking-tight text-lg leading-none mb-1">BINGUNG MAKAN?</div>
              <div className="text-xs text-gray-400 font-medium">Biar takdir yang memilih (CS2 Style)</div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center relative z-10 group-hover:bg-white group-hover:text-black transition-colors">
            <Sparkles size={18} />
          </div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-8 flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white px-4 py-3.5 rounded-2xl shadow-sm border border-gray-100">
          <Search size={20} className="text-[#FF6B1A]" />
          <input
            placeholder="Restaurant name or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 text-gray-800"
          />
        </div>
        <button onClick={() => setIsFilterOpen(true)} className="w-[52px] h-[52px] flex-shrink-0 bg-[#FF6B1A] rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 active:scale-95 transition-transform">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Categories</h2>
          <button className="text-sm text-gray-400 font-medium hover:text-[#FF6B1A]">See all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 no-scrollbar">
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  isActive 
                    ? "bg-[#FF6B1A] text-white border-[#FF6B1A] shadow-md shadow-orange-500/20" 
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#FF6B1A]/50"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Popular this week */}
      <div className="mb-6">
        <div className="px-6 flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Popular this week</h2>
          <button className="text-sm text-gray-400 font-medium hover:text-[#FF6B1A]">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar snap-x">
          {popular.map((e) => (
            <div key={e.id} className="w-[200px] flex-shrink-0 snap-start">
              <div className="relative h-[240px] rounded-3xl overflow-hidden shadow-sm group">
                <img src={e.image} alt={e.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute top-3 left-3 bg-[#FFB347] text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star size={12} fill="currentColor" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">{e.name}</h3>
                  <div className="text-white/80 text-xs font-medium">Average check: <span className="text-white font-bold">{e.price}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      <TerserahRoulette
        isOpen={isTerserahOpen}
        eateries={EATERIES_BY_CAMPUS[campus] || []}
        onClose={() => setIsTerserahOpen(false)}
        onAccept={(eatery) => {
          setIsTerserahOpen(false);
          // Optional: handle routing to eatery or showing detail
        }}
      />
    </div>
  ), [user, budget, spent, campus, activeFlashPromos, searchQuery, activeCategory, popular, now, isFilterOpen, isTerserahOpen, filters]);
});
// ChevronRight is imported manually here to avoid modifying imports above for simplicity
function ChevronRight({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>;
}
