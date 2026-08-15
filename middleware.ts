import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { UsageBilling } from "@/services/usageBilling";

const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/billing/webhook",
]);

function isAiApiPath(pathname: string): boolean {
  return pathname === "/api/ai" || pathname.startsWith("/api/ai/");
}

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

  if (isAiApiPath(pathname)) {
    // Fast RLS-protected preflight for every AI endpoint. The authoritative
    // concurrency-safe check is reserve_ai_usage(), called by an AI route
    // before provider execution. No AI provider route is enabled yet.
    const rateLimit = await UsageBilling.checkRateLimit(
      supabase,
      user.id,
    );

    if (rateLimit.error) {
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "Не удалось безопасно проверить лимит ИИ-запросов.",
        },
        {
          status: 503,
          headers: {
            "Retry-After": "60",
          },
        },
      );
    }

    if (!rateLimit.data.allowed) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Слишком много запросов к ИИ. Повторите попытку через минуту.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.data.retryAfterSeconds),
          },
        },
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
