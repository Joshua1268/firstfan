import { NextResponse, type NextRequest } from "next/server";
import { apiBaseUrl } from "./lib/api-url";

// Reads API_INTERNAL_URL per request, unlike rewrites fixed at build.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/api/public/stats" || pathname === "/api/public/stats/") return NextResponse.next();
  return NextResponse.rewrite(new URL(pathname + search, apiBaseUrl()));
}

export const config = { matcher: "/api/:path*" };
