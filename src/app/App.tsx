import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Splash } from "./components/Splash";
import { Login } from "./components/Login";
import { HomeMap } from "./components/HomeMap";
import { MerchantDashboard } from "./components/MerchantDashboard";
import { WalletScreen } from "./components/Wallet";
import { ProfileScreen } from "./components/Profile";
import { StoreProvider, useStore } from "./store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type Phase = "splash" | "login" | "home";

function Inner() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const { theme } = useStore();

  return (
    <div className={`relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden p-0 sm:p-6 ${theme === "dark" ? "bg-[#020617]" : "bg-gradient-to-br from-slate-100 via-white to-slate-200"}`}>
      {/* Ambient background blobs on wider screens */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
      </div>
      <div
        className="relative overflow-hidden bg-white shadow-2xl ring-black/90 sm:rounded-[44px] sm:ring-[10px]"
        style={{
          width: "min(100vw, 420px)",
          height: "min(100dvh, 910px)",
        }}
      >
        <AnimatePresence>
          {phase === "splash" && (
            <Splash key="splash" onDone={() => setPhase("login")} />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === "login" ? (
            <motion.div key="login" className="absolute inset-0" exit={{ x: "-30%", opacity: 0 }} transition={spring}>
              <Login onDone={() => setPhase("home")} />
            </motion.div>
          ) : phase === "home" ? (
            <motion.div key="home" className="absolute inset-0" initial={{ x: "100%" }} animate={{ x: 0 }} transition={spring}>
              <HomeMap
                onOpenProfile={() => setProfileOpen(true)}
                onOpenWallet={() => setWalletOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {walletOpen && <WalletScreen key="wallet" onBack={() => setWalletOpen(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {profileOpen && (
            <ProfileScreen
              key="profile"
              onBack={() => setProfileOpen(false)}
              onOpenMerchant={() => setMerchantOpen(true)}
              onLogout={() => {
                setProfileOpen(false);
                setWalletOpen(false);
                setMerchantOpen(false);
                setPhase("login");
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {merchantOpen && <MerchantDashboard key="merchant" onBack={() => setMerchantOpen(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Inner />
    </StoreProvider>
  );
}