"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  const config = readSupabasePublicConfig();

  if (!config) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.key);
  }

  return browserClient;
}
