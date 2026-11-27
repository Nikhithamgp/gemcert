import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: bounce visitors without a session cookie away from
 * staff pages. Real authentication/authorisation happens server-side in every
 * page, action and route handler (see src/lib/auth/dal.ts).
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("__Host-gc_session") || request.cookies.has("gc_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/print/:path*"],
};
