import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, User, MapPin, Dice5, Wallet, Eye, EyeOff, ChevronDown, Check, X,
  Navigation, Footprints, Bike, Car, Clock, Loader2, Maximize2, Minimize2, Star, ChevronRight, Megaphone,
  UtensilsCrossed, Trophy, PlugZap, ParkingCircle, MoreHorizontal, TrendingUp, Sparkles
} from "lucide-react";
import { EateryDetail } from "@/components/EateryDetail";
import { Navigator } from "@/pages/Navigator";
import { useStore, fmtRp } from "@/store/store";
import { EATERIES_BY_CAMPUS } from "@/data/mockData";
import { fetchEateriesFromSupabase } from "@/services/supabaseData";
import { NakamLogo } from "@/components/Logo";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const createMarkerIcon = (isMine: boolean, emoji: string) => {
  return L.divIcon({
    className: '',
    html: isMine 
      ? `<div class="relative"><span class="absolute inset-0 -m-2 animate-ping rounded-full bg-emerald-400/40"></span><div class="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl shadow-xl">${emoji || '🍜'}</div><div class="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] text-white shadow" style="font-weight:700">TOKOMU</div></div>`
      : `<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#1a1f4d] text-white shadow-xl"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const userIcon = L.divIcon({
  className: '',
  html: `<div class="relative"><span class="absolute inset-0 -m-4 animate-ping rounded-full bg-blue-500/30"></span><span class="absolute inset-0 -m-2 rounded-full bg-blue-500/20"></span><div class="relative h-6 w-6 rounded-full border-[3px] border-white bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] flex items-center justify-center"><div class="h-2 w-2 bg-white rounded-full"></div></div><div class="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-500 px-2 py-0.5 text-[9px] text-white shadow" style="font-weight:700">KAMU</div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapUpdater({ center, zoom, bounds }: { center?: [number, number], zoom?: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
    } else if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
    }
  }, [center, zoom, bounds, map]);
  return null;
}

const FILTERS = ["⭐ Rating Tertinggi", "💸 Penyelamat Akhir Bulan", "🍚 Porsi Kuli", "🔌 Spot Nugas", "🅿️ Bebas Parkir"];

const SERVICE_CATEGORIES = [
  { id: "hemat", label: "Hemat", filterKey: "💸 Penyelamat Akhir Bulan", badge: "MURAH!", badgeColor: "bg-red-500", gradient: "from-emerald-400 to-emerald-600", emoji: "💰", icon: Wallet },
  { id: "porsi", label: "Porsi Banyak", filterKey: "🍚 Porsi Kuli", badge: "JUMBO", badgeColor: "bg-orange-500", gradient: "from-amber-400 to-orange-500", emoji: "🍚", icon: UtensilsCrossed },
  { id: "topstar", label: "Topstar", filterKey: "⭐ Rating Tertinggi", badge: "TOP!", badgeColor: "bg-yellow-500", gradient: "from-yellow-400 to-amber-500", emoji: "⭐", icon: Trophy },
  { id: "nugas", label: "Spot Nugas", filterKey: "🔌 Spot Nugas", badge: "WIFI", badgeColor: "bg-blue-500", gradient: "from-blue-400 to-indigo-500", emoji: "🔌", icon: PlugZap },
  { id: "parkir", label: "Bebas Parkir", filterKey: "🅿️ Bebas Parkir", badge: "FREE", badgeColor: "bg-purple-500", gradient: "from-purple-400 to-violet-600", emoji: "🅿️", icon: ParkingCircle },
  { id: "trending", label: "Trending", filterKey: null, badge: "HOT", badgeColor: "bg-pink-500", gradient: "from-pink-400 to-rose-500", emoji: "🔥", icon: TrendingUp },
  { id: "promo", label: "Promo Hari Ini", filterKey: null, badge: "BARU", badgeColor: "bg-teal-500", gradient: "from-teal-400 to-cyan-500", emoji: "🎉", icon: Sparkles },
  { id: "lainnya", label: "Lainnya", filterKey: null, badge: null, badgeColor: "", gradient: "from-gray-300 to-gray-400", emoji: "📋", icon: MoreHorizontal },
];
const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang", students: "30k+" },
  { code: "UB", name: "Universitas Brawijaya", students: "60k+" },
  { code: "UM", name: "Universitas Negeri Malang", students: "25k+" },
];

export const HomeMap = memo(function HomeMap({ onOpenProfile, onOpenWallet }: { onOpenProfile: () => void; onOpenWallet: () => void; }) {
  const [selected, setSelected] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusLoading, setCampusLoading] = useState(false);
  
  const [navTarget, setNavTarget] = useState<any>(null);
  const [routeTarget, setRouteTarget] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<"walk" | "bike" | "car">("bike");
  const [routeData, setRouteData] = useState<{ path: [number, number][], dist: number, dur: number } | null>(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showAllSidebar, setShowAllSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [userPos, setUserPos] = useState({ lat: -7.9213, lng: 112.5990 }); // Default UMM
  const { campus, setCampus, hideBalance, budget, spent, merchant, globalPromo } = useStore();
  const [supabaseEateries, setSupabaseEateries] = useState<any[] | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEateriesFromSupabase(campus).then((data) => {
      if (!cancelled && data && data.length > 0) setSupabaseEateries(data);
      else if (!cancelled) setSupabaseEateries(null);
    });
    return () => { cancelled = true; };
  }, [campus]);

  // Real Map Routing Effect via OSRM
  useEffect(() => {
    if (!routeTarget && !navTarget) {
      setRouteData(null);
      return;
    }

    const target = routeTarget || navTarget;
    const fetchRoute = async () => {
      setFetchingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
          
          const dist = route.distance; // meters
          const speeds = { walk: 5, bike: 25, car: 35 }; // km/h
          const dur = (dist / 1000) / speeds[routeMode as 'walk'|'bike'|'car'] * 3600;

          setRouteData({
            path: coords,
            dist: dist,
            dur: dur
          });
        }
      } catch (err) {
        console.error("OSRM Route Error:", err);
      } finally {
        setFetchingRoute(false);
      }
    };
    
    fetchRoute();
  }, [routeTarget, navTarget, routeMode, userPos.lat, userPos.lng]);

  const merchantEatery = merchant.onboarded && merchant.campus === campus ? {
    id: "merchant-self",
    name: merchant.name,
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
    walk: "kamu",
    dominance: 50,
    price: merchant.price,
    lat: merchant.lat,
    lng: merchant.lng,
    isMine: true,
    emoji: merchant.emoji,
    rating: "Baru"
  } : null;

  let eateries = [
    ...(merchantEatery ? [merchantEatery] : []),
    ...(supabaseEateries || EATERIES_BY_CAMPUS[campus] || [])
  ];

  if (activeFilter) {
    eateries = eateries.filter(e => e.filter?.includes(activeFilter));
  }
  if (searchQuery) {
    eateries = eateries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  const switchCampus = (c: string) => {
    setCampusOpen(false);
    setCampusLoading(true);
    setTimeout(() => {
      setCampus(c);
      setCampusLoading(false);
      setSelected(null);
      setRouteTarget(null);
      setNavTarget(null);
    }, 900);
  };

  const remaining = budget - spent;
  const lowBalance = remaining / budget < 0.15;

  let mapBounds: L.LatLngBoundsExpression | undefined = undefined;
  if (routeData && routeData.path.length > 0) {
    mapBounds = L.latLngBounds(routeData.path);
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#E8EEF4] p-4 sm:p-6 md:p-8 flex flex-col md:grid md:grid-cols-[420px_1fr] md:grid-rows-[auto_minmax(0,1fr)] gap-4 md:gap-6">
      
      {/* Header Panel */}
      <div className={`md:col-start-1 md:row-start-1 w-full z-10 shrink-0 transition-opacity duration-300 ${(isMapExpanded || navTarget) ? 'opacity-0 pointer-events-none hidden md:block' : 'opacity-100 order-1 md:order-none'}`}>
        
        {/* Header Card */}
        <div className="bg-white/90 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-white/50 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <NakamLogo size={32} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setCampusOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-gray-100/80 px-3 py-2 shadow-sm border border-gray-200 hover:bg-gray-200/50 transition-colors"
              >
                <span className="text-sm">📍</span>
                <span className="text-xs text-gray-800" style={{ fontWeight: 800 }}>{campus}</span>
                <ChevronDown size={14} className="text-gray-500" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onOpenWallet}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 shadow-sm border border-gray-200 transition-colors ${lowBalance ? "bg-red-50 hover:bg-red-100" : "bg-gray-100/80 hover:bg-gray-200/50"}`}
              >
                <Wallet size={14} className={lowBalance ? "text-red-500" : "text-[#FF6B1A]"} />
                <span className="text-xs" style={{fontWeight:800, color: lowBalance ? "#ef4444" : "#1f2937"}}>
                  {hideBalance ? "••••" : "Rp " + (remaining / 1000).toFixed(0) + "k"}
                </span>
              </motion.button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenProfile} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/80 shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-200/50 transition-colors">
                <User size={16} />
              </motion.button>
            </div>
          </div>

          {/* Promo Banner */}
          {globalPromo && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-xl p-3 flex gap-3 items-center shadow-sm">
              <div className="bg-[#FF6B1A] text-white rounded-full p-1.5"><Megaphone size={14}/></div>
              <p className="text-xs text-orange-900 font-bold flex-1">{globalPromo}</p>
            </motion.div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-inner">
            <Search size={18} className="text-gray-400" />
            <input 
              placeholder="Cari warkop, ayam geprek..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 text-gray-800" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
            <div className="h-4 w-px bg-gray-200" />
            <MapPin size={18} className="text-[#FF6B1A]" />
          </div>

          {/* Gojek-style Service Grid */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {SERVICE_CATEGORIES.map((cat, index) => {
              const isActive = activeFilter === cat.filterKey;
              const IconComp = cat.icon;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  onClick={() => {
                    if (cat.filterKey) setActiveFilter(isActive ? null : cat.filterKey);
                  }}
                  className="flex flex-col items-center gap-1.5 relative group"
                >
                  {/* Badge */}
                  {cat.badge && (
                    <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 ${cat.badgeColor} text-white text-[8px] px-1.5 py-[1px] rounded-md shadow-md`} style={{ fontWeight: 800, letterSpacing: '0.02em' }}>
                      {cat.badge}
                    </div>
                  )}
                  {/* Icon Circle */}
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} shadow-lg transition-all duration-200 ${
                    isActive ? "ring-[3px] ring-[#FF6B1A] ring-offset-2 shadow-xl scale-105" : "group-hover:shadow-xl"
                  }`}>
                    <IconComp size={24} className="text-white drop-shadow-sm" strokeWidth={2.5} />
                    <span className="absolute -bottom-0.5 -right-0.5 text-lg drop-shadow-md">{cat.emoji}</span>
                  </div>
                  {/* Label */}
                  <span className={`text-[10px] leading-tight text-center max-w-[56px] transition-colors ${
                    isActive ? "text-[#FF6B1A]" : "text-gray-600 group-hover:text-gray-900"
                  }`} style={{ fontWeight: isActive ? 800 : 600 }}>
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Map Card */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`md:col-start-2 md:row-span-2 relative shrink-0 w-full h-[240px] md:h-full bg-gray-200 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 md:border-[6px] border-white transition-all duration-300 ${(isMapExpanded || navTarget) ? '!fixed !inset-4 sm:!inset-6 md:!inset-8 z-50' : 'z-0 order-2 md:order-none'}`}
      >
        {useMemo(() => (
          <MapContainer center={[userPos.lat, userPos.lng]} zoom={15} zoomControl={false} className="h-full w-full" style={{ background: '#E8EEF4' }}>
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />
            
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />

            {eateries.map((e: any) => (
              <Marker 
                key={e.id} 
                position={[e.lat, e.lng]} 
                icon={createMarkerIcon(e.isMine, e.emoji)}
                eventHandlers={{ click: () => { setSelected(e); setRouteTarget(null); } }}
              />
            ))}

            {routeData && (
              <Polyline 
                positions={routeData.path} 
                color="#3B82F6" 
                weight={5} 
                opacity={0.8}
                lineCap="round"
                lineJoin="round"
              />
            )}

            <MapUpdater 
              center={selected ? [selected.lat, selected.lng] : (!mapBounds ? [userPos.lat, userPos.lng] : undefined)} 
              bounds={mapBounds} 
              zoom={(isMapExpanded || navTarget) ? 16 : 15}
            />
          </MapContainer>
        ), [userPos.lat, userPos.lng, eateries, routeData, selected, mapBounds, isMapExpanded, navTarget])}

        {/* Skeleton overlay during campus switch */}
        <AnimatePresence>
          {campusLoading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-white/70 backdrop-blur-md"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF6B1A] border-t-transparent shadow-lg" />
                <div className="text-sm text-gray-700" style={{fontWeight:800}}>Memuat Area...</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-lg backdrop-blur text-gray-700 border border-white hover:bg-white transition-colors"
          >
            {isMapExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Nearby Eateries List Card */}
      <div className={`md:col-start-1 md:row-start-2 flex flex-col overflow-hidden w-full bg-white/90 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-white/50 relative z-10 transition-opacity duration-300 ${(isMapExpanded || navTarget) ? 'opacity-0 pointer-events-none hidden md:flex' : 'opacity-100 order-3 md:order-none flex-1'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg tracking-tight text-gray-900" style={{fontWeight: 800}}>Terdekat dari Kamu</h3>
          <button onClick={() => setShowAllSidebar(true)} className="text-xs text-[#FF6B1A] flex items-center gap-1 hover:underline" style={{fontWeight: 700}}>
            Lihat Semua <ChevronRight size={14}/>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
          {eateries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <Dice5 size={48} className="mb-2 text-gray-400" />
              <p className="text-sm font-medium">Tidak ada hasil ditemukan.</p>
            </div>
          ) : (
            eateries.slice(0, 4).map((e) => (
              <motion.div 
                key={e.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelected(e); setRouteTarget(null); }}
                className="flex gap-3 p-2 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <img src={e.image} alt={e.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 py-1">
                  <h4 className="text-sm text-gray-900 leading-tight mb-1" style={{fontWeight: 800}}>{e.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5" style={{fontWeight: 600}}>
                    <span className="flex items-center gap-0.5 text-[#FF8C42]"><Star size={12} fill="currentColor" /> {e.dominance || 80}%</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Footprints size={12}/> {e.walk}</span>
                  </div>
                  <div className="text-xs text-gray-800 bg-gray-100 inline-block px-2 py-0.5 rounded-lg font-medium">{e.price}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Floating Sidebar for "Show All" */}
      <AnimatePresence>
        {showAllSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowAllSidebar(false)} 
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[420px] bg-white shadow-[20px_0_50px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white">
                <div>
                  <h2 className="text-2xl text-gray-900 tracking-tight" style={{fontWeight: 800}}>Semua Tempat</h2>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{eateries.length} tempat di sekitarmu</p>
                </div>
                <button onClick={() => setShowAllSidebar(false)} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors">
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 no-scrollbar">
                {eateries.map((e) => (
                  <motion.div 
                    key={e.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelected(e); setRouteTarget(null); setShowAllSidebar(false); }}
                    className="flex gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <img src={e.image} alt={e.name} className="w-24 h-24 rounded-xl object-cover" />
                    <div className="flex-1 py-1">
                      <h4 className="text-base text-gray-900 leading-tight mb-1" style={{fontWeight: 800}}>{e.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2" style={{fontWeight: 600}}>
                        <span className="flex items-center gap-0.5 text-[#FF8C42]"><Star size={14} fill="currentColor" /> {e.dominance || 80}%</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Footprints size={14}/> {e.walk}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {e.filter?.map((f: string) => <span key={f} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-medium">{f.replace(/[^a-zA-Z\s]/g, '').trim()}</span>)}
                      </div>
                      <div className="text-xs text-gray-800 bg-gray-100 inline-block px-2 py-1 rounded-lg font-bold">{e.price}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <EateryDetail
            eatery={selected}
            onClose={() => setSelected(null)}
            onRoute={() => { setRouteTarget(selected); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {routeTarget && (
          <RouteInfoCard 
            target={routeTarget} 
            mode={routeMode}
            setMode={setRouteMode}
            routeData={routeData}
            fetching={fetchingRoute}
            onClose={() => { setRouteTarget(null); setRouteData(null); }} 
            onStart={() => { setNavTarget(routeTarget); setRouteTarget(null); }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {navTarget && (
          <Navigator
            target={navTarget}
            routeData={routeData}
            onCancel={() => { setNavTarget(null); setRouteData(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {campusOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setCampusOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
              className="absolute bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-white p-6 shadow-2xl md:max-w-md md:mx-auto md:bottom-1/2 md:translate-y-1/2 md:rounded-3xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl tracking-tight" style={{fontWeight:800}}>Pilih Area Kampus</h3>
                  <p className="text-xs text-gray-500">Sesuaikan dengan lokasimu sekarang.</p>
                </div>
                <button onClick={() => setCampusOpen(false)} className="rounded-full bg-gray-100 p-2 text-gray-600"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                {CAMPUSES.map((c) => (
                  <motion.button
                    key={c.code} whileTap={{scale:0.98}} onClick={() => switchCampus(c.code)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 transition-colors ${campus === c.code ? "border-[#FF6B1A] bg-orange-50 shadow-inner" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] text-white text-sm" style={{fontWeight:800}}>
                      {c.code}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm text-gray-900" style={{fontWeight:800}}>{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.students} mahasiswa</div>
                    </div>
                    {campus === c.code && <div className="h-6 w-6 rounded-full bg-[#FF6B1A] text-white flex items-center justify-center shadow-md"><Check size={14} /></div>}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function RouteInfoCard({ target, mode, setMode, routeData, fetching, onClose, onStart }: any) {
  const modes = [
    { k: "walk" as const, l: "Jalan", i: <Footprints size={14} /> },
    { k: "bike" as const, l: "Motor", i: <Bike size={14} /> },
    { k: "car" as const, l: "Mobil", i: <Car size={14} /> },
  ];

  const distKm = routeData ? (routeData.dist / 1000).toFixed(1) : "-";
  const mins = routeData ? Math.max(1, Math.round(routeData.dur / 60)) : "-";

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={spring}
      className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl border-t border-gray-200 bg-white p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:max-w-md md:left-auto md:right-8 md:bottom-8 md:rounded-3xl"
    >
      <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300 md:hidden" />
      
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-[#FF6B1A] text-white shadow-lg">
          <Navigation size={24} />
        </div>
        <div className="flex-1 pt-1">
          <div className="text-[10px] uppercase tracking-widest text-blue-600" style={{fontWeight:800}}>Rute Pilihan</div>
          <div className="text-xl tracking-tight text-gray-900" style={{fontWeight:800}}>{target.name}</div>
        </div>
        <button onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"><X size={16} /></button>
      </div>

      <div className="mt-5 flex gap-2 rounded-2xl bg-gray-100 p-1.5 shadow-inner">
        {modes.map((m) => {
          const active = mode === m.k;
          return (
            <button key={m.k} onClick={() => setMode(m.k)} className={`relative flex-1 rounded-xl py-2.5 text-xs ${active ? "text-white" : "text-gray-600 hover:bg-gray-200/50"}`} style={{fontWeight:800}}>
              {active && <motion.div layoutId="modeb" transition={spring} className="absolute inset-0 rounded-xl bg-[#1a1f4d] shadow-md" />}
              <span className="relative flex items-center justify-center gap-1.5">{m.i}{m.l}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider" style={{fontWeight:700}}>Jarak Aktual</div>
          <div className="mt-0.5 text-xl text-gray-900 flex items-center justify-center gap-2" style={{fontWeight:800}}>
            {fetching ? <Loader2 size={16} className="animate-spin text-gray-400" /> : `${distKm} km`}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider" style={{fontWeight:700}}>Estimasi Waktu</div>
          <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xl text-emerald-600" style={{fontWeight:800}}>
            {fetching ? <Loader2 size={16} className="animate-spin text-emerald-400" /> : <><Clock size={16} /> {mins} mnt</>}
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{scale:0.97}} onClick={onStart} disabled={fetching || !routeData}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-white shadow-xl transition-opacity ${fetching || !routeData ? "opacity-50 bg-gray-400" : "bg-gradient-to-r from-[#1a1f4d] to-blue-900"}`}
        style={{fontWeight:800}}
      >
        <Navigation size={18} /> {fetching ? "Mencari Rute Terbaik..." : "Mulai Navigasi"}
      </motion.button>
    </motion.div>
  );
});
