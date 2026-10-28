import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl } from "./lib/api-url";

// Forwards /api to Django. Unlike next.config rewrites, this reads API_INTERNAL_URL per request,
// so the production image follows the URL given at run time instead of the one seen at build time.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/api/public/stats" || pathname === "/api/public/stats/") return NextResponse.next();
  return NextResponse.rewrite(new URL(pathname + search, apiBaseUrl()));
}

export const config = { matcher: "/api/:path*" };
