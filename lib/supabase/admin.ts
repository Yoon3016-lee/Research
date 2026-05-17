import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 — Service Role은 RLS를 우회합니다.
 * 클라이언트 번들·브라우저로 절대 가져오지 마세요.
 */
export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
