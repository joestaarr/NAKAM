import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Utensils, MapPin, Loader2, Wallet, AlertCircle } from "lucide-react";
import { useStore, fmtRp } from "@/store/store";
import { NakamLogo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/services/supabase";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function Login({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"login" | "loading" | "profile" | "budget" | "register">("login");
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { setBudget, login, signUp, user, setUser, campus, setCampus } = useStore();
  
  const [profName, setProfName] = useState("");
  const [profBio, setProfBio] = useState("");
  const [profCampus, setProfCampus] = useState("UMM");
  const [target, setTarget] = useState("1500000");
  const hasSupabase = isSupabaseConfigured();

  const submit = async () => {
    setError(null);
    setPhase("loading");

    if (hasSupabase) {
      if (username === "admin" && pass === "admingacor") {
        setUser({ ...user, name: "admin", avatar: "A" });
        setTimeout(() => onDone(), 500);
        return;
      }
      
      const err = await login(username, pass);
      if (err) {
        setError(err);
        setPhase("login");
        return;
      }
      // If login successful, bypass onboarding and go straight to Home
      setTimeout(() => {
        onDone();
      }, 500);
      return;
    }

    // Fallback for no supabase or mock login
    setTimeout(() => {
      if (username === "admin" && pass === "admingacor") {
        setUser({ ...user, name: "admin", avatar: "A" });
        onDone();
        return;
      }
      setProfName(user.name !== "Rangga Pratama" ? user.name : username);
      setProfBio(user.bio);
      setProfCampus(campus);
      setPhase("profile");
    }, 1500);
  };

  const handleRegister = async () => {
    setError(null);
    if (!username || !pass) {
      setError("Username dan password wajib diisi!");
      return;
    }
    if (pass.length < 6) {
      setError("Password minimal 6 karakter!");
      return;
    }
    setPhase("loading");

    if (hasSupabase) {
      const err = await signUp(username, pass);
      if (err) {
        setError(err);
        setPhase("register");
        return;
      }
    }

    setTimeout(() => {
      setProfName(username);
      setProfBio(user.bio);
      setProfCampus(campus);
      setPhase("profile");
    }, hasSupabase ? 500 : 1500);
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#0a0e27] p-4 text-white sm:p-8">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute inset-0 opacity-10"
      >
        <Utensils className="absolute top-16 left-8 h-32 w-32" />
        <MapPin className="absolute bottom-32 right-6 h-40 w-40" />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#FF6B1A] blur-3xl" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.4, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[#3B82F6] blur-3xl" 
      />

      <AnimatePresence mode="wait">
        {(phase === "login" || phase === "register" || phase === "loading") ? (
          <motion.div
            key={phase === "register" ? "register" : "login"}
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={spring}
              className="mb-8 flex flex-col items-center text-center"
            >
              <NakamLogo size={68} glow />
              <h1 className="mt-3 text-5xl tracking-tight" style={{ fontWeight: 800 }}>
                Nakam
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Temukan tongkrongan, susul temanmu.
              </p>
            </motion.div>

            <div className="mt-4 flex flex-col gap-4">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Field
                label={phase === "register" ? "Username" : "Username"}
                value={username}
                onChange={setUsername}
                placeholder="misal: hamdan"
              />
              <Field
                label="Password"
                value={pass}
                onChange={setPass}
                type={show ? "text" : "password"}
                placeholder="••••••••"
                trailing={
                  <button onClick={() => setShow(!show)} className="text-white/60">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {phase !== "register" && (
                <div className="flex justify-end">
                  <button className="text-xs text-white/60">Lupa password?</button>
                </div>
              )}

              {phase === "register" ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={phase === "loading" as any}
                    transition={spring}
                    onClick={handleRegister}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-[#FF6B1A]/40 disabled:opacity-80"
                    style={{ fontWeight: 700 }}
                  >
                    Daftar Sekarang
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    onClick={() => { setPhase("login"); setError(null); }}
                    className="w-full rounded-2xl border border-white/20 bg-white/5 py-4 text-sm text-white/80 backdrop-blur-md"
                  >
                    Sudah punya akun?{" "}
                    <span style={{ fontWeight: 700 }} className="text-[#FF8C42]">
                      Masuk.
                    </span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={phase === "loading"}
                    transition={spring}
                    onClick={submit}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-[#FF6B1A]/40 disabled:opacity-80"
                    style={{ fontWeight: 700 }}
                  >
                    {phase === "loading" ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Masuk"
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    onClick={() => { setPhase("register"); setError(null); }}
                    className="w-full rounded-2xl border border-white/20 bg-white/5 py-4 text-sm text-white/80 backdrop-blur-md"
                  >
                    Belum punya akun?{" "}
                    <span style={{ fontWeight: 700 }} className="text-[#FF8C42]">
                      Daftar dulu.
                    </span>
                  </motion.button>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-white/40">
              Dengan masuk, kamu setuju Syarat & Ketentuan Nakam.
            </p>
          </motion.div>
        ) : phase === "profile" ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
              <span className="rounded-full bg-white/10 px-2 py-0.5">Step 1/2</span>
              Atur Profil
            </div>
            <h1 className="text-3xl tracking-tight" style={{ fontWeight: 800 }}>
              Halo!<br />Siapa namamu?
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Biar teman-temanmu mudah mengenali kamu di peta.
            </p>

            <div className="mt-7 flex flex-col gap-4">
              <Field
                label="Nama Panggilan"
                value={profName}
                onChange={setProfName}
                placeholder="Rangga"
              />
              <Field
                label="Bio Singkat"
                value={profBio}
                onChange={setProfBio}
                placeholder="Pemburu warkop murah 🍜"
              />
              
              <div>
                <label className="mb-1.5 block text-xs text-white/70" style={{ fontWeight: 600 }}>
                  Kampus
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["UMM", "UM", "UB", "UNISMA"].map((c) => (
                    <motion.button
                      key={c}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfCampus(c)}
                      className={`rounded-xl border py-3 text-sm transition-colors ${
                        profCampus === c 
                          ? "border-[#FF8C42] bg-[#FF8C42]/20 text-[#FF8C42]" 
                          : "border-white/15 bg-white/5 text-white/70"
                      }`}
                      style={{ fontWeight: profCampus === c ? 700 : 500 }}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={spring}
              onClick={() => {
                setUser({ ...user, name: profName || username, bio: profBio, avatar: (profName || username)[0].toUpperCase() });
                setCampus(profCampus);
                setPhase("budget");
              }}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-[#FF6B1A]/40"
              style={{ fontWeight: 700 }}
            >
              Lanjut ke Budget →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="budget"
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -40, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10"
          >
            <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
              <span className="rounded-full bg-white/10 px-2 py-0.5">Step 2/2</span>
              Budget Setup
            </div>
            <h1 className="text-3xl tracking-tight" style={{ fontWeight: 800 }}>
              Mau hemat berapa<br />bulan ini?
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Kita bantu kamu jaga jajan biar dompet tetap aman.
            </p>

            <div className="mt-7">
              <label className="text-xs text-white/60" style={{fontWeight:600}}>Target Pengeluaran Bulan Ini</label>
              <motion.div
                animate={{ boxShadow: ["0 0 0 0 rgba(255,107,26,0.4)", "0 0 0 10px rgba(255,107,26,0)", "0 0 0 0 rgba(255,107,26,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-2 flex items-center gap-3 rounded-2xl border border-[#FF6B1A]/40 bg-white/5 px-5 py-5 backdrop-blur-xl"
              >
                <Wallet size={20} className="text-[#FF8C42]" />
                <span className="text-white/60">Rp</span>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="flex-1 bg-transparent text-2xl tracking-tight outline-none"
                  style={{ fontWeight: 800 }}
                />
              </motion.div>
              <div className="mt-3 flex gap-2">
                {[1000000, 1500000, 2000000].map((v) => (
                  <motion.button
                    key={v}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTarget(String(v))}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2 text-xs text-white/80"
                  >
                    {fmtRp(v)}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={spring}
              onClick={() => {
                setBudget(parseInt(target) || 0);
                onDone();
              }}
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-[#FF6B1A]/40"
              style={{ fontWeight: 700 }}
            >
              Mulai Eksplorasi →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/70" style={{ fontWeight: 600 }}>
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-2xl border bg-white/5 px-5 py-3.5 backdrop-blur-md transition-colors ${
          focus ? "border-[#FF8C42]" : "border-white/15"
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
        {trailing}
      </div>
    </div>
  );
}
