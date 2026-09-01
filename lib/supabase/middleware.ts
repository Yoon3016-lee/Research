import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessAdminPanel } from "@/lib/roles";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const path = request.nextUrl.pathname;
  const isAuthPage =
    path === "/admin/login" ||
    path === "/admin/signup" ||
    path === "/admin/unauthorized";
  const isPublicAiDemo = path === "/admin/surveys/ai-generate";

  let user: { id: string } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[middleware] supabase.auth.getUser:", error.message);
    } else {
      user = data.user;
    }
  } catch (err) {
    console.error("[middleware] Supabase에 연결할 수 없습니다(fetch failed). URL·네트워크를 확인하세요.", err);
    if (isAuthPage) {
      return supabaseResponse;
    }
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.searchParams.set("notice", "supabase-unavailable");
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  const isAdminPanel =
    path.startsWith("/admin") && !isAuthPage && !isPublicAiDemo;

  async function getProfileRole(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[middleware] profiles.role:", error.message);
      return null;
    }
    return data?.role ?? null;
  }

  if (isAdminPanel && !user) {
    const next = request.nextUrl.clone();
    next.pathname = "/admin/login";
    next.searchParams.set("next", path);
    return NextResponse.redirect(next);
  }

  if (isAdminPanel && user) {
    const role = await getProfileRole(user.id);
    if (!canAccessAdminPanel(role)) {
      const denied = request.nextUrl.clone();
      denied.pathname = "/admin/unauthorized";
      denied.search = "";
      return NextResponse.redirect(denied);
    }
  }

  if (user && (path === "/admin/login" || path === "/admin/signup")) {
    const role = await getProfileRole(user.id);
    if (canAccessAdminPanel(role)) {
      const next = request.nextUrl.clone();
      next.pathname = "/admin";
      return NextResponse.redirect(next);
    }
  }

  return supabaseResponse;
}
