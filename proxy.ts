import { NextResponse, type NextRequest } from "next/server";

import { resolveCanonicalRedirectUrl } from "@/lib/canonical-host";
import { applySecurityHeaders } from "@/lib/security-headers";

export function proxy(request: NextRequest) {
  const redirectUrl = resolveCanonicalRedirectUrl(request.nextUrl);

  if (redirectUrl) {
    return applySecurityHeaders(NextResponse.redirect(redirectUrl, 307));
  }

  return applySecurityHeaders(
    NextResponse.next({
      request,
    }),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
