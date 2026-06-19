import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  menu: MerchantMenuItem[];
  orders: MerchantOrder[];
  views: number;
};

type Store = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  budget: number;
  setBudget: (n: number) => void;
  spent: number;
  addExpense: (t: Omit<Transaction, "id" | "date">) => void;
  transactions: Transaction[];
  hideBalance: boolean;
  toggleHideBalance: () => void;
  campus: string;
  setCampus: (c: string) => void;
  ghostMode: boolean;
  setGhostMode: (v: boolean) => void;
  showExpense: boolean;
  setShowExpense: (v: boolean) => void;
  user: { name: string; bio: string; avatar: string };
  setUser: (u: Store["user"]) => void;
  merchant: Merchant;
  finishOnboarding: (data: { name: string; campus: string; emoji: string; price: string; menu: MerchantMenuItem[] }) => void;
  setMerchantStatus: (s: Merchant["status"]) => void;
  setMerchantInfo: (info: Partial<Pick<Merchant, "name" | "emoji" | "price" | "campus">>) => void;
  addMenuItem: (m: Omit<MerchantMenuItem, "id" | "sold">) => void;
  updateMenuItem: (id: string, m: Partial<MerchantMenuItem>) => void;
  removeMenuItem: (id: string) => void;
  toggleMenuAvailable: (id: string) => void;
  pushMockOrder: () => void;
  completeOrder: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

const MOCK_ORDER_POOL = ["Nasi Goreng", "Es Teh Jumbo", "Mie Godog", "Indomie Telor", "Geprek Lvl 3", "Kopi Susu"];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("theme") as "light" | "dark") || "light");
  const [budget, setBudget] = useState(() => parseInt(localStorage.getItem("budget") || "0", 10));
  const [hideBalance, setHide] = useState(() => localStorage.getItem("hideBalance") === "true");
  const [campus, setCampus] = useState(() => localStorage.getItem("campus") || "Kampus 1");
  const [ghostMode, setGhostMode] = useState(false);
  const [showExpense, setShowExpense] = useState(true);
  const [user, setUser] = useState({
    name: "Rangga Pratama",
    bio: "Mahasiswa · Pemburu warkop murah 🍜",
    avatar: "R",
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("budget", budget.toString());
    localStorage.setItem("hideBalance", hideBalance.toString());
    localStorage.setItem("campus", campus);
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [theme, budget, hideBalance, campus, transactions]);

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

  const spent = transactions.reduce((s, t) => s + t.amount, 0);

  const addExpense = (t: Omit<Transaction, "id" | "date">) => {
    setTransactions((prev) => [
      { ...t, id: "t" + Date.now() + Math.random().toString(36).substring(2, 9), date: "Baru saja" },
      ...prev,
    ]);
  };

  const finishOnboarding: Store["finishOnboarding"] = ({ name, campus, emoji, price, menu }) => {
    setMerchant((m) => ({ ...m, onboarded: true, name, campus, emoji, price, menu, views: 12 }));
  };
  const setMerchantStatus = (s: Merchant["status"]) => setMerchant((m) => ({ ...m, status: s }));
  const setMerchantInfo: Store["setMerchantInfo"] = (info) => setMerchant((m) => ({ ...m, ...info }));
  const addMenuItem: Store["addMenuItem"] = (item) =>
    setMerchant((m) => ({ ...m, menu: [...m.menu, { ...item, id: "m" + Date.now() + Math.random().toString(36).substring(2, 9), sold: 0 }] }));
  const updateMenuItem: Store["updateMenuItem"] = (id, patch) =>
    setMerchant((m) => ({ ...m, menu: m.menu.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeMenuItem = (id: string) => setMerchant((m) => ({ ...m, menu: m.menu.filter((x) => x.id !== id) }));
  const toggleMenuAvailable = (id: string) =>
    setMerchant((m) => ({ ...m, menu: m.menu.map((x) => (x.id === id ? { ...x, available: !x.available } : x)) }));
  const pushMockOrder = () => {
    setMerchant((m) => {
      const item = m.menu.length
        ? m.menu[Math.floor(Math.random() * m.menu.length)].name
        : MOCK_ORDER_POOL[Math.floor(Math.random() * MOCK_ORDER_POOL.length)];
      return {
        ...m,
        orders: [
          { id: "o" + Date.now() + Math.random().toString(36).substring(2, 9), item, qty: 1 + Math.floor(Math.random() * 3), time: "Baru saja", status: "baru" },
          ...m.orders,
        ].slice(0, 10),
        views: m.views + Math.floor(Math.random() * 30) + 5,
      };
    });
  };
  const completeOrder = (id: string) =>
    setMerchant((m) => {
      const o = m.orders.find((x) => x.id === id);
      return {
        ...m,
        orders: m.orders.map((x) => (x.id === id ? { ...x, status: "selesai" } : x)),
        menu: o ? m.menu.map((x) => (x.name === o.item ? { ...x, sold: x.sold + o.qty } : x)) : m.menu,
      };
    });

  return (
    <Ctx.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
        budget,
        setBudget,
        spent,
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
