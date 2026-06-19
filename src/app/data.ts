import type { Eatery } from "./components/EateryDetail";

const sample = (id: string, name: string, image: string, walk: string, dom: number, price: string, tags: string[]): Eatery & { x: number; y: number; campus: string; filter: string[] } => ({
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
  x: 0, y: 0, campus: "UMM", filter: [],
});

export const EATERIES_BY_CAMPUS: Record<string, (Eatery & { x: number; y: number; campus: string; filter: string[] })[]> = {
  UMM: [
    { ...sample("1", "Warkop Mas Bro", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800", "5 mnt", 75, "10k - 25k", ["Kopi", "Wifi Kenceng"]), x: 38, y: 42, filter: ["🔌 Spot Nugas", "💸 Penyelamat Akhir Bulan"] },
    { ...sample("2", "Geprek Bensu Kampus", "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800", "8 mnt", 62, "15k - 30k", ["Pedas", "Cepat Saji"]), x: 62, y: 30, filter: ["🍚 Porsi Kuli"] },
    { ...sample("3", "Burjo Kuli Mantap", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "3 mnt", 88, "8k - 15k", ["24 Jam", "Murah"]), x: 28, y: 65, filter: ["💸 Penyelamat Akhir Bulan", "🍚 Porsi Kuli"] },
    { ...sample("4", "Cafe Nugas Vibes", "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800", "12 mnt", 54, "20k - 50k", ["Latte", "Spot Nugas"]), x: 70, y: 60, filter: ["🔌 Spot Nugas", "🅿️ Bebas Parkir"] },
  ],
  UB: [
    { ...sample("5", "Warung Pojok UB", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", "4 mnt", 80, "10k - 20k", ["Pecel", "Murah"]), x: 44, y: 38, campus: "UB", filter: ["💸 Penyelamat Akhir Bulan"] },
    { ...sample("6", "Soto Gebrak", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", "6 mnt", 71, "12k - 22k", ["Soto", "Hangat"]), x: 55, y: 55, campus: "UB", filter: ["🍚 Porsi Kuli"] },
    { ...sample("7", "Kopi & Buku", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", "9 mnt", 60, "18k - 35k", ["Wifi", "Tenang"]), x: 32, y: 62, campus: "UB", filter: ["🔌 Spot Nugas"] },
  ],
  UM: [
    { ...sample("8", "Bakso Galaxy", "https://images.unsplash.com/photo-1547592180-85f173990554?w=800", "5 mnt", 85, "10k - 20k", ["Bakso", "Kuah"]), x: 40, y: 40, campus: "UM", filter: ["🍚 Porsi Kuli"] },
    { ...sample("9", "Teras Senja", "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800", "10 mnt", 58, "20k - 45k", ["View", "Sunset"]), x: 65, y: 50, campus: "UM", filter: ["🔌 Spot Nugas"] },
  ],
};
