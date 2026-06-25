import { motion, AnimatePresence } from "motion/react";
import { X, Dice5, MapPin, Star, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function TerserahRoulette({
  isOpen,
  eateries,
  onClose,
  onAccept,
}: {
  isOpen: boolean;
  eateries: any[];
  onClose: () => void;
  onAccept: (eatery: any) => void;
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<any | null>(null);
  
  // We need a long array to simulate the roulette
  const [rouletteItems, setRouletteItems] = useState<any[]>([]);
  const ITEM_WIDTH = 160; // 144px width + 16px gap
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      return;
    }
    if (isOpen && eateries.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setIsSpinning(false);
      setWinner(null);
      setXPos(0);
      
      let pool: any[] = [];
      while (pool.length < 60) {
        const shuffled = [...eateries].sort(() => Math.random() - 0.5);
        pool = [...pool, ...shuffled];
      }
      setRouletteItems(pool.slice(0, 60));
    }
  }, [isOpen, eateries]);

  const spin = () => {
    if (isSpinning || eateries.length === 0) return;
    setIsSpinning(true);
    setWinner(null);

    // Choose a winning index towards the end (e.g. between 35 and 45)
    const winIndex = Math.floor(Math.random() * 10) + 35;
    const selectedEatery = rouletteItems[winIndex];

    // Calculate the target X position to center the winning item
    // Screen center minus half item width
    const offset = -(winIndex * ITEM_WIDTH) + (window.innerWidth / 2) - (ITEM_WIDTH / 2);

    // Simulate the spin duration
    setTimeout(() => {
      setWinner(selectedEatery);
      setIsSpinning(false);
    }, 6000); // match animation duration

    return offset;
  };

  const targetX = isSpinning ? -(Math.floor(Math.random() * 10) + 35) * ITEM_WIDTH + (window.innerWidth / 2) - (ITEM_WIDTH / 2) : 0;
  
  // Actually, we need to imperatively or declaratively animate `x`
  // We'll use Framer Motion's animate property based on state

  const [xPos, setXPos] = useState(0);

  const startSpin = () => {
    if (isSpinning || eateries.length === 0) return;
    setIsSpinning(true);
    setWinner(null);
    
    let pool: any[] = [];
    while (pool.length < 60) {
      const shuffled = [...eateries].sort(() => Math.random() - 0.5);
      pool = [...pool, ...shuffled];
    }
    pool = pool.slice(0, 60);
    setRouletteItems(pool);

    const winIndex = Math.floor(Math.random() * 15) + 40; // 40 to 55
    const selected = pool[winIndex];

    // Calculate center offset
    // ITEM_WIDTH is 160. Total width of container is window.innerWidth.
    const centerScreen = window.innerWidth / 2;
    // We add a tiny random offset so it doesn't land perfectly in the center every time (like CS2)
    const randomFrictionOffset = Math.floor(Math.random() * 100) - 50; 
    const finalX = -(winIndex * ITEM_WIDTH) + centerScreen - (ITEM_WIDTH / 2) + randomFrictionOffset;

    setXPos(finalX);

    setTimeout(() => {
      setWinner(selected);
      setIsSpinning(false);
    }, 6500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[100] flex flex-col bg-[#121212]/95 backdrop-blur-md overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="pt-12 pb-4 px-6 flex items-center justify-between z-10 shrink-0 text-white">
            <div>
              <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                <Dice5 className="text-[#FF6B1A]" size={28} /> TERSERAH
              </h2>
              <p className="text-sm text-gray-400 font-medium">Biar takdir yang memilih makananmu</p>
            </div>
            <button 
              onClick={onClose} 
              disabled={isSpinning}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Roulette Area */}
          <div className="flex-1 flex flex-col justify-center relative">
            
            {/* Center Line indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#FF6B1A] to-transparent z-20 -translate-x-1/2 shadow-[0_0_15px_rgba(255,107,26,0.8)]" />
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-t-white border-b-white z-30" />

            {/* Carousel track */}
            <div className="w-full overflow-hidden py-10 relative">
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#121212] to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#121212] to-transparent z-10" />
              
              <motion.div 
                className="flex gap-4"
                initial={{ x: 0 }}
                animate={{ x: xPos }}
                transition={{ 
                  duration: 6.5, 
                  ease: [0.15, 0.9, 0.2, 1], // Custom cubic bezier mimicking extreme deceleration
                }}
              >
                {rouletteItems.map((e, idx) => (
                  <div 
                    key={idx} 
                    className="w-[144px] shrink-0 bg-[#1E1E1E] rounded-2xl overflow-hidden border border-white/5 flex flex-col shadow-xl"
                  >
                    <img src={e.image} className="w-full h-[100px] object-cover opacity-80" alt={e.name} />
                    <div className="p-3 text-white flex-1 flex flex-col justify-between bg-gradient-to-t from-black/80 to-transparent">
                      <div className="font-bold text-sm leading-tight line-clamp-2">{e.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2 font-medium">
                        <Star size={10} className="text-[#FFB347] fill-[#FFB347]" /> {(e.dominance ? e.dominance / 20 : 4.5).toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Action Area */}
          <div className="pb-12 px-6 shrink-0 flex flex-col items-center">
            <AnimatePresence mode="wait">
              {winner ? (
                <motion.div 
                  key="winner"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full bg-[#1A1A1A] rounded-3xl p-6 border border-[#FF6B1A]/30 shadow-[0_0_40px_rgba(255,107,26,0.15)] flex flex-col items-center relative overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 text-[#FF6B1A]/10 rotate-12">
                    <Sparkles size={120} />
                  </div>
                  
                  <div className="text-xs font-black tracking-widest text-[#FF6B1A] uppercase mb-1">Pilihan Takdir!</div>
                  <h3 className="text-2xl font-black text-white text-center mb-3">{winner.name}</h3>
                  
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-300 mb-6 bg-white/5 px-4 py-2 rounded-full">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-[#FFB347]" /> {winner.walk}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{winner.price}</span>
                  </div>

                  <div className="flex w-full gap-3">
                    <button 
                      onClick={() => { setWinner(null); setXPos(0); }}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={() => onAccept(winner)}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-[#FF6B1A] to-orange-500 shadow-[0_0_20px_rgba(255,107,26,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Sikat!
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="spinBtn"
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <button 
                    onClick={startSpin}
                    disabled={isSpinning}
                    className={`w-full py-5 rounded-3xl font-black text-lg tracking-wide shadow-xl transition-all ${
                      isSpinning 
                        ? "bg-[#1E1E1E] text-gray-500 cursor-not-allowed" 
                        : "bg-white text-black hover:bg-gray-100 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    }`}
                  >
                    {isSpinning ? "Memutar Takdir..." : "PUTAR SEKARANG"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
