import { supabase } from "@/services/supabase";
import type { Eatery } from "@/components/EateryDetail";
import type { Transaction, Merchant, MerchantMenuItem, MerchantOrder } from "@/store/store";

// ─── Types matching Supabase rows ───

type EateryRow = {
  id: string;
  name: string;
  image: string;
  walk_time: string;
  dominance: number;
  price_range: string;
  tags: string[];
  filters: string[];
  campus: string;
  lat: number;
  lng: number;
  gallery: string[];
};

type EateryMenuRow = {
  id: string;
  eatery_id: string;
  name: string;
  price: number;
  emoji: string;
};

// ─── Eateries ───

export async function fetchEateriesFromSupabase(
  campus: string
): Promise<(Eatery & { lat: number; lng: number; campus: string; filter: string[] })[] | null> {
  if (!supabase) return null;
  try {
    const { data: eateries, error } = await supabase
      .from("eateries")
      .select("*")
      .eq("campus", campus);

    if (error || !eateries) return null;

    // Fetch menus for these eateries
    const eateryIds = eateries.map((e: EateryRow) => e.id);
    const { data: menus } = await supabase
      .from("eatery_menu")
      .select("*")
      .in("eatery_id", eateryIds);

    const menuMap = new Map<string, EateryMenuRow[]>();
    (menus || []).forEach((m: EateryMenuRow) => {
      if (!menuMap.has(m.eatery_id)) menuMap.set(m.eatery_id, []);
      menuMap.get(m.eatery_id)!.push(m);
    });

    return eateries.map((e: EateryRow) => ({
      id: e.id,
      name: e.name,
      image: e.image || "",
      walk: e.walk_time || "5 mnt",
      dominance: e.dominance || 50,
      price: e.price_range || "10k - 25k",
      tags: e.tags || [],
      menu: (menuMap.get(e.id) || []).map((m) => ({
        name: m.name,
        price: m.price,
        emoji: m.emoji || "🍽️",
      })),
      gallery: e.gallery || [e.image],
      lat: e.lat || -7.95,
      lng: e.lng || 112.61,
      campus: e.campus,
      filter: e.filters || [],
    }));
  } catch {
    return null;
  }
}

export async function fetchAllEateriesForAdmin(): Promise<any[] | null> {
  if (!supabase) return null;
  try {
    const { data: eateries, error } = await supabase
      .from("eateries")
      .select("*")
      .order("campus", { ascending: true });

    if (error || !eateries) return null;
    return eateries;
  } catch {
    return null;
  }
}

export async function deleteEateryByAdmin(id: string): Promise<void> {
  if (!supabase || !id) return;
  try {
    await supabase.from("eateries").delete().eq("id", id);
  } catch {}
}

export async function adminAddEatery(
  data: { name: string; campus: string; emoji: string; price: string; lat: number; lng: number; image?: string; filters: string[]; menus?: {name: string; price: number; emoji: string}[] }
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: result, error } = await supabase.from("eateries").insert({
      name: data.name,
      campus: data.campus,
      price_range: data.price,
      lat: data.lat,
      lng: data.lng,
      image: data.image,
      filters: data.filters,
      tags: [],
      gallery: data.image ? [data.image] : [],
      dominance: 80,
      walk_time: "5 mnt",
    }).select("id").single();
    
    if (error || !result) return false;

    if (data.menus && data.menus.length > 0) {
      const menuRows = data.menus.map(m => ({
        eatery_id: result.id,
        name: m.name,
        price: m.price,
        emoji: m.emoji,
      }));
      await supabase.from("eatery_menu").insert(menuRows);
    }

    return true;
  } catch {
    return false;
  }
}

// ─── Profile ───

export type ProfileRow = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  campus: string;
  budget: number;
  theme: string;
  banner?: string;
  socials?: { instagram?: string; twitter?: string };
};

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return data as ProfileRow;
  } catch {
    return null;
  }
}

export async function upsertProfile(profile: Partial<ProfileRow> & { id: string }): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("profiles").upsert(profile, { onConflict: "id" });
  } catch {
    // silently fail
  }
}

// ─── Transactions ───

export async function fetchTransactions(userId: string): Promise<Transaction[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return null;
    return data.map((t: any) => ({
      id: t.id,
      place: t.place,
      items: t.items || [],
      amount: t.amount,
      date: formatRelativeTime(t.created_at),
      emoji: t.emoji || "🍽️",
    }));
  } catch {
    return null;
  }
}

export async function addTransactionToSupabase(
  userId: string,
  t: { place: string; items: string[]; amount: number; emoji: string }
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("transactions").insert({
      user_id: userId,
      place: t.place,
      items: t.items,
      amount: t.amount,
      emoji: t.emoji,
    });
  } catch {
    // silently fail
  }
}

// ─── Merchant ───

export async function fetchMerchant(userId: string): Promise<(Merchant & { dbId: string }) | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;

    // Fetch menu items
    const { data: menuItems } = await supabase
      .from("merchant_menu_items")
      .select("*")
      .eq("merchant_id", data.id);

    // Fetch orders
    const { data: orders } = await supabase
      .from("merchant_orders")
      .select("*")
      .eq("merchant_id", data.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return {
      dbId: data.id,
      onboarded: data.onboarded || false,
      name: data.name,
      campus: data.campus || "UMM",
      emoji: data.emoji || "🍜",
      status: data.status || "buka",
      price: data.price_range || "10k - 25k",
      lat: data.lat || -7.95,
      lng: data.lng || 112.61,
      menu: (menuItems || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        emoji: m.emoji || "🍳",
        available: m.available ?? true,
        sold: m.sold || 0,
      })),
      orders: (orders || []).map((o: any) => ({
        id: o.id,
        item: o.item,
        qty: o.qty || 1,
        time: formatRelativeTime(o.created_at),
        status: o.status || "baru",
      })),
      views: data.views || 0,
    };
  } catch {
    return null;
  }
}

export async function upsertMerchant(
  userId: string,
  data: { name: string; campus: string; emoji: string; price: string; lat: number; lng: number; onboarded: boolean; status?: string }
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: result, error } = await supabase
      .from("merchants")
      .upsert(
        {
          user_id: userId,
          name: data.name,
          campus: data.campus,
          emoji: data.emoji,
          price_range: data.price,
          lat: data.lat,
          lng: data.lng,
          onboarded: data.onboarded,
          status: data.status || "buka",
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (error || !result) return null;
    return result.id;
  } catch {
    return null;
  }
}

export async function deleteMerchant(merchantDbId: string): Promise<void> {
  if (!supabase || !merchantDbId) return;
  try {
    await supabase.from("merchants").delete().eq("id", merchantDbId);
  } catch {
    // silently fail
  }
}

export async function adminAddMerchant(
  data: { name: string; campus: string; emoji: string; price: string; lat: number; lng: number; image?: string }
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("merchants").insert({
      name: data.name,
      campus: data.campus,
      emoji: data.emoji,
      price_range: data.price,
      lat: data.lat,
      lng: data.lng,
      image: data.image,
      onboarded: true,
      status: "buka",
      // user_id is intentionally omitted for admin-created stores
    });
    return !error;
  } catch {
    return false;
  }
}

export async function updateMerchantStatus(merchantDbId: string, status: string): Promise<void> {
  if (!supabase || !merchantDbId) return;
  try {
    await supabase.from("merchants").update({ status }).eq("id", merchantDbId);
  } catch {}
}

export async function updateMerchantInfo(
  merchantDbId: string,
  info: Partial<{ name: string; emoji: string; price_range: string; campus: string }>
): Promise<void> {
  if (!supabase || !merchantDbId) return;
  try {
    await supabase.from("merchants").update(info).eq("id", merchantDbId);
  } catch {}
}

// ─── Merchant Menu Items ───

export async function addMenuItemToSupabase(
  merchantDbId: string,
  item: { name: string; price: number; emoji: string; available: boolean }
): Promise<string | null> {
  if (!supabase || !merchantDbId) return null;
  try {
    const { data, error } = await supabase
      .from("merchant_menu_items")
      .insert({ merchant_id: merchantDbId, ...item, sold: 0 })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function updateMenuItemInSupabase(
  itemId: string,
  patch: Partial<{ name: string; price: number; emoji: string; available: boolean }>
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("merchant_menu_items").update(patch).eq("id", itemId);
  } catch {}
}

export async function deleteMenuItemFromSupabase(itemId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("merchant_menu_items").delete().eq("id", itemId);
  } catch {}
}

// ─── Merchant Orders ───

export async function completeOrderInSupabase(orderId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("merchant_orders").update({ status: "selesai" }).eq("id", orderId);
  } catch {}
}

export async function insertMockOrder(merchantDbId: string, item: string, qty: number): Promise<string | null> {
  if (!supabase || !merchantDbId) return null;
  try {
    const { data, error } = await supabase
      .from("merchant_orders")
      .insert({ merchant_id: merchantDbId, item, qty, status: "baru" })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function incrementMerchantViews(merchantDbId: string, increment: number): Promise<void> {
  if (!supabase || !merchantDbId) return;
  try {
    // Read current views then update
    const { data } = await supabase.from("merchants").select("views").eq("id", merchantDbId).single();
    if (data) {
      await supabase.from("merchants").update({ views: (data.views || 0) + increment }).eq("id", merchantDbId);
    }
  } catch {}
}

// ─── Helpers ───

function formatRelativeTime(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  } catch {
    return "Baru saja";
  }
}

// ─── Storage ───

export async function uploadImageToSupabase(file: File): Promise<string | null> {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('nakam_uploads')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from('nakam_uploads').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Storage error:", err);
    return null;
  }
}
