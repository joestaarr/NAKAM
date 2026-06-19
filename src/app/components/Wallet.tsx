import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Edit3, X, Delete, AlertTriangle, TrendingDown } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell, XAxis } from "recharts";
import { useStore, fmtRp, Transaction } from "../store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function WalletScreen({ onBack }: { onBack: () => void }) {
  const { budget, spent, transactions, hideBalance, toggleHideBalance, setBudget } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(budget));
  const [tx, setTx] = useState<Transaction | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollerRef });
  const heroScale = useSpring(useTransform(scrollY, [0, 220], [1, 0.78]), { stiffness: 200, damping: 30 });
  const heroOpacity = useTransform(scrollY, [0, 180], [1, 0.4]);
  const heroY = useTransform(scrollY, [0, 220], [0, -40]);
  const stickyOpacity = useTransform(scrollY, [120, 200], [0, 1]);
  const stickyY = useTransform(scrollY, [120, 200], [-20, 0]);

  const remaining = Math.max(0, budget - spent);
  const pct = Math.min(100, (spent / budget) * 100);
  const danger = remaining / budget < 0.15;

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
        <div className="sticky top-0 z-10 flex items-center gap-2 bg-red-500 px-4 py-2 text-xs">
          <AlertTriangle size={14} />
          <span style={{fontWeight:700}}>Awas dompet tipis, cari promo!</span>
        </div>
      )}
      <div className="px-5 pb-32 pt-12">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{scale:0.9}} onClick={onBack} className="rounded-full bg-white/10 p-2"><ArrowLeft size={18} /></motion.button>
          <div className="flex-1">
            <div className="text-xs text-white/60">Wallet & Budget</div>
            <h1 className="text-xl tracking-tight" style={{fontWeight:800}}>Dompet Mahasiswa</h1>
          </div>
          <button onClick={toggleHideBalance} className="rounded-full bg-white/10 p-2">
            {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Circular gauge with scroll parallax */}
        <motion.div style={{ scale: heroScale, opacity: heroOpacity, y: heroY }} className="mt-6 flex flex-col items-center will-change-transform">
          <Gauge pct={pct} danger={danger} />
          <div className="-mt-32 text-center">
            <div className="text-xs text-white/60">Sisa Saldo</div>
            <div className="mt-1 text-3xl tracking-tight" style={{fontWeight:800}}>
              {hideBalance ? "Rp ••••••" : fmtRp(remaining)}
            </div>
            <div className="mt-0.5 text-[11px] text-white/50">
              dari target {fmtRp(budget)} bulan ini
            </div>
          </div>
        </motion.div>

        <motion.button
          whileTap={{scale:0.97}}
          onClick={() => { setDraft(String(budget)); setEditing(true); }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm backdrop-blur-xl"
        >
          <Edit3 size={14} /> Edit Target Bulanan
        </motion.button>

        {/* Bar chart */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60">Total Pengeluaran</div>
              <div className="text-lg" style={{fontWeight:800}}>{hideBalance ? "Rp ••••" : fmtRp(spent)}</div>
            </div>
          </div>
          <div className="mt-4 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "none", color: "white" }}
                  formatter={(val: number) => [`Rp ${val.toLocaleString("id-ID")}`, "Pengeluaran"]}
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                <Bar dataKey="val" radius={[6, 6, 6, 6]}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.id} fill={index === chartData.length - 1 ? "#FF6B1A" : "#4285F4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm" style={{fontWeight:700}}>Transaksi Terbaru</h3>
          <div className="space-y-2">
            {transactions.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ root: scrollerRef, once: true, margin: "0px 0px -40px 0px" }}
                transition={{ ...spring, delay: i * 0.04 }}
                whileTap={{scale:0.97}}
                whileHover={{ y: -2 }}
                onClick={() => setTx(t)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-2xl">{t.emoji}</div>
                <div className="flex-1">
                  <div className="text-sm" style={{fontWeight:600}}>{t.place}</div>
                  <div className="text-[11px] text-white/50">{t.date}</div>
                </div>
                <div className="text-sm text-[#FF8C42]" style={{fontWeight:700}}>
                  -{hideBalance ? "••••" : fmtRp(t.amount)}
                </div>
              </motion.button>
            ))}
            {transactions.length === 0 && (
              <div className="py-10 text-center text-sm text-white/50">Belum ada pengeluaran.</div>
            )}
          </div>
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
}

function Gauge({ pct, danger }: { pct: number; danger: boolean }) {
  const r = 90, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 220 220" className="h-56 w-56 -rotate-90">
      <circle cx="110" cy="110" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="14" fill="none" />
      <motion.circle
        cx="110" cy="110" r={r}
        stroke={danger ? "#EF4444" : "url(#gradg)"}
        strokeWidth="14" fill="none" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
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
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 flex items-end bg-black/60">
      <motion.div initial={{y:400}} animate={{y:0}} exit={{y:400}} transition={spring} className="w-full rounded-t-3xl bg-white p-6 text-gray-900">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-xl tracking-tight" style={{fontWeight:800}}>Edit Target Bulanan</h3>
          <button onClick={onCancel} className="rounded-full bg-gray-100 p-1.5"><X size={14} /></button>
        </div>
        <div className="mt-4 rounded-2xl bg-orange-50 p-5">
          <div className="text-xs text-gray-500">Target baru</div>
          <div className="mt-1 text-3xl tracking-tight" style={{fontWeight:800}}>
            Rp {(parseInt(value) || 0).toLocaleString("id-ID")}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","000","0","del"].map((k) => (
            <motion.button key={k} whileTap={{scale:0.9}} onClick={() => press(k)} className="rounded-2xl bg-gray-100 py-3.5 text-lg" style={{fontWeight:700}}>
              {k === "del" ? <Delete size={18} className="mx-auto" /> : k}
            </motion.button>
          ))}
        </div>
        <motion.button whileTap={{scale:0.95}} onClick={onSave} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-3.5 text-white" style={{fontWeight:700}}>
          Simpan
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function TxDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <motion.div
        initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-3xl bg-white text-gray-900"
        style={{ maskImage: "radial-gradient(circle at 0 50%, transparent 8px, black 8px), radial-gradient(circle at 100% 50%, transparent 8px, black 8px)" }}
      >
        <div className="bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="text-4xl">{tx.emoji}</span>
            <button onClick={onClose} className="rounded-full bg-white/20 p-1.5"><X size={14} /></button>
          </div>
          <h3 className="mt-3 text-2xl tracking-tight" style={{fontWeight:800}}>{tx.place}</h3>
          <div className="text-xs opacity-80">{tx.date}</div>
        </div>
        <div className="border-b-2 border-dashed border-gray-200" />
        <div className="p-5">
          <div className="text-xs text-gray-500">Detail Pesanan</div>
          <ul className="mt-2 space-y-1.5">
            {tx.items.map((it, idx) => (
              <li key={`${it}-${idx}`} className="flex justify-between text-sm">
                <span>{it}</span>
                <span className="text-gray-500">✓</span>
              </li>
            ))}
          </ul>
          <div className="my-4 border-t border-dashed border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{fontWeight:600}}>Total</span>
            <span className="text-xl tracking-tight" style={{fontWeight:800}}>{fmtRp(tx.amount)}</span>
          </div>
          <button className="mt-5 w-full rounded-2xl border border-gray-200 py-3 text-xs text-gray-600" style={{fontWeight:600}}>
            Laporkan / Edit Transaksi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}