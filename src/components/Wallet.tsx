import { useState, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Edit3, X, Delete, AlertTriangle, TrendingDown, Target, Wallet, Calendar, Sparkles } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell, XAxis } from "recharts";
import { useStore, fmtRp, Transaction } from "@/store/store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring }
};

export const WalletScreen = memo(function WalletScreen({ onBack }: { onBack: () => void }) {
  const { budget, spent, transactions, hideBalance, toggleHideBalance, setBudget } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(budget));
  const [tx, setTx] = useState<Transaction | null>(null);
  
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollerRef });
  const stickyOpacity = useTransform(scrollY, [120, 200], [0, 1]);
  const stickyY = useTransform(scrollY, [120, 200], [-20, 0]);

  const remaining = Math.max(0, budget - spent);
  const pct = Math.min(100, (spent / budget) * 100);
  const danger = remaining / budget < 0.15;

  // Advanced Analytics
  const today = new Date();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysLeft = Math.max(1, lastDayOfMonth.getDate() - today.getDate() + 1);
  const dailyLimit = Math.floor(remaining / daysLeft);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      map.set(t.emoji || '🍽️', (map.get(t.emoji || '🍽️') || 0) + t.amount);
    });
    return Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0, 4);
  }, [transactions]);

  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return [
        { id: "d1", name: "Sen", val: 0 }, { id: "d2", name: "Sel", val: 0 }, { id: "d3", name: "Rab", val: 0 },
        { id: "d4", name: "Kam", val: 0 }, { id: "d5", name: "Jum", val: 0 }, { id: "d6", name: "Sab", val: 0 }, { id: "d7", name: "Min", val: 0 }
      ];
    }
    const base = [
      { id: "b1", name: "H-6", val: 0 }, { id: "b2", name: "H-5", val: 0 }, { id: "b3", name: "H-4", val: 0 },
      { id: "b4", name: "H-3", val: 0 }, { id: "b5", name: "H-2", val: 0 }, { id: "b6", name: "H-1", val: 0 }, { id: "b7", name: "Hr Ini", val: 0 }
    ];
    transactions.slice(0, 20).forEach((t, i) => {
      const idx = 6 - (i % 7);
      if (idx >= 0 && idx < 7) {
        base[idx].val += t.amount;
      }
    });
    return base;
  }, [transactions]);

  return (
    <motion.div
      ref={scrollerRef}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={spring}
      className="scroll-smooth-y no-scrollbar absolute inset-0 z-50 h-full overflow-y-auto bg-gradient-to-b from-[#0a0e27] to-[#1a1f4d] text-white"
    >
      <div className="md:max-w-md mx-auto w-full relative min-h-full pb-32">
        <motion.div
          style={{ opacity: stickyOpacity, y: stickyY }}
          className="sticky top-0 z-20 -mb-12 flex items-center gap-3 border-b border-white/10 bg-[#0a0e27]/80 px-5 py-3 backdrop-blur-xl"
        >
          <button className="rounded-full bg-white/10 p-1.5" onClick={onBack}><ArrowLeft size={14} /></button>
          <div className="flex-1">
            <div className="text-[10px] text-white/50">Sisa Saldo</div>
            <div className="text-sm tracking-tight" style={{fontWeight:800}}>
              {hideBalance ? "Rp ••••" : fmtRp(remaining)}
            </div>
          </div>
        </motion.div>

        {danger && (
          <div className="sticky top-0 z-10 flex justify-center bg-red-500 py-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle size={14} />
              <span style={{fontWeight:700}}>Awas dompet tipis, hemat bro!</span>
            </div>
          </div>
        )}

        <div className="px-5 pt-12">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{scale:0.9}} onClick={onBack} className="rounded-full bg-white/10 p-2"><ArrowLeft size={18} /></motion.button>
            <div className="flex-1">
              <div className="text-xs text-white/60">Advanced Analytics</div>
              <h1 className="text-xl tracking-tight" style={{fontWeight:800}}>Monitoring Budget</h1>
            </div>
            <button onClick={toggleHideBalance} className="rounded-full bg-white/10 p-2">
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-8 space-y-6">
            
            {/* Glowing Gauge */}
            <motion.div variants={itemAnim} className="flex flex-col items-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF6B1A]/20 blur-3xl rounded-full" />
              <Gauge pct={pct} danger={danger} />
              <div className="-mt-36 text-center z-10">
                <div className="text-xs text-white/60 uppercase tracking-widest">Sisa Saldo</div>
                <div className="mt-1 text-4xl tracking-tighter" style={{fontWeight:800}}>
                  {hideBalance ? "Rp ••••••" : fmtRp(remaining)}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 rounded-full px-3 py-1 w-max mx-auto border border-emerald-400/20">
                  <Sparkles size={12} /> Sisa {100 - Math.round(pct)}% dari target
                </div>
              </div>
            </motion.div>

            {/* Daily Limit & Advanced Stats */}
            <motion.div variants={itemAnim} className="grid grid-cols-2 gap-3 mt-12">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><Calendar size={32} /></div>
                <div className="text-xs text-white/60">Jatah Harian</div>
                <div className="mt-1 text-lg text-emerald-400" style={{fontWeight:800}}>{hideBalance ? "Rp ••••" : fmtRp(dailyLimit)}</div>
                <div className="text-[10px] text-white/40 mt-1">Sisa {daysLeft} hari lagi</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 transition-transform"><Target size={32} /></div>
                <div className="text-xs text-white/60">Target Bulanan</div>
                <div className="mt-1 text-lg text-[#FF8C42]" style={{fontWeight:800}}>{hideBalance ? "Rp ••••" : fmtRp(budget)}</div>
                <button onClick={() => { setDraft(String(budget)); setEditing(true); }} className="text-[10px] text-[#FF6B1A] mt-1 flex items-center gap-1"><Edit3 size={10}/> Edit Target</button>
              </div>
            </motion.div>

            {/* Categories Breakdown */}
            {categories.length > 0 && (
              <motion.div variants={itemAnim} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <h3 className="mb-4 text-sm flex items-center gap-2" style={{fontWeight:700}}><Wallet size={16} className="text-[#FF6B1A]"/> Pengeluaran Terbesar</h3>
                <div className="space-y-3">
                  {categories.map(([emo, amount]) => {
                    const w = Math.max(10, (amount / spent) * 100);
                    return (
                      <div key={emo}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1.5"><span className="text-sm">{emo}</span> Kategori {emo}</span>
                          <span style={{fontWeight:700}}>{hideBalance ? "Rp ••••" : fmtRp(amount)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Bar chart */}
            <motion.div variants={itemAnim} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-white/60">Total Pengeluaran</div>
                  <div className="text-xl" style={{fontWeight:800}}>{hideBalance ? "Rp ••••" : fmtRp(spent)}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF6B1A]"><TrendingDown size={18}/></div>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{ backgroundColor: "rgba(10, 14, 39, 0.9)", backdropFilter: "blur(8px)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                      formatter={(val: number) => [`Rp ${val.toLocaleString("id-ID")}`, "Total"]}
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600 }} dy={10} />
                    <Bar dataKey="val" radius={[8, 8, 8, 8]}>
                      {chartData.map((entry, index) => (
                        <Cell key={entry.id} fill={index === chartData.length - 1 ? "#FF6B1A" : "rgba(255,255,255,0.2)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Transactions */}
            <motion.div variants={itemAnim}>
              <h3 className="mb-3 text-sm px-1" style={{fontWeight:700}}>Riwayat 20 Terakhir</h3>
              <div className="space-y-2">
                {transactions.map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ root: scrollerRef, once: true, margin: "0px 0px -40px 0px" }}
                    transition={{ ...spring, delay: i * 0.04 }}
                    whileTap={{scale:0.97}}
                    onClick={() => setTx(t)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-left backdrop-blur-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">{t.emoji}</div>
                    <div className="flex-1">
                      <div className="text-sm" style={{fontWeight:700}}>{t.place}</div>
                      <div className="text-xs text-white/50 mt-0.5">{t.date}</div>
                    </div>
                    <div className="text-sm text-[#FF8C42]" style={{fontWeight:800}}>
                      -{hideBalance ? "••••" : fmtRp(t.amount)}
                    </div>
                  </motion.button>
                ))}
                {transactions.length === 0 && (
                  <div className="py-12 border border-dashed border-white/10 rounded-3xl text-center text-sm text-white/40">Belum ada catatan pengeluaran.</div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <BudgetEditor
            value={draft}
            setValue={setDraft}
            onCancel={() => setEditing(false)}
            onSave={() => { setBudget(parseInt(draft) || 0); setEditing(false); }}
          />
        )}
        {tx && <TxDetail tx={tx} onClose={() => setTx(null)} />}
      </AnimatePresence>
    </motion.div>
  );
});

function Gauge({ pct, danger }: { pct: number; danger: boolean }) {
  const r = 110, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 260 260" className="h-64 w-64 -rotate-90">
      <circle cx="130" cy="130" r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
      <motion.circle
        cx="130" cy="130" r={r}
        stroke={danger ? "#EF4444" : "url(#gradg)"}
        strokeWidth="16" fill="none" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut", type: "spring", bounce: 0.2 }}
      />
      <defs>
        <linearGradient id="gradg" x1="0" x2="1">
          <stop offset="0%" stopColor="#FF6B1A" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BudgetEditor({ value, setValue, onCancel, onSave }: any) {
  const press = (k: string) => {
    if (k === "del") setValue(value.slice(0, -1));
    else setValue(value + k);
  };
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <motion.div initial={{y:400}} animate={{y:0}} exit={{y:400}} transition={spring} className="w-full md:max-w-md rounded-t-3xl bg-white p-6 text-gray-900 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xl tracking-tight" style={{fontWeight:800}}>Edit Target Bulanan</h3>
          <button onClick={onCancel} className="rounded-full bg-gray-100 p-1.5 hover:bg-gray-200"><X size={16} /></button>
        </div>
        <div className="mt-4 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 border border-orange-100">
          <div className="text-xs text-orange-600/60 font-bold uppercase tracking-wider">Target Baru</div>
          <div className="mt-1 text-3xl tracking-tighter text-orange-600" style={{fontWeight:800}}>
            Rp {(parseInt(value) || 0).toLocaleString("id-ID")}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","000","0","del"].map((k) => (
            <motion.button key={k} whileTap={{scale:0.9}} onClick={() => press(k)} className="rounded-2xl bg-gray-50 hover:bg-gray-100 py-4 text-xl" style={{fontWeight:700}}>
              {k === "del" ? <Delete size={20} className="mx-auto text-gray-500" /> : k}
            </motion.button>
          ))}
        </div>
        <motion.button whileTap={{scale:0.97}} onClick={onSave} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-orange-500/20" style={{fontWeight:800}}>
          Simpan Target
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function TxDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <motion.div
        initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-sm overflow-hidden rounded-3xl bg-white text-gray-900 shadow-2xl"
        style={{ maskImage: "radial-gradient(circle at 0 50%, transparent 8px, black 8px), radial-gradient(circle at 100% 50%, transparent 8px, black 8px)" }}
      >
        <div className="bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-9xl opacity-20 rotate-12">{tx.emoji}</div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-4xl drop-shadow-md">{tx.emoji}</span>
            <button onClick={onClose} className="rounded-full bg-white/20 p-2 hover:bg-white/30 backdrop-blur-md"><X size={16} /></button>
          </div>
          <h3 className="mt-4 text-3xl tracking-tight relative z-10" style={{fontWeight:800}}>{tx.place}</h3>
          <div className="text-sm opacity-90 relative z-10 font-medium">{tx.date}</div>
        </div>
        <div className="border-b-2 border-dashed border-gray-200 relative">
          <div className="absolute -left-2 -top-2 w-4 h-4 bg-black/60 rounded-full" />
          <div className="absolute -right-2 -top-2 w-4 h-4 bg-black/60 rounded-full" />
        </div>
        <div className="p-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detail Pesanan</div>
          <ul className="mt-3 space-y-2">
            {tx.items.map((it, idx) => (
              <li key={`${it}-${idx}`} className="flex justify-between text-sm font-medium">
                <span>{it}</span>
                <span className="text-emerald-500 bg-emerald-50 p-1 rounded-full"><Check size={12}/></span>
              </li>
            ))}
          </ul>
          <div className="my-5 border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500" style={{fontWeight:700}}>Total Bayar</span>
            <span className="text-2xl tracking-tighter text-[#FF6B1A]" style={{fontWeight:800}}>{fmtRp(tx.amount)}</span>
          </div>
          <button className="mt-6 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors" style={{fontWeight:700}}>
            Laporkan / Edit Transaksi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Check({size}: {size: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}