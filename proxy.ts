import { NextResponse, type NextRequest } from "next/server";

import { resolveCanonicalRedirectUrl } from "@/lib/canonical-host";

export function proxy(request: NextRequest) {
  const redirectUrl = resolveCanonicalRedirectUrl(request.nextUrl);

  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl, 307);
  }

  return NextResponse.next({
    request,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
