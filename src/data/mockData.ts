import type { Eatery } from "@/components/EateryDetail";

const sample = (id: string, name: string, image: string, walk: string, dom: number, price: string, tags: string[]): Eatery & { lat: number; lng: number; campus: string; filter: string[] } => ({
  id, name, image, walk, dominance: dom, price, tags,
  menu: [
    { name: "Nasi Goreng Spesial", price: 18000, emoji: "🍳" },
    { name: "Mie Godog Jowo", price: 15000, emoji: "🍜" },
    { name: "Es Teh Jumbo", price: 5000, emoji: "🧊" },
    { name: "Ayam Geprek", price: 17000, emoji: "🍗" },
    { name: "Indomie Telor", price: 12000, emoji: "🥚" },
  ],
  gallery: [
    image,
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
  ],
  lat: 0, lng: 0, campus: "UMM", filter: [],
});

export const EATERIES_BY_CAMPUS: Record<string, (Eatery & { lat: number; lng: number; campus: string; filter: string[] })[]> = {
  UMM: [
    { ...sample("1", "Warkop Mas Bro", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800", "5 mnt", 75, "10k - 25k", ["Kopi", "Wifi Kenceng"]), lat: -7.9200, lng: 112.5980, filter: ["🔌 Spot Nugas", "💸 Penyelamat Akhir Bulan"] },
    { ...sample("2", "Geprek Bensu Kampus", "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800", "8 mnt", 62, "15k - 30k", ["Pedas", "Cepat Saji"]), lat: -7.9225, lng: 112.5995, filter: ["🍚 Porsi Kuli"] },
    { ...sample("3", "Burjo Kuli Mantap", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "3 mnt", 88, "8k - 15k", ["24 Jam", "Murah"]), lat: -7.9195, lng: 112.6000, filter: ["💸 Penyelamat Akhir Bulan", "🍚 Porsi Kuli"] },
    { ...sample("4", "Cafe Nugas Vibes", "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800", "12 mnt", 54, "20k - 50k", ["Latte", "Spot Nugas"]), lat: -7.9230, lng: 112.5975, filter: ["🔌 Spot Nugas", "🅿️ Bebas Parkir"] },
  ],
  UB: [
    { ...sample("5", "Warung Pojok UB", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", "4 mnt", 80, "10k - 20k", ["Pecel", "Murah"]), lat: -7.9515, lng: 112.6130, campus: "UB", filter: ["💸 Penyelamat Akhir Bulan"] },
    { ...sample("6", "Soto Gebrak", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", "6 mnt", 71, "12k - 22k", ["Soto", "Hangat"]), lat: -7.9535, lng: 112.6145, campus: "UB", filter: ["🍚 Porsi Kuli"] },
    { ...sample("7", "Kopi & Buku", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", "9 mnt", 60, "18k - 35k", ["Wifi", "Tenang"]), lat: -7.9500, lng: 112.6120, campus: "UB", filter: ["🔌 Spot Nugas"] },
  ],
  UM: [
    { ...sample("8", "Bakso Galaxy", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", "5 mnt", 85, "10k - 20k", ["Bakso", "Kuah"]), lat: -7.9610, lng: 112.6170, campus: "UM", filter: ["🍚 Porsi Kuli"] },
    { ...sample("9", "Teras Senja", "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800", "10 mnt", 58, "20k - 45k", ["View", "Sunset"]), lat: -7.9635, lng: 112.6190, campus: "UM", filter: ["🔌 Spot Nugas"] },
  ],
};
