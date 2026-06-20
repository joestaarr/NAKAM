import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, User, MapPin, Dice5, Wallet, Eye, EyeOff, ChevronDown, Check, X,
  Navigation, Footprints, Bike, Car, Clock, Loader2
} from "lucide-react";
import { EateryDetail } from "./EateryDetail";
import { Navigator } from "./Navigator";
import { useStore, fmtRp } from "../store";
import { EATERIES_BY_CAMPUS } from "../data";
import { fetchEateriesFromSupabase } from "../supabaseData";
import { NakamLogo } from "./Logo";
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
const CAMPUSES = [
  { code: "UMM", name: "Universitas Muhammadiyah Malang", students: "30k+" },
  { code: "UB", name: "Universitas Brawijaya", students: "60k+" },
  { code: "UM", name: "Universitas Negeri Malang", students: "25k+" },
];

export function HomeMap({ onOpenProfile, onOpenWallet }: { onOpenProfile: () => void; onOpenWallet: () => void; }) {
  const [selected, setSelected] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusLoading, setCampusLoading] = useState(false);
  
  const [navTarget, setNavTarget] = useState<any>(null); // Full navigator
  const [routeTarget, setRouteTarget] = useState<any>(null); // Route info bottom sheet
  const [routeMode, setRouteMode] = useState<"walk" | "bike" | "car">("bike");
  const [routeData, setRouteData] = useState<{ path: [number, number][], dist: number, dur: number } | null>(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const [userPos, setUserPos] = useState({ lat: -7.9213, lng: 112.5990 }); // Default UMM
  const { campus, setCampus, hideBalance, toggleHideBalance, budget, spent, merchant } = useStore();
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
        const profile = routeMode === 'walk' ? 'walking' : routeMode === 'bike' ? 'cycling' : 'driving';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${userPos.lng},${userPos.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
          setRouteData({
            path: coords,
            dist: route.distance, // meters
            dur: route.duration   // seconds
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

  const eateries = [
    ...(merchantEatery ? [merchantEatery] : []),
    ...(supabaseEateries || EATERIES_BY_CAMPUS[campus] || [])
  ];

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

  // UI State: if user is viewing detail or navigating, we hide the top floating stuff like Gojek
  const hideTopHeader = !!selected || !!routeTarget || !!navTarget || campusOpen;

  let mapBounds: L.LatLngBoundsExpression | undefined = undefined;
  if (routeData && routeData.path.length > 0) {
    mapBounds = L.latLngBounds(routeData.path);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E8EEF4]">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
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
          />
        </MapContainer>

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
      </div>

      {/* Dynamic Top Header (Gojek Style) */}
      <AnimatePresence>
        {!hideTopHeader && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ ...spring, damping: 25 }}
            className="absolute left-0 right-0 top-0 z-20 px-4 pt-12 pb-4 pointer-events-none"
          >
            <div className="pointer-events-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <NakamLogo size={32} />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCampusOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 shadow-lg backdrop-blur-xl border border-gray-100"
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
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg backdrop-blur-xl border border-gray-100 ${lowBalance ? "bg-red-50" : "bg-white/95"}`}
                >
                  <Wallet size={14} className={lowBalance ? "text-red-500" : "text-[#FF6B1A]"} />
                  <span className="text-xs" style={{fontWeight:800, color: lowBalance ? "#ef4444" : "#1f2937"}}>
                    {hideBalance ? "••••" : "Rp " + (remaining / 1000).toFixed(0) + "k"}
                  </span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenProfile} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-xl border border-gray-100 text-gray-700">
                  <User size={16} />
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="pointer-events-auto mt-4 flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <Search size={18} className="text-gray-400" />
              <input placeholder="Cari warkop, ayam geprek..." className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 text-gray-800" />
              <div className="h-4 w-px bg-gray-200" />
              <MapPin size={18} className="text-[#FF6B1A]" />
            </div>

            {/* Filter Chips */}
            <div className="pointer-events-auto mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f;
                return (
                  <motion.button
                    key={f} whileTap={{ scale: 0.95 }} onClick={() => setActiveFilter(isActive ? null : f)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs shadow-sm transition-colors ${
                      isActive ? "bg-[#FF6B1A] text-white font-bold border-[#FF6B1A]" : "bg-white/95 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {f}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
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
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setCampusOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white p-6 shadow-2xl"
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
      className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl border-t border-gray-200 bg-white p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
    >
      <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
      
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
