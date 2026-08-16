import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function adminAllowlist(): string[] {
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(
            name,
            value,
            options as Parameters<NextResponse["cookies"]["set"]>[2],
          );
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    if (user?.email && adminAllowlist().includes(user.email.toLowerCase())) {
      const u = request.nextUrl.clone();
      u.pathname = "/admin/insights";
      u.search = "";
      return NextResponse.redirect(u);
    }
    return supabaseResponse;
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user?.email) {
      const u = request.nextUrl.clone();
      u.pathname = "/admin/login";
      u.searchParams.set("reason", "admin_login");
      return NextResponse.redirect(u);
    }
    const email = user.email.toLowerCase();
    if (!adminAllowlist().includes(email)) {
      const u = request.nextUrl.clone();
      u.pathname = "/";
      u.searchParams.set("notice", "admin_forbidden");
      return NextResponse.redirect(u);
    }
    return supabaseResponse;
  }

  if (pathname === "/register") {
    if (!user) {
      const u = request.nextUrl.clone();
      u.pathname = "/register";
      // Let the client-side gate handle the UX; server just ensures the session is refreshed.
      // We don't redirect so the Google login UI renders client-side on the page itself.
      return supabaseResponse;
    }
    return supabaseResponse;
  }

  if (pathname === "/partner/dashboard" || pathname.startsWith("/partner/dashboard/")) {
    if (!user) {
      const u = request.nextUrl.clone();
      u.pathname = "/partner/apply";
      u.searchParams.set("reason", "login");
      return NextResponse.redirect(u);
    }

    const { data: partner, error } = await supabase
      .from("partners")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !partner) {
      const u = request.nextUrl.clone();
      u.pathname = "/partner/apply";
      u.searchParams.set("reason", "no_profile");
      return NextResponse.redirect(u);
    }

    if (partner.status !== "approved") {
      const u = request.nextUrl.clone();
      u.pathname = "/partner/apply";
      u.searchParams.set("reason", partner.status === "rejected" ? "rejected" : "pending");
      return NextResponse.redirect(u);
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/partner/dashboard",
    "/partner/dashboard/:path*",
    "/register",
  ],
};
