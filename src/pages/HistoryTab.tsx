import { useState, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore, fmtRp, Transaction } from "@/store/store";
import { Calendar, TrendingDown, X, Check } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export const HistoryTab = memo(function HistoryTab() {
  const { transactions, hideBalance, spent } = useStore();
  const [tx, setTx] = useState<Transaction | null>(null);

  const thisMonthSpent = spent;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-800">
      <div className="px-6 pt-12 pb-4 bg-white shadow-sm border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="w-10" />
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">History</h1>
        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 hover:bg-gray-100 transition-colors">
          <Calendar size={20} />
        </button>
      </div>

      <div className="px-6 mt-6 mb-6">
        <div className="bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] rounded-3xl p-6 shadow-lg shadow-orange-500/20 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="text-white/80 font-medium text-sm">Spent this month</div>
          <div className="text-3xl font-bold mt-1 tracking-tight">
            {hideBalance ? "Rp ••••" : fmtRp(thisMonthSpent)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-white/90 text-sm font-medium bg-white/20 w-max px-3 py-1.5 rounded-full backdrop-blur-md">
            <TrendingDown size={16} /> {(transactions.length > 0) ? `${transactions.length} transactions` : 'No transactions'}
          </div>
        </div>
      </div>

      <div className="px-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTx(t)}
              className="flex w-full items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-2xl border border-gray-100 shrink-0">
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-gray-900 truncate">{t.place}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{t.date}</div>
              </div>
              <div className="text-base font-bold text-[#FF6B1A]">
                -{hideBalance ? "••••" : fmtRp(t.amount)}
              </div>
            </motion.button>
          ))}
          {transactions.length === 0 && (
            <div className="py-12 border-2 border-dashed border-gray-200 rounded-3xl text-center text-sm font-medium text-gray-400">
              No recent transactions
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {tx && <TxDetail tx={tx} onClose={() => setTx(null)} />}
      </AnimatePresence>
    </div>
  );
});

function TxDetail({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
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
            <span className="text-sm text-gray-500 font-bold">Total Bayar</span>
            <span className="text-2xl font-bold tracking-tighter text-[#FF6B1A]">{fmtRp(tx.amount)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CheckIcon({size}: {size: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
