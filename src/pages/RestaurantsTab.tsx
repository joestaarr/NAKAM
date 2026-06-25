import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, MapPin, Dice5, ChevronDown, Check, X,
  Navigation, Footprints, Bike, Car, Clock, Loader2, Maximize2, Minimize2, Star, SlidersHorizontal, ChevronLeft, Heart
} from "lucide-react";
import { EateryDetail } from "@/components/EateryDetail";
import { Navigator } from "@/pages/Navigator";
import { useStore, fmtRp } from "@/store/store";
import { EATERIES_BY_CAMPUS } from "@/data/mockData";
import { fetchEateriesFromSupabase } from "@/services/supabaseData";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FilterModal } from "@/components/FilterModal";
import type { FilterOptions } from "@/components/FilterModal";

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

const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang", students: "30k+" },
  { code: "UB", name: "Universitas Brawijaya", students: "60k+" },
  { code: "UM", name: "Universitas Negeri Malang", students: "25k+" },
];

export const RestaurantsTab = memo(function RestaurantsTab({ initialRouteTarget, onClearRouteTarget }: { initialRouteTarget?: any, onClearRouteTarget?: () => void }) {
  const [selected, setSelected] = useState<any>(null);
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusLoading, setCampusLoading] = useState(false);
  
  const [navTarget, setNavTarget] = useState<any>(null);
  const [routeTarget, setRouteTarget] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<"walk" | "bike" | "car">("bike");
  const [routeData, setRouteData] = useState<{ path: [number, number][], dist: number, dur: number } | null>(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ categories: [], minRating: 0, priceRange: "any" });

  const [userPos, setUserPos] = useState({ lat: -7.9213, lng: 112.5990 });
  const { campus, setCampus, merchant } = useStore();
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

  useEffect(() => {
    if (initialRouteTarget) {
      setNavTarget(initialRouteTarget);
      if (onClearRouteTarget) onClearRouteTarget();
    }
  }, [initialRouteTarget, onClearRouteTarget]);

  // Routing Effect
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
          
          const dist = route.distance; 
          const speeds = { walk: 5, bike: 25, car: 35 }; 
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
    rating: "Baru",
    menu: merchant.menu,
  } : null;

  let eateries = [
    ...(merchantEatery ? [merchantEatery] : []),
    ...(supabaseEateries || EATERIES_BY_CAMPUS[campus] || [])
  ];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    eateries = eateries.filter(e => {
      if (e.name.toLowerCase().includes(q)) return true;
      if (e.menu && e.menu.some((m: any) => m.name.toLowerCase().includes(q))) return true;
      return false;
    });
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
    // Basic mock price range filtering for demo purposes
    eateries = eateries.filter(e => {
      if (!e.price) return true;
      const p = e.price.toLowerCase();
      if (filters.priceRange === "cheap") return p.includes("5k") || p.includes("8k") || p.includes("10k") || p.includes("12k");
      if (filters.priceRange === "mid") return p.includes("15k") || p.includes("20k") || p.includes("25k");
      if (filters.priceRange === "expensive") return p.includes("30k") || p.includes("40k") || p.includes("50k");
      return true;
    });
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

  let mapBounds: L.LatLngBoundsExpression | undefined = undefined;
  if (routeData && routeData.path.length > 0) {
    mapBounds = L.latLngBounds(routeData.path);
  }

  const isNavMode = !!navTarget;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white pb-24 flex flex-col font-sans">
      
      {/* Header Overlay (always on top) */}
      {!isNavMode && (
        <div className="absolute top-0 left-0 right-0 z-20 pt-12 pb-4 px-6 bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-100">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">List of restaurants</h1>
            <button className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-100">
              <Heart size={20} />
            </button>
          </div>
          
          <div className="mt-6 flex gap-3 pointer-events-auto">
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
        </div>
      )}

      {/* Map Section */}
      <div className={`relative z-10 transition-all duration-500 ${isMapExpanded || isNavMode ? 'flex-1' : 'h-[40dvh] shrink-0'}`}>
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
              eventHandlers={{ click: () => { setSelected(e); setRouteTarget(null); setIsMapExpanded(false); } }}
            />
          ))}
          {routeData && (
            <Polyline positions={routeData.path} color="#3B82F6" weight={5} opacity={0.8} lineCap="round" lineJoin="round" />
          )}
          <MapUpdater 
            center={selected ? [selected.lat, selected.lng] : (!mapBounds ? [userPos.lat, userPos.lng] : undefined)} 
            bounds={mapBounds} 
            zoom={isMapExpanded || isNavMode ? 16 : 15}
          />
        </MapContainer>

        {/* Map Expand Toggle */}
        {!isNavMode && (
          <div className="absolute bottom-6 right-6 z-10">
            <button 
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-[#FF6B1A] transition-colors"
            >
              {isMapExpanded ? <Minimize2 size={20} /> : <MapPin size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* List Section (Bottom Sheet) */}
      {!isMapExpanded && !isNavMode && (
        <div className="flex-1 min-h-0 bg-white rounded-t-[2.5rem] -mt-8 z-20 relative flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="pt-6 pb-2 px-6 flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">List of restaurants</h2>
            <button 
              onClick={() => setCampusOpen(true)}
              className="text-xs font-bold text-[#FF6B1A] bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1"
            >
              <MapPin size={12} /> {campus}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-4 no-scrollbar">
            {eateries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Dice5 size={48} className="mb-2 text-gray-400" />
                <p className="text-sm font-medium">No results found.</p>
              </div>
            ) : (
              eateries.map((e) => (
                <div 
                  key={e.id}
                  onClick={() => { setSelected(e); setRouteTarget(null); }}
                  className="flex gap-4 p-3 bg-white rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <img src={e.image} alt={e.name} className="w-[84px] h-[84px] rounded-2xl object-cover" />
                  <div className="flex-1 py-1 pr-2 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-base font-bold text-gray-900 leading-tight">{e.name}</h4>
                      <div className="flex items-center gap-1 text-[#FFB347] font-bold text-sm">
                        <Star size={14} fill="currentColor" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="truncate max-w-[160px]">{e.price} • {e.walk} away</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detail Overlay */}
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

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      {/* Campus Selector Overlay */}
      <AnimatePresence>
        {campusOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={() => setCampusOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
              className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-white p-6 shadow-2xl md:max-w-md md:mx-auto md:bottom-1/2 md:translate-y-1/2 md:rounded-3xl"
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
});

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
}
