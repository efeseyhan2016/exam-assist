export const CANONICAL_APP_HOST = "exam-assist.vercel.app";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export function resolveCanonicalRedirectUrl(input: URL): string | null {
  const hostname = input.hostname.toLowerCase();

  if (isLocalHost(hostname) || hostname === CANONICAL_APP_HOST) {
    return null;
  }

  if (!hostname.endsWith(".vercel.app")) {
    return null;
  }

  const redirectUrl = new URL(input.toString());
  redirectUrl.protocol = "https:";
  redirectUrl.hostname = CANONICAL_APP_HOST;
  return redirectUrl.toString();
}
