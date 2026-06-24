import { useState, useRef, memo, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ArrowLeft, Edit3, Shield, Sun, Moon, Store, ChevronRight, Check, Ghost, EyeOff, Loader2, Camera, Instagram, Twitter } from "lucide-react";
import { useStore } from "@/store/store";
import { uploadImageToSupabase } from "@/services/supabaseData";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export const ProfileTab = memo(function ProfileTab({ onOpenMerchant, onOpenAdmin, onLogout }: { onOpenMerchant: () => void; onOpenAdmin: () => void; onLogout: () => void }) {
  const { user, setUser, theme, toggleTheme, ghostMode, setGhostMode, showExpense, setShowExpense, campus } = useStore();
  const [view, setView] = useState<"main" | "edit" | "privacy">("main");
  const [draft, setDraft] = useState(user);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollerRef });
  const coverScale = useTransform(scrollY, [-100, 0, 200], [1.3, 1, 1.15]);
  const coverY = useTransform(scrollY, [0, 200], [0, -60]);
  const titleOpacity = useTransform(scrollY, [60, 140], [0, 1]);

  return useMemo(() => (
    <motion.div
      ref={scrollerRef}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring}
      className={`scroll-smooth-y no-scrollbar relative w-full h-full pb-24 overflow-y-auto ${theme === "dark" ? "bg-[#0a0e27] text-white" : "bg-[#F7F9FC] text-gray-900"}`}
    >
      <motion.div
        style={{ opacity: titleOpacity }}
        className={`pointer-events-none sticky top-0 z-30 -mb-12 flex items-center gap-3 px-5 py-3 backdrop-blur-xl ${theme === "dark" ? "bg-[#0a0e27]/80 border-b border-white/10" : "bg-white/80 border-b border-gray-200"}`}
      >
        <div className="text-sm" style={{fontWeight:800}}>{user.name}</div>
      </motion.div>
      <AnimatePresence mode="wait">
        {view === "main" && (
          <motion.div key="main" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {/* Cover with parallax */}
            <motion.div style={{ scale: coverScale, y: coverY, backgroundImage: user.banner ? `url(${user.banner})` : undefined }} className={`relative h-44 overflow-hidden will-change-transform bg-cover bg-center ${!user.banner ? "bg-gradient-to-br from-[#FF6B1A] via-[#FF8C42] to-[#FFB347]" : ""}`}>
              {!user.banner && <div className="absolute inset-0 opacity-20" style={{backgroundImage: "radial-gradient(circle at 20% 30%, white 0, transparent 30%), radial-gradient(circle at 80% 60%, white 0, transparent 30%)"}} />}
              <button onClick={() => { setDraft(user); setView("edit"); }} className="absolute right-4 top-12 rounded-full bg-black/30 p-2 text-white backdrop-blur-md">
                <Edit3 size={16} />
              </button>
            </motion.div>

            {/* Avatar + info */}
            <div className="relative px-5 pb-6">
              <div className={`absolute -top-12 flex h-24 w-24 items-center justify-center rounded-full border-4 ${theme === "dark" ? "border-[#0a0e27]" : "border-[#F7F9FC]"} bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] text-3xl text-white overflow-hidden`} style={{fontWeight:800}}>
                {user.avatar?.startsWith("http") ? (
                  <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  user.avatar || "M"
                )}
              </div>
              <div className="pt-14">
                <h1 className="text-2xl tracking-tight" style={{fontWeight:800}}>{user.name}</h1>
                <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-gray-500"}`}>{user.bio}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] text-orange-700" style={{fontWeight:600}}>
                  📍 {campus}
                </div>
              </div>

              {/* Stats */}
              <div className={`mt-5 grid grid-cols-3 gap-2 rounded-2xl p-3 ${theme === "dark" ? "bg-white/5 border border-white/10" : "bg-white"}`}>
                {[{n: 42, l: "Tempat"}, {n: 128, l: "Transaksi"}, {n: 14, l: "Ulasan"}].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-lg" style={{fontWeight:800}}>{s.n}</div>
                    <div className={`text-[10px] ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Socials */}
              {(user.socials?.instagram || user.socials?.twitter) && (
                <div className="mt-3 flex gap-2">
                  {user.socials.instagram && (
                    <a href={`https://instagram.com/${user.socials.instagram}`} target="_blank" className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${theme === "dark" ? "bg-white/10 text-pink-400" : "bg-pink-50 text-pink-600"}`}>
                      <Instagram size={12} /> {user.socials.instagram}
                    </a>
                  )}
                  {user.socials.twitter && (
                    <a href={`https://twitter.com/${user.socials.twitter}`} target="_blank" className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${theme === "dark" ? "bg-white/10 text-sky-400" : "bg-sky-50 text-sky-600"}`}>
                      <Twitter size={12} /> {user.socials.twitter}
                    </a>
                  )}
                </div>
              )}

              {/* Settings */}
              <div className="mt-5 space-y-2">
                <Row icon={theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} label={`Tema: ${theme === "dark" ? "Gelap" : "Terang"}`} sub="Tap untuk switch" onClick={toggleTheme} theme={theme} />
                <Row icon={<Store size={16} />} label="Buka Mode Merchant" sub="Untuk pemilik warung" onClick={onOpenMerchant} theme={theme} highlight />
                {user.name.toLowerCase() === "admin" && (
                  <Row icon={<Shield size={16} />} label="👑 Panel Admin" sub="Input Warung (Bypass User)" onClick={onOpenAdmin} theme={theme} highlight />
                )}
              </div>

              <motion.button
                whileTap={{scale:0.97}}
                onClick={() => setConfirmLogout(true)}
                className={`mt-5 w-full rounded-2xl py-3 text-sm ${theme === "dark" ? "bg-white/5 border border-white/10 text-red-400" : "bg-white text-red-500"}`}
                style={{fontWeight:700}}
              >
                Keluar
              </motion.button>
            </div>
          </motion.div>
        )}

        {view === "edit" && (
          <motion.div key="edit" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}}>
            <div className={`flex items-center gap-3 px-4 pb-3 pt-12 ${theme === "dark" ? "bg-[#0a0e27]" : "bg-white"} border-b ${theme === "dark" ? "border-white/10" : "border-gray-100"}`}>
              <button onClick={() => setView("main")}><ArrowLeft size={20} /></button>
              <h1 className="flex-1 text-lg" style={{fontWeight:800}}>Edit Profil</h1>
              <button onClick={() => { setUser(draft); setView("main"); }} className="rounded-full bg-[#FF6B1A] px-3 py-1 text-xs text-white" style={{fontWeight:700}}>Simpan</button>
            </div>
            <div className="space-y-4 p-5 pb-20">
              <div className="flex gap-4 items-center">
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] text-xl text-white overflow-hidden`}>
                  {draft.avatar?.startsWith("http") ? (
                    <img src={draft.avatar} className="h-full w-full object-cover" />
                  ) : draft.avatar || "M"}
                  {uploadingAvatar && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-white" /></div>}
                </div>
                <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/20">
                  Ubah Foto Profil
                  <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadingAvatar(true);
                      const url = await uploadImageToSupabase(e.target.files[0]);
                      if (url) setDraft({ ...draft, avatar: url });
                      setUploadingAvatar(false);
                    }
                  }} />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/60">Banner Profil</label>
                <div className="relative h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: draft.banner ? `url(${draft.banner})` : undefined }}>
                  {uploadingBanner ? <Loader2 className="animate-spin" /> : (
                    <label className="cursor-pointer bg-black/50 p-2 rounded-full text-white backdrop-blur flex items-center gap-2 text-xs pr-3">
                      <Camera size={14} /> Ganti Cover
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadingBanner(true);
                          const url = await uploadImageToSupabase(e.target.files[0]);
                          if (url) setDraft({ ...draft, banner: url });
                          setUploadingBanner(false);
                        }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              <Field label="Nama Tampilan" value={draft.name} onChange={(v) => setDraft({...draft, name: v})} theme={theme} />
              <Field label="Bio" value={draft.bio} onChange={(v) => setDraft({...draft, bio: v})} theme={theme} multiline />
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-bold mb-3">Sosial Media</div>
                <div className="space-y-3">
                  <Field label="Instagram Username" value={draft.socials?.instagram || ""} onChange={(v) => setDraft({...draft, socials: { ...draft.socials, instagram: v }})} theme={theme} />
                  <Field label="Twitter / X Username" value={draft.socials?.twitter || ""} onChange={(v) => setDraft({...draft, socials: { ...draft.socials, twitter: v }})} theme={theme} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setConfirmLogout(false)}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} exit={{scale:0.9, opacity:0}}
              transition={spring}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-3xl bg-white p-6 text-gray-900"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">👋</div>
              <h3 className="text-center text-lg tracking-tight" style={{fontWeight:800}}>Keluar dari Nakam?</h3>
              <p className="mt-1 text-center text-sm text-gray-500">Kamu harus login lagi untuk lanjut nyari tongkrongan.</p>
              <div className="mt-5 flex gap-2.5">
                <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm" style={{fontWeight:600}}>Batal</button>
                <motion.button
                  whileTap={{scale:0.95}}
                  onClick={() => { setConfirmLogout(false); onLogout(); }}
                  className="flex-1 rounded-2xl bg-red-500 py-3 text-sm text-white"
                  style={{fontWeight:700}}
                >
                  Keluar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  ), [user, theme, ghostMode, showExpense, campus, view, draft, confirmLogout, uploadingAvatar, uploadingBanner]);
});

function Row({ icon, label, sub, onClick, theme, highlight }: any) {
  return (
    <motion.button whileTap={{scale:0.97}} onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-3.5 ${
        highlight
          ? "bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] text-white"
          : theme === "dark" ? "border border-white/10 bg-white/5" : "bg-white"
      }`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${highlight ? "bg-white/20" : theme === "dark" ? "bg-white/10" : "bg-orange-50 text-[#FF6B1A]"}`}>{icon}</div>
      <div className="flex-1 text-left">
        <div className="text-sm" style={{fontWeight:700}}>{label}</div>
        <div className={`text-xs ${highlight ? "text-white/70" : theme === "dark" ? "text-white/50" : "text-gray-500"}`}>{sub}</div>
      </div>
      <ChevronRight size={16} className="opacity-60" />
    </motion.button>
  );
}

function Toggle({ icon, label, sub, value, onChange, theme }: any) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-3.5 ${theme === "dark" ? "border border-white/10 bg-white/5" : "bg-white"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme === "dark" ? "bg-white/10" : "bg-orange-50 text-[#FF6B1A]"}`}>{icon}</div>
      <div className="flex-1">
        <div className="text-sm" style={{fontWeight:700}}>{label}</div>
        <div className={`text-xs ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}>{sub}</div>
      </div>
      <button onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-[#FF6B1A]" : theme === "dark" ? "bg-white/20" : "bg-gray-300"}`}>
        <motion.span layout transition={spring} className={`absolute top-0.5 h-5 w-5 rounded-full bg-white ${value ? "right-0.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, theme, multiline }: any) {
  return (
    <div>
      <label className={`text-xs ${theme === "dark" ? "text-white/60" : "text-gray-500"}`}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className={`mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className={`mt-1 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`} />
      )}
    </div>
  );
}
