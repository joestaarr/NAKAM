import { motion, AnimatePresence } from "motion/react";
import { X, Star, Check } from "lucide-react";
import { useState, useEffect } from "react";

export interface FilterOptions {
  categories: string[];
  minRating: number;
  priceRange: string;
}

export function FilterModal({ 
  isOpen, 
  onClose, 
  onApply,
  initialFilters
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}) {
  const [selectedCats, setSelectedCats] = useState<string[]>(initialFilters?.categories || []);
  const [rating, setRating] = useState<number>(initialFilters?.minRating || 0);
  const [price, setPrice] = useState<string>(initialFilters?.priceRange || "any");

  // Sync internal state with external state when opened
  useEffect(() => {
    if (isOpen && initialFilters) {
      setSelectedCats(initialFilters.categories);
      setRating(initialFilters.minRating);
      setPrice(initialFilters.priceRange);
    }
  }, [isOpen, initialFilters]);

  const categories = [
    "Aneka Nasi", "Ayam & Bebek", "Bakso & Soto", "Mie", 
    "Cepat Saji", "Kopi", "Jajanan", "Roti & Kue", "Minuman"
  ];
  const priceRanges = [
    { id: "any", label: "Semua Harga" },
    { id: "cheap", label: "< Rp 15.000" },
    { id: "mid", label: "Rp 15.000 - Rp 30.000" },
    { id: "expensive", label: "> Rp 30.000" }
  ];

  const toggleCat = (c: string) => {
    if (selectedCats.includes(c)) setSelectedCats(selectedCats.filter(x => x !== c));
    else setSelectedCats([...selectedCats, c]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl bg-white p-6 shadow-2xl md:max-w-md md:mx-auto md:bottom-1/2 md:translate-y-1/2 md:rounded-3xl max-h-[85vh] flex flex-col font-sans"
          >
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Filter Pencarian</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-4 pr-2">
              {/* Categories */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Kategori Makanan</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const isActive = selectedCats.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCat(c)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isActive ? "bg-orange-50 text-[#FF6B1A] border-[#FF6B1A] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Rating Minimal</h3>
                <div className="flex gap-2">
                  {[3, 4, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${rating === r ? "bg-orange-50 text-[#FF6B1A] border-[#FF6B1A] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                    >
                      <Star size={16} fill={rating === r ? "currentColor" : "none"} className={rating === r ? "" : "text-gray-400"} />
                      {r}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Rentang Harga</h3>
                <div className="space-y-2">
                  {priceRanges.map(p => (
                    <label key={p.id} className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${price === p.id ? "bg-orange-50/50 border-orange-200" : "bg-white border-gray-100 hover:bg-gray-50"}`}>
                      <span className={`text-sm font-bold ${price === p.id ? "text-gray-900" : "text-gray-600"}`}>{p.label}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${price === p.id ? "bg-[#FF6B1A] border-[#FF6B1A]" : "border-gray-300 bg-white"}`}>
                        {price === p.id && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <input type="radio" className="hidden" checked={price === p.id} onChange={() => setPrice(p.id)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                onClick={() => { setSelectedCats([]); setRating(0); setPrice("any"); }}
                className="px-6 py-3.5 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => { onApply({ categories: selectedCats, minRating: rating, priceRange: price }); onClose(); }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#FF6B1A] hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
              >
                Terapkan Filter
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
