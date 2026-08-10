import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/billing/webhook",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
