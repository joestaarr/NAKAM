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
  timestamp?: string;
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

export type AppNotification = {
  id: string;
  type: "broadcast" | "flash_promo" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
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
  addExpense: (t: Omit<Transaction, "id" | "date" | "timestamp">) => void;
  transactions: Transaction[];
  hideBalance: boolean;
  toggleHideBalance: () => void;
  // Notifications
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "read" | "time">) => void;
  markNotificationsAsRead: () => void;
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

// Helper: create per-user localStorage key
function userKey(username: string, key: string) {
  return `${key}__${username}`;
}

// Helper: load from per-user localStorage with fallback to global key (migration)
function loadUserLS<T>(username: string, key: string, fallback: T): T {
  // Try per-user key first
  const perUser = localStorage.getItem(userKey(username, key));
  if (perUser !== null) {
    try { return JSON.parse(perUser); } catch { return perUser as unknown as T; }
  }
  // Fallback to old global key for migration
  const global = localStorage.getItem(key);
  if (global !== null) {
    try { return JSON.parse(global); } catch { return global as unknown as T; }
  }
  return fallback;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // ─── Auth ───
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Theme ───
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("theme") as "light" | "dark") || "light");

  // ─── Budget & Wallet ───
  const [budget, setBudgetState] = useState(0);
  const [globalPromo, setGlobalPromoState] = useState(() => localStorage.getItem("globalPromo") || "");
  const [flashPromos, setFlashPromos] = useState<FlashPromo[]>(() => {
    const saved = localStorage.getItem("flashPromos");
    return saved ? JSON.parse(saved) : [];
  });
  const [hideBalance, setHide] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("appNotifications");
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
      name: "",
      bio: "Mahasiswa · Pemburu warkop murah 🍜",
      avatar: "",
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

  // ─── Helper: restore per-user local state from localStorage ───
  const restoreLocalUserState = useCallback((username: string) => {
    setTransactions(loadUserLS<Transaction[]>(username, "transactions", []));
    setBudgetState(loadUserLS<number>(username, "budget", 0));
    setHide(loadUserLS<boolean>(username, "hideBalance", false));
    setCampusState(loadUserLS<string>(username, "campus", "UMM"));
    const savedTheme = loadUserLS<string>(username, "theme", "light");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  }, []);

  // ─── Sync localStorage (per-user) ───
  useEffect(() => {
    if (!user || !user.name) return;
    const uname = user.name;
    localStorage.setItem("theme", theme);
    localStorage.setItem(userKey(uname, "theme"), JSON.stringify(theme));
    localStorage.setItem(userKey(uname, "budget"), JSON.stringify(budget));
    localStorage.setItem("globalPromo", globalPromo);
    localStorage.setItem("flashPromos", JSON.stringify(flashPromos));
    localStorage.setItem(userKey(uname, "hideBalance"), JSON.stringify(hideBalance));
    localStorage.setItem(userKey(uname, "campus"), JSON.stringify(campus));
    localStorage.setItem(userKey(uname, "transactions"), JSON.stringify(transactions));
    localStorage.setItem("appNotifications", JSON.stringify(notifications));
    localStorage.setItem("userProfile_" + uname, JSON.stringify(user));
    localStorage.setItem("lastLoggedInUser", uname);
  }, [theme, budget, globalPromo, flashPromos, hideBalance, campus, transactions, user, notifications]);

  // ─── Auth: Listen for session changes ───
  useEffect(() => {
    if (!supabase) {
      // In local mode, restore per-user data for the last logged-in user on mount
      const lastUser = localStorage.getItem("lastLoggedInUser");
      if (lastUser) {
        restoreLocalUserState(lastUser);
      }
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
    const fakeEmail = `${btoa(username).replace(/=/g, '')}@nakam.local`;
    if (!supabase) {
      const saved = localStorage.getItem("userProfile_" + username);
      if (saved) {
        setUserState(JSON.parse(saved));
      } else {
        setUserState({ name: username, bio: "Mahasiswa · Pemburu warkop murah 🍜", avatar: (username[0] || "M").toUpperCase(), banner: "", socials: { instagram: "", twitter: "" } });
      }
      // Restore per-user data from localStorage
      restoreLocalUserState(username);
      return null; // No Supabase = allow any login and mock it
    }
    const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    if (error) return "Username atau password salah.";
    return null;
  };

  const signUp = async (username: string, password: string): Promise<string | null> => {
    if (username.toLowerCase() === "admincuy" || username.toLowerCase() === "admin") {
      return "Username ini tidak tersedia.";
    }
    
    // Gunakan btoa untuk memastikan email unik secara case-sensitive di Supabase (karena Supabase melowercase email)
    const fakeEmail = `${btoa(username).replace(/=/g, '')}@nakam.local`;
    if (!supabase) {
      // Check if username already exists locally (case-sensitive)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("userProfile_")) {
          const existingUsername = key.substring("userProfile_".length);
          if (existingUsername === username) {
            return "Username sudah dipakai.";
          }
        }
      }

      setUserState({
        name: username,
        bio: "Mahasiswa · Pemburu warkop murah 🍜",
        avatar: (username[0] || "M").toUpperCase(),
        banner: "",
        socials: { instagram: "", twitter: "" }
      });
      // New account: initialize with empty per-user data
      restoreLocalUserState(username);
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
    localStorage.removeItem("userProfile"); // Clean up legacy profile as well
    
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Logout error", err);
      }
    }
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
  const addNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void = (n) => {
    setNotifications(prev => [
      {
        ...n,
        id: Date.now().toString(),
        time: new Date().toISOString(),
        read: false
      },
      ...prev
    ]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // ─── Realtime Promos Sync ───
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel("public-promos");
    
    channel.on("broadcast", { event: "new_flash_promo" }, (payload) => {
      const p = payload.payload;
      setFlashPromos((prev) => {
        if (prev.find((x) => x.id === p.id)) return prev;
        return [p, ...prev];
      });
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          type: "flash_promo",
          title: `⚡ Promo dari ${p.merchantName}`,
          message: `Diskon spesial untuk ${p.menuName} sedang berlangsung! Cepat sikat sebelum kehabisan!`,
          time: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
    });

    channel.on("broadcast", { event: "new_global_promo" }, (payload) => {
      const v = payload.payload.message;
      setGlobalPromoState(v);
      if (v) {
        setNotifications((prev) => [
          {
            id: Date.now().toString(),
            type: "broadcast",
            title: "📢 Broadcast Spesial!",
            message: v,
            time: new Date().toISOString(),
            read: false
          },
          ...prev
        ]);
      }
    });

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setGlobalPromo = (v: string) => {
    setGlobalPromoState(v);
    if (v) {
      addNotification({
        type: "broadcast",
        title: "📢 Broadcast Spesial!",
        message: v
      });
    }
    if (supabase) {
      supabase.channel("public-promos").send({
        type: "broadcast",
        event: "new_global_promo",
        payload: { message: v }
      }).catch(console.error);
    }
  };

  const addFlashPromo = (p: Omit<FlashPromo, "id">) => {
    const promo = { ...p, id: "fp" + Date.now() + Math.random().toString(36).substring(2, 9) };
    setFlashPromos((prev) => [promo, ...prev]);

    addNotification({
      type: "flash_promo",
      title: `⚡ Promo dari ${p.merchantName}`,
      message: `Diskon spesial untuk ${p.menuName} sedang berlangsung! Cepat sikat sebelum kehabisan!`
    });

    if (supabase) {
      supabase.channel("public-promos").send({
        type: "broadcast",
        event: "new_flash_promo",
        payload: promo
      }).catch(console.error);
    }

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

  const addExpense = (t: Omit<Transaction, "id" | "date" | "timestamp">) => {
    const newTx: Transaction = {
      ...t,
      id: Math.random().toString(),
      date: "Baru saja",
      timestamp: new Date().toISOString(),
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
        notifications,
        addNotification,
        markNotificationsAsRead,
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
        deleteStore,
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
