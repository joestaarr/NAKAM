import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Utensils, MapPin, Loader2, Wallet, AlertCircle } from "lucide-react";
import { useStore, fmtRp } from "../store";
import { NakamLogo } from "./Logo";
import { isSupabaseConfigured } from "../supabase";

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

export function Login({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"login" | "loading" | "budget" | "register">("login");
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { setBudget, login, signUp } = useStore();
  const [target, setTarget] = useState("1500000");
  const hasSupabase = isSupabaseConfigured();

  const submit = async () => {
    setError(null);
    setPhase("loading");

    if (hasSupabase) {
      const err = await login(username, pass);
      if (err) {
        setError(err);
        setPhase("login");
        return;
      }
    }

    setTimeout(() => setPhase("budget"), hasSupabase ? 500 : 1500);
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

    setTimeout(() => setPhase("budget"), hasSupabase ? 500 : 1500);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a1f4d] to-[#0a0e27] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <Utensils className="absolute top-16 left-8 h-32 w-32 -rotate-12" />
        <MapPin className="absolute bottom-32 right-6 h-40 w-40 rotate-12" />
      </div>
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#FF6B1A] opacity-30 blur-3xl" />
      <div className="absolute bottom-0 -right-20 h-80 w-80 rounded-full bg-[#3B82F6] opacity-30 blur-3xl" />

      <AnimatePresence mode="wait">
        {(phase === "login" || phase === "register" || phase === "loading") ? (
          <motion.div
            key={phase === "register" ? "register" : "login"}
            exit={{ opacity: 0, x: -50 }}
            transition={spring}
            className="relative z-10 flex h-full flex-col overflow-y-auto px-6 pt-12 pb-8"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
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

            <div className="flex flex-1 flex-col justify-center gap-4">
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
        ) : (
          <motion.div
            key="budget"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={spring}
            className="relative z-10 flex h-full flex-col overflow-y-auto px-6 pt-14 pb-8"
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

            <div className="flex-1" />

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={spring}
              onClick={() => {
                setBudget(parseInt(target) || 0);
                onDone();
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] py-4 text-white shadow-lg shadow-[#FF6B1A]/40"
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
