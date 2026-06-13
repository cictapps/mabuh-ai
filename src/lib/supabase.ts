import { createClient } from "@supabase/supabase-js";
import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { supabaseStorage } from "./supabaseStorage";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project values.",
  );
}

const supabaseFetch: typeof globalThis.fetch = isTauri()
  ? tauriFetch
  : globalThis.fetch.bind(globalThis);

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: supabaseStorage,
  },
  global: {
    fetch: supabaseFetch,
  },
});
