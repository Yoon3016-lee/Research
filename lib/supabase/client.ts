import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

let browserClient:
  | ReturnType<typeof createClient<Database>>
  | undefined;

export const getSupabaseBrowserClient = () => {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 브라우저 환경변수가 설정되지 않았습니다.");
  }

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  return browserClient;
};

