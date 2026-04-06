import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, SESSION_COOKIE_NAME_HOST, SESSION_COOKIE_NAME_SECURE } from "@/lib/auth-constants";

const AUTH_ROUTES = ["/auth"];
const PUBLIC_ROUTES = [...AUTH_ROUTES];

/**
 * Proxy middleware for route protection.
 * - Unauthenticated users → redirect to /auth/login
 * - Authenticated users on /auth/* → redirect to dashboard
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // favicon.ico, etc.
  ) {
    return NextResponse.next();
  }

  const sessionToken =
    req.cookies.get(SESSION_COOKIE_NAME)?.value ||
    req.cookies.get(SESSION_COOKIE_NAME_SECURE)?.value ||
    req.cookies.get(SESSION_COOKIE_NAME_HOST)?.value;

  const isAuthenticated = !!sessionToken;
  const isAuthRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Authenticated user trying to access auth pages → redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated user trying to access protected pages → redirect to login
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
