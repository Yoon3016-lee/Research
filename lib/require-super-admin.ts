import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireSuperAdmin(): Promise<{
  userId: string;
  email: string | undefined;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect("/admin/login?notice=supabase-unavailable");
  }

  const admin = createSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    redirect("/admin/unauthorized");
  }

  return { userId: user.id, email: user.email };
}
