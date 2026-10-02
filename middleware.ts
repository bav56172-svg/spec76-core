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

// Reserved for Release 0.4 Waves 2–3 (User Experience / Audit) admin
// surfaces. No route lives under /api/admin/* yet — this establishes the
// enforcement point now so future admin routes are protected by default
// instead of needing a per-route check added later.
function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

// OP-024: the page itself (not just its future API routes) needs
// server-side protection too — /admin renders a client-side "access
// denied" fallback, but that alone would still let the page's JS bundle
// and its data-fetching calls start before the check resolves. Blocking
// at the edge is a stronger guarantee than the same check happening
// client-side.
function isAdminPagePath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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

  if (isAdminApiPath(pathname) || isAdminPagePath(pathname)) {
    const { data: hasRole, error: roleError } = await supabase.rpc(
      "has_platform_role",
      { allowed_roles: ["moderator", "administrator", "platform_owner"] },
    );

    if (roleError || !hasRole) {
      if (isAdminApiPath(pathname)) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Недостаточно прав для доступа к этому разделу.",
          },
          { status: 403 },
        );
      }

      // Page path: redirect home rather than return raw JSON to a browser.
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
