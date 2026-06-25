import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Splash } from "@/components/Splash";
import { Login } from "@/pages/Login";
import { HomeTab } from "@/pages/HomeTab";
import { RestaurantsTab } from "@/pages/RestaurantsTab";
import { HistoryTab } from "@/pages/HistoryTab";
import { ProfileTab } from "@/pages/Profile";
import { MerchantDashboard } from "@/pages/MerchantDashboard";
import { WalletScreen } from "@/components/Wallet";
import { AdminPanel } from "@/pages/AdminPanel";
import { BottomNavBar } from "@/components/BottomNavBar";
import { StoreProvider, useStore } from "@/store/store";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

type Phase = "splash" | "login" | "main";
type TabId = "home" | "restaurants" | "history" | "profile";

function Inner() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [routeTarget, setRouteTarget] = useState<any>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const { theme, supabaseUser, logout } = useStore();

  const handleOpenWallet = useCallback(() => setWalletOpen(true), []);
  const handleCloseWallet = useCallback(() => setWalletOpen(false), []);
  
  const handleOpenMerchant = useCallback(() => setMerchantOpen(true), []);
  const handleCloseMerchant = useCallback(() => setMerchantOpen(false), []);
  
  const handleOpenAdmin = useCallback(() => setAdminOpen(true), []);
  const handleCloseAdmin = useCallback(() => setAdminOpen(false), []);

  const handleLogout = useCallback(() => {
    logout(); // <--- Call the store's logout function here!
    setWalletOpen(false);
    setMerchantOpen(false);
    setAdminOpen(false);
    setPhase("login");
    setActiveTab("home");
  }, [logout]);

  const handleSplashDone = useCallback(() => {
    if (supabaseUser) setPhase("main");
    else setPhase("login");
  }, [supabaseUser]);

  const handleLoginDone = useCallback(() => setPhase("main"), []);

  return (
    <div className={`relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden p-0 bg-slate-100 ${theme === "dark" ? "bg-[#020617]" : ""}`}>
      <div className="relative w-full h-[100dvh] overflow-hidden bg-white text-slate-900 md:max-w-md shadow-2xl">
        <AnimatePresence>
          {phase === "splash" && (
            <Splash key="splash" onDone={handleSplashDone} />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {phase === "login" ? (
            <motion.div key="login" className="absolute inset-0" exit={{ x: "-30%", opacity: 0 }} transition={spring}>
              <Login onDone={handleLoginDone} />
            </motion.div>
          ) : phase === "main" ? (
            <motion.div key="main" className="absolute inset-0 flex flex-col bg-[#F8F9FA]" initial={{ x: "100%" }} animate={{ x: 0 }} transition={spring}>
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === "home" && (
                    <motion.div key="home" className="absolute inset-0 overflow-y-auto no-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                      <HomeTab 
                        onOpenWallet={handleOpenWallet}
                        onNavigateToEatery={(eatery) => {
                          setRouteTarget(eatery);
                          setActiveTab("restaurants");
                        }} 
                      />
                    </motion.div>
                  )}
                  {activeTab === "restaurants" && (
                    <motion.div key="restaurants" className="absolute inset-0 overflow-y-auto no-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                      <RestaurantsTab 
                        initialRouteTarget={routeTarget}
                        onClearRouteTarget={() => setRouteTarget(null)}
                      />
                    </motion.div>
                  )}
                  {activeTab === "history" && (
                    <motion.div key="history" className="absolute inset-0 overflow-y-auto no-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                      <HistoryTab />
                    </motion.div>
                  )}
                  {activeTab === "profile" && (
                    <motion.div key="profile" className="absolute inset-0 overflow-y-auto no-scrollbar" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}>
                      <ProfileTab
                        onOpenMerchant={handleOpenMerchant}
                        onOpenAdmin={handleOpenAdmin}
                        onLogout={handleLogout}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <BottomNavBar activeTab={activeTab} onChange={setActiveTab} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {walletOpen && <WalletScreen key="wallet" onBack={handleCloseWallet} />}
        </AnimatePresence>
        <AnimatePresence>
          {merchantOpen && <MerchantDashboard key="merchant" onBack={handleCloseMerchant} />}
        </AnimatePresence>
        <AnimatePresence>
          {adminOpen && <AdminPanel key="admin" onBack={handleCloseAdmin} />}
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