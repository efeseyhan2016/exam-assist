import type { NextResponse } from "next/server";

interface SecurityHeadersOptions {
  nodeEnv?: string;
  supabaseUrl?: string | null;
}

function readSupabaseOrigins(supabaseUrl?: string | null) {
  const rawUrl =
    supabaseUrl ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "";

  if (!rawUrl.trim()) {
    return [];
  }

  try {
    const origin = new URL(rawUrl).origin;
    const websocketOrigin = origin.startsWith("https://")
      ? origin.replace("https://", "wss://")
      : origin.startsWith("http://")
        ? origin.replace("http://", "ws://")
        : null;

    return websocketOrigin ? [origin, websocketOrigin] : [origin];
  } catch {
    return [];
  }
}

export function buildContentSecurityPolicy(
  options: SecurityHeadersOptions = {},
) {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const connectSources = new Set<string>([
    "'self'",
    ...readSupabaseOrigins(options.supabaseUrl),
  ]);

  if (connectSources.size === 1) {
    connectSources.add("https://*.supabase.co");
    connectSources.add("wss://*.supabase.co");
  }

  const scriptSources = ["'self'", "'unsafe-inline'"];
  if (!isProduction) {
    scriptSources.push("'unsafe-eval'");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${[...connectSources].join(" ")}`,
    "worker-src 'self' blob:",
    "frame-src 'self' blob:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(
  response: NextResponse,
  options: SecurityHeadersOptions = {},
) {
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(options),
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );

  return response;
}
