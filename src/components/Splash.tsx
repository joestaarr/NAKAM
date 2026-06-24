import { motion } from "motion/react";
import { useEffect } from "react";
import { NakamLogo } from "@/components/Logo";

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#0a0e27]">
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#FF6B1A] opacity-30 blur-3xl" />
      <div className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[#3B82F6] opacity-30 blur-3xl" />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <NakamLogo size={96} glow />
        </motion.div>
        <h1 className="relative mt-4 text-5xl tracking-tight text-white" style={{ fontWeight: 800 }}>
          Nakam
        </h1>
        <p className="relative mt-1 text-sm text-white/60">
          Temukan, susul, hemat.
        </p>
      </motion.div>
    </div>
  );
}
