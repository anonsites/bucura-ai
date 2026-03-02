import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/chat", "/settings", "/feedback", "/billing"];
const authRedirectRoutes = new Set(["/login", "/signup", "/register"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (authRedirectRoutes.has(pathname)) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("auth", pathname === "/login" ? "login" : "signup");
    const requestedRedirect = request.nextUrl.searchParams.get("redirect");
    if (requestedRedirect) {
      homeUrl.searchParams.set("redirect", requestedRedirect);
    }
    return NextResponse.redirect(homeUrl);
  }

  const needsAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("auth", "login");
    homeUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/settings/:path*",
    "/feedback/:path*",
    "/billing/:path*",
    "/login",
    "/signup",
    "/register",
  ],
};
