import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

// Only create a real client if credentials are provided
export const supabase =
  supabaseUrl && supabaseKey && supabaseUrl !== "https://your-project.supabase.co"
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const isSupabaseConfigured = () => supabase !== null;
