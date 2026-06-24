import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  fetchProfile, upsertProfile,
  fetchTransactions, addTransactionToSupabase,
  fetchMerchant, upsertMerchant, updateMerchantStatus, updateMerchantInfo, deleteMerchant,
  addMenuItemToSupabase, updateMenuItemInSupabase, deleteMenuItemFromSupabase,
  completeOrderInSupabase, insertMockOrder, incrementMerchantViews,
} from "@/services/supabaseData";
import type { User } from "@supabase/supabase-js";

export type Transaction = {
  id: string;
  place: string;
  items: string[];
  amount: number;
  date: string;
  emoji: string;
};

export type MerchantMenuItem = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  available: boolean;
  sold: number;
};

export type FlashPromo = {
  id: string;
  merchantName: string;
  merchantEmoji: string;
  menuName: string;
  menuEmoji: string;
  campus: string;
  endTime: string;
};

export type MerchantOrder = {
  id: string;
  item: string;
  qty: number;
  time: string;
  status: "baru" | "selesai";
};

export type Merchant = {
  onboarded: boolean;
  name: string;
  campus: string;
  emoji: string;
  status: "buka" | "ramai" | "tutup";
  price: string;
  lat: number;
  lng: number;
  menu: MerchantMenuItem[];
  orders: MerchantOrder[];
  views: number;
};

type Store = {
  // Auth
  supabaseUser: User | null;
  authLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  signUp: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  // Budget & Wallet
  budget: number;
  setBudget: (n: number) => void;
  spent: number;
  // Promo
  globalPromo: string;
  setGlobalPromo: (v: string) => void;
  flashPromos: FlashPromo[];
  addFlashPromo: (p: Omit<FlashPromo, "id">) => void;
  addExpense: (t: Omit<Transaction, "id" | "date">) => void;
  transactions: Transaction[];
  hideBalance: boolean;
  toggleHideBalance: () => void;
  // Campus
  campus: string;
  setCampus: (c: string) => void;
  // Settings
  ghostMode: boolean;
  setGhostMode: (v: boolean) => void;
  showExpense: boolean;
  setShowExpense: (v: boolean) => void;
  // User profile
  user: { name: string; bio: string; avatar: string; banner?: string; socials?: { instagram?: string; twitter?: string } };
  setUser: (u: Store["user"]) => void;
  // Merchant
  merchant: Merchant;
  merchantDbId: string | null;
  finishOnboarding: (data: { name: string; campus: string; emoji: string; price: string; lat: number; lng: number; menu: MerchantMenuItem[] }) => void;
  setMerchantStatus: (s: Merchant["status"]) => void;
  setMerchantInfo: (info: Partial<Pick<Merchant, "name" | "emoji" | "price" | "campus">>) => void;
  addMenuItem: (m: Omit<MerchantMenuItem, "id" | "sold">) => void;
  updateMenuItem: (id: string, m: Partial<MerchantMenuItem>) => void;
  removeMenuItem: (id: string) => void;
  toggleMenuAvailable: (id: string) => void;
  pushMockOrder: () => void;
  completeOrder: (id: string) => void;
  deleteStore: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

const MOCK_ORDER_POOL = ["Nasi Goreng", "Es Teh Jumbo", "Mie Godog", "Indomie Telor", "Geprek Lvl 3", "Kopi Susu"];

export function StoreProvider({ children }: { children: ReactNode }) {
  // ─── Auth ───
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Theme ───
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("theme") as "light" | "dark") || "light");

  // ─── Budget & Wallet ───
  const [budget, setBudgetState] = useState(() => parseInt(localStorage.getItem("budget") || "0", 10));
  const [globalPromo, setGlobalPromoState] = useState(() => localStorage.getItem("globalPromo") || "");
  const [flashPromos, setFlashPromos] = useState<FlashPromo[]>(() => {
    const saved = localStorage.getItem("flashPromos");
    return saved ? JSON.parse(saved) : [];
  });
  const [hideBalance, setHide] = useState(() => localStorage.getItem("hideBalance") === "true");
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  // ─── Campus & Settings ───
  const [campus, setCampusState] = useState(() => localStorage.getItem("campus") || "UMM");
  const [ghostMode, setGhostMode] = useState(false);
  const [showExpense, setShowExpense] = useState(true);

  // ─── User Profile ───
  const [user, setUserState] = useState(() => {
    const lastUser = localStorage.getItem("lastLoggedInUser");
    if (lastUser) {
      const saved = localStorage.getItem("userProfile_" + lastUser);
      if (saved) return JSON.parse(saved);
    }
    const legacy = localStorage.getItem("userProfile");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed?.name) return parsed;
    }
    return {
      name: "Rangga Pratama",
      bio: "Mahasiswa · Pemburu warkop murah 🍜",
      avatar: "R",
      banner: "",
      socials: { instagram: "", twitter: "" }
    };
  });

  // ─── Merchant ───
  const [merchant, setMerchant] = useState<Merchant>({
    onboarded: false,
    name: "",
    campus: "UMM",
    emoji: "🍜",
    status: "buka",
    price: "10k - 25k",
    menu: [],
    orders: [],
    views: 0,
  });
  const [merchantDbId, setMerchantDbId] = useState<string | null>(null);

  // ─── Sync localStorage ───
  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("budget", budget.toString());
    localStorage.setItem("globalPromo", globalPromo);
    localStorage.setItem("flashPromos", JSON.stringify(flashPromos));
    localStorage.setItem("hideBalance", hideBalance.toString());
    localStorage.setItem("campus", campus);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    if (user && user.name) {
      localStorage.setItem("userProfile_" + user.name, JSON.stringify(user));
      localStorage.setItem("lastLoggedInUser", user.name);
    }
  }, [theme, budget, globalPromo, flashPromos, hideBalance, campus, transactions, user]);

  // ─── Auth: Listen for session changes ───
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load all user data from Supabase ───
  const loadUserData = useCallback(async (userId: string) => {
    // Load profile
    const profile = await fetchProfile(userId);
    if (profile) {
      setUserState({ name: profile.name, bio: profile.bio, avatar: profile.avatar, banner: profile.banner, socials: profile.socials });
      setCampusState(profile.campus || "UMM");
      setBudgetState(profile.budget || 1500000);
      if (profile.theme === "dark" || profile.theme === "light") {
        setTheme(profile.theme);
      }
    }

    // Load transactions
    const txs = await fetchTransactions(userId);
    if (txs) {
      setTransactions(txs);
    }

    // Load merchant
    const m = await fetchMerchant(userId);
    if (m) {
      setMerchantDbId(m.dbId);
      setMerchant({
        onboarded: m.onboarded,
        name: m.name,
        campus: m.campus,
        emoji: m.emoji,
        status: m.status as "buka" | "ramai" | "tutup",
        price: m.price,
        lat: m.lat,
        lng: m.lng,
        menu: m.menu,
        orders: m.orders,
        views: m.views,
      });
    }
  }, []);

  // ─── Auth functions ───
  const login = async (username: string, password: string): Promise<string | null> => {
    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@nakam.local`;
    if (!supabase) {
      const saved = localStorage.getItem("userProfile_" + username);
      if (saved) {
        setUserState(JSON.parse(saved));
      } else {
        setUserState(prev => ({ ...prev, name: username, avatar: (username[0] || "M").toUpperCase() }));
      }
      return null; // No Supabase = allow any login and mock it
    }
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    if (error) return "Username atau password salah.";
    return null;
  };

  const signUp = async (username: string, password: string): Promise<string | null> => {
    const fakeEmail = `${username.toLowerCase().replace(/\s+/g, '')}@nakam.local`;
    if (!supabase) {
      setUserState({
        name: username,
        bio: "Mahasiswa · Pemburu warkop murah 🍜",
        avatar: (username[0] || "M").toUpperCase(),
        banner: "",
        socials: { instagram: "", twitter: "" }
      });
      return null;
    }
    const { data, error } = await supabase.auth.signUp({ email: fakeEmail, password });
    if (error) return error.message.includes("already registered") ? "Username sudah dipakai." : error.message;
    
    // Create initial profile
    if (data.user) {
      await upsertProfile({
        id: data.user.id,
        name: username,
        bio: "Mahasiswa · Pemburu warkop murah 🍜",
        avatar: (username[0] || "M").toUpperCase(),
        campus: "UMM",
        budget: 1500000,
        theme: "light",
      });
    }
    return null;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSupabaseUser(null);
    setMerchantDbId(null);
    setMerchant({
      onboarded: false,
      name: "",
      campus: "UMM",
      emoji: "🍜",
      status: "buka",
      price: "10k - 25k",
      menu: [],
      orders: [],
      views: 0,
    });
    setUserState({
      name: "",
      bio: "Mahasiswa · Pemburu warkop murah 🍜",
      avatar: "",
      banner: "",
      socials: { instagram: "", twitter: "" }
    });
    localStorage.removeItem("lastLoggedInUser");
  };

  // ─── Budget ───
  const setBudget = (n: number) => {
    setBudgetState(n);
    if (supabaseUser) {
      upsertProfile({ id: supabaseUser.id, budget: n });
    }
  };

  // ─── Campus ───
  const setCampus = (c: string) => {
    setCampusState(c);
    if (supabaseUser) {
      upsertProfile({ id: supabaseUser.id, campus: c });
    }
  };

  // ─── Promo ───
  const setGlobalPromo = (v: string) => {
    setGlobalPromoState(v);
  };

  const addFlashPromo = (p: Omit<FlashPromo, "id">) => {
    const promo = { ...p, id: "fp" + Date.now() + Math.random().toString(36).substring(2, 9) };
    setFlashPromos((prev) => [promo, ...prev]);

    if ("Notification" in window) {
      const showNotif = () => {
        new Notification(`⚡ Flash Promo di ${p.merchantName}`, {
          body: `Promo spesial ${p.menuName}! Waktu terbatas hingga ${new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        });
      };
      if (Notification.permission === "granted") {
        showNotif();
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") showNotif();
        });
      }
    }
  };

  // ─── User profile ───
  const setUser = (u: Store["user"]) => {
    setUserState(u);
    if (supabaseUser) {
      upsertProfile({ id: supabaseUser.id, name: u.name, bio: u.bio, avatar: u.avatar, banner: u.banner, socials: u.socials });
    }
  };

  // ─── Theme ───
  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      if (supabaseUser) upsertProfile({ id: supabaseUser.id, theme: next });
      return next;
    });
  };

  // ─── Transactions ───
  const spent = transactions.reduce((s, t) => s + t.amount, 0);

  const addExpense = (t: Omit<Transaction, "id" | "date">) => {
    const newTx: Transaction = {
      ...t,
      id: Math.random().toString(),
      date: "Baru saja",
    };
    setTransactions((prev) => [newTx, ...prev]);
    if (supabaseUser) {
      addTransactionToSupabase(supabaseUser.id, t);
    }
  };

  // ─── Merchant ───
  const finishOnboarding: Store["finishOnboarding"] = async ({ name, campus: mc, emoji, price, lat, lng, menu: menuItems }) => {
    setMerchant((m) => ({ ...m, onboarded: true, name, campus: mc, emoji, price, lat, lng, menu: menuItems, views: 12 }));

    if (supabaseUser) {
      const dbId = await upsertMerchant(supabaseUser.id, { name, campus: mc, emoji, price, lat, lng, onboarded: true });
      if (dbId) {
        setMerchantDbId(dbId);
        // Add menu items
        for (const item of menuItems) {
          const itemId = await addMenuItemToSupabase(dbId, { name: item.name, price: item.price, emoji: item.emoji, available: item.available });
          if (itemId) item.id = itemId;
        }
      }
    }
  };

  const setMerchantStatus = (s: Merchant["status"]) => {
    setMerchant((m) => ({ ...m, status: s }));
    if (merchantDbId) updateMerchantStatus(merchantDbId, s);
  };

  const setMerchantInfo: Store["setMerchantInfo"] = (info) => {
    setMerchant((m) => ({ ...m, ...info }));
    if (merchantDbId) {
      const dbInfo: any = {};
      if (info.name) dbInfo.name = info.name;
      if (info.emoji) dbInfo.emoji = info.emoji;
      if (info.price) dbInfo.price_range = info.price;
      if (info.campus) dbInfo.campus = info.campus;
      updateMerchantInfo(merchantDbId, dbInfo);
    }
  };

  const addMenuItem: Store["addMenuItem"] = async (item) => {
    const localId = "m" + Date.now() + Math.random().toString(36).substring(2, 9);
    const newItem: MerchantMenuItem = { ...item, id: localId, sold: 0 };
    setMerchant((m) => ({ ...m, menu: [...m.menu, newItem] }));

    if (merchantDbId) {
      const dbId = await addMenuItemToSupabase(merchantDbId, { name: item.name, price: item.price, emoji: item.emoji, available: item.available });
      if (dbId) {
        setMerchant((m) => ({ ...m, menu: m.menu.map((x) => (x.id === localId ? { ...x, id: dbId } : x)) }));
      }
    }
  };

  const updateMenuItem: Store["updateMenuItem"] = (id, patch) => {
    setMerchant((m) => ({ ...m, menu: m.menu.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    updateMenuItemInSupabase(id, patch);
  };

  const removeMenuItem = (id: string) => {
    setMerchant((m) => ({ ...m, menu: m.menu.filter((x) => x.id !== id) }));
    deleteMenuItemFromSupabase(id);
  };

  const toggleMenuAvailable = (id: string) => {
    setMerchant((m) => {
      const item = m.menu.find((x) => x.id === id);
      if (item) updateMenuItemInSupabase(id, { available: !item.available });
      return { ...m, menu: m.menu.map((x) => (x.id === id ? { ...x, available: !x.available } : x)) };
    });
  };

  const pushMockOrder = async () => {
    const item = merchant.menu.length
      ? merchant.menu[Math.floor(Math.random() * merchant.menu.length)].name
      : MOCK_ORDER_POOL[Math.floor(Math.random() * MOCK_ORDER_POOL.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    const localId = "o" + Date.now() + Math.random().toString(36).substring(2, 9);
    const viewsIncrement = Math.floor(Math.random() * 30) + 5;

    setMerchant((m) => ({
      ...m,
      orders: [{ id: localId, item, qty, time: "Baru saja", status: "baru" }, ...m.orders].slice(0, 10),
      views: m.views + viewsIncrement,
    }));

    if (merchantDbId) {
      const dbId = await insertMockOrder(merchantDbId, item, qty);
      if (dbId) {
        setMerchant((m) => ({ ...m, orders: m.orders.map((o) => (o.id === localId ? { ...o, id: dbId } : o)) }));
      }
      incrementMerchantViews(merchantDbId, viewsIncrement);
    }
  };

  const completeOrder = (id: string) => {
    setMerchant((m) => {
      const o = m.orders.find((x) => x.id === id);
      return {
        ...m,
        orders: m.orders.map((x) => (x.id === id ? { ...x, status: "selesai" } : x)),
        menu: o ? m.menu.map((x) => (x.name === o.item ? { ...x, sold: x.sold + o.qty } : x)) : m.menu,
      };
    });
    completeOrderInSupabase(id);
  };

  const deleteStore = async () => {
    if (merchantDbId) {
      await deleteMerchant(merchantDbId);
    }
    setMerchantDbId(null);
    setMerchant({
      onboarded: false,
      name: "",
      campus: "UMM",
      emoji: "🍜",
      status: "buka",
      price: "10k - 25k",
      lat: 0,
      lng: 0,
      menu: [],
      orders: [],
      views: 0,
    });
  };

  return (
    <Ctx.Provider
      value={{
        supabaseUser,
        authLoading,
        login,
        signUp,
        logout,
        theme,
        toggleTheme,
        budget,
        setBudget,
        spent,
        globalPromo,
        setGlobalPromo,
        flashPromos,
        addFlashPromo,
        addExpense,
        transactions,
        hideBalance,
        toggleHideBalance: () => setHide((h) => !h),
        campus,
        setCampus,
        ghostMode,
        setGhostMode,
        showExpense,
        setShowExpense,
        user,
        setUser,
        merchant,
        merchantDbId,
        finishOnboarding,
        setMerchantStatus,
        setMerchantInfo,
        addMenuItem,
        updateMenuItem,
        removeMenuItem,
        toggleMenuAvailable,
        pushMockOrder,
        completeOrder,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
};

export const fmtRp = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");
