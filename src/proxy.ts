import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic auth guard: redirects signed-out users away from protected pages
 * before they render. The real verification still happens server-side in each
 * page (the proxy only checks for the presence of the JWT cookie).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("jwt_token");
  if (!token) {
    const loginUrl = new URL("/auth", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/my-posts/:path*", "/profile/:path*", "/admin/:path*"],
};
