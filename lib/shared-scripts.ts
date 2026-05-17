import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SharedResponseScript = {
  id: string;
  title: string;
  body: string;
  sortOrder: number;
};

type Row = {
  id: string;
  title: string;
  body: string;
  sort_order: number;
};

function mapRow(row: Row): SharedResponseScript {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    sortOrder: row.sort_order,
  };
}

export async function listSharedResponseScripts(): Promise<SharedResponseScript[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const admin = createSupabaseServiceRoleClient();
  const { data, error } = await admin
    .from("shared_response_scripts")
    .select("id, title, body, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listSharedResponseScripts]", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapRow(row as Row));
}
