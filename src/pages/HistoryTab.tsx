import { useState, memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore, fmtRp, Transaction } from "@/store/store";
import { Calendar, TrendingDown, TrendingUp, X, Check, Receipt, CreditCard, ArrowDownRight, Clock, MapPin } from "lucide-react";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export const HistoryTab = memo(function HistoryTab() {
  const { transactions, hideBalance, spent, theme } = useStore();
  const [tx, setTx] = useState<Transaction | null>(null);

  const thisMonthSpent = spent;
  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col min-h-screen pb-24 font-sans ${isDark ? "bg-[#0a0e27] text-white" : "bg-[#F7F9FC] text-slate-800"}`}>
      {/* ─── Sticky Header ─── */}
      <div className={`px-5 pt-12 pb-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl ${isDark ? "bg-[#0a0e27]/80 border-b border-white/10" : "bg-white/80 border-b border-gray-200"}`}>
        <div className="w-10" />
        <h1 className="text-lg font-extrabold tracking-tight">Riwayat</h1>
        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
          <Calendar size={18} />
        </button>
      </div>

      {/* ─── Spending Card ─── */}
      <div className="px-5 mt-5 mb-6">
        <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl ${isDark ? "bg-gradient-to-br from-blue-900 to-[#1a1f4d] shadow-blue-900/20" : "bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] shadow-orange-500/20"} text-white`}>
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/3" />
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider">
              <CreditCard size={16} /> Pengeluaran Bulan Ini
            </div>
          </div>
          
          <div className="relative z-10 mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tighter">
              {hideBalance ? "Rp ••••" : fmtRp(thisMonthSpent)}
            </span>
          </div>

          <div className="relative z-10 mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md">
              <ArrowDownRight size={14} className="text-red-400" />
              <span className="text-xs font-bold text-white/90">
                {(transactions.length > 0) ? `${transactions.length} transaksi` : 'Belum ada transaksi'}
              </span>
            </div>
            <div className="flex -space-x-2">
               {transactions.slice(0,3).map((t, i) => (
                 <div key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-sm border-2 border-transparent" style={{ zIndex: 3 - i }}>{t.emoji}</div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Transactions List ─── */}
      <div className="px-5">
        <h2 className={`text-sm font-bold mb-4 uppercase tracking-widest ${isDark ? "text-white/40" : "text-gray-400"}`}>Semua Transaksi</h2>
        
        <div className="space-y-3">
          {transactions.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTx(t)}
              className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors shadow-sm ${isDark ? "bg-white/[0.04] border border-white/10 hover:bg-white/[0.08]" : "bg-white border border-gray-100 hover:bg-gray-50"}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shrink-0 ${isDark ? "bg-white/10" : "bg-orange-50"}`}>
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-extrabold truncate">{t.place}</div>
                <div className={`flex items-center gap-1.5 text-[11px] font-medium mt-1 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                  <Clock size={10} /> {t.date}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-base font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                  -{hideBalance ? "••••" : fmtRp(t.amount)}
                </div>
                <div className={`text-[10px] font-bold ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  {t.items.length} item
                </div>
              </div>
            </motion.button>
          ))}
          {transactions.length === 0 && (
            <div className={`py-16 rounded-3xl text-center text-sm font-bold flex flex-col items-center justify-center gap-3 ${isDark ? "border-2 border-dashed border-white/10 text-white/30" : "border-2 border-dashed border-gray-200 text-gray-400"}`}>
              <Receipt size={32} className="opacity-50" />
              Belum ada riwayat transaksi
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {tx && <TxDetail tx={tx} onClose={() => setTx(null)} isDark={isDark} />}
      </AnimatePresence>
    </div>
  );
});

function TxDetail({ tx, onClose, isDark }: { tx: Transaction; onClose: () => void; isDark: boolean }) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
      <motion.div
        initial={{scale:0.95, y: 20, opacity:0}} animate={{scale:1, y: 0, opacity:1}} exit={{scale:0.95, y: 20, opacity:0}} transition={spring}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm overflow-hidden rounded-[2rem] shadow-2xl ${isDark ? "bg-[#0f172a] text-white" : "bg-white text-gray-900"}`}
      >
        {/* Receipt Header */}
        <div className={`relative overflow-hidden p-6 text-center ${isDark ? "bg-[#1a1f4d]" : "bg-[#FF6B1A]"} text-white`}>
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex justify-between items-center mb-4">
            <div className="w-8" />
            <div className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Receipt</div>
            <button onClick={onClose} className="w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"><X size={16} /></button>
          </div>
          
          <div className="relative z-10 flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg transform rotate-3">
              {tx.emoji}
            </div>
          </div>
          
          <h3 className="relative z-10 text-2xl font-black tracking-tight mt-2">{tx.place}</h3>
          <div className="relative z-10 flex items-center justify-center gap-1.5 text-xs font-medium text-white/80 mt-1">
            <Clock size={12} /> {tx.date}
          </div>
        </div>

        {/* Receipt Cut-out effect */}
        <div className={`relative h-6 ${isDark ? "bg-[#1a1f4d]" : "bg-[#FF6B1A]"}`}>
          <div className={`absolute bottom-0 left-0 right-0 h-6 flex space-x-2 px-2 overflow-hidden`}>
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full ${isDark ? "bg-[#0f172a]" : "bg-white"} transform translate-y-2 shrink-0`} />
            ))}
          </div>
        </div>

        {/* Receipt Body */}
        <div className="px-6 py-6">
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? "text-white/40" : "text-gray-400"}`}>Item Pesanan</div>
          <ul className="space-y-3">
            {tx.items.map((it, idx) => (
              <li key={`${it}-${idx}`} className="flex items-center justify-between text-sm">
                <span className="font-semibold">{it}</span>
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${isDark ? "bg-white/10 text-emerald-400" : "bg-emerald-50 text-emerald-500"}`}>
                  <Check size={10} strokeWidth={3} />
                </span>
              </li>
            ))}
          </ul>
          
          <div className={`my-6 border-t-2 border-dashed ${isDark ? "border-white/10" : "border-gray-200"}`} />
          
          <div className="flex items-center justify-between">
            <span className={`text-sm font-extrabold ${isDark ? "text-white/60" : "text-gray-500"}`}>Total Pembayaran</span>
            <span className="text-2xl font-black tracking-tighter text-[#FF6B1A]">{fmtRp(tx.amount)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
