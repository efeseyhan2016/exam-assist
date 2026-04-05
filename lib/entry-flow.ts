export function shouldForceWelcome(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("welcome") === "1";
}

export function readAuthFlowNotice(search: string): string | null {
  const params = new URLSearchParams(search);
  const error = params.get("error");
  const errorCode = params.get("error_code");
  const description = params.get("error_description");

  if (!error && !errorCode && !description) {
    return null;
  }

  const normalized = `${error ?? ""} ${errorCode ?? ""} ${description ?? ""}`.toLowerCase();

  if (normalized.includes("otp_expired") || normalized.includes("expired")) {
    return "E-posta linkinin süresi dolmuş görünüyor. Giriş ekranından tekrar devam edebilirsin.";
  }

  if (normalized.includes("access_denied")) {
    return "Bağlantı şu anda tamamlanamadı. Hesabına giriş yaparak devam edebilirsin.";
  }

  return "Hesap bağlantısı şu anda tamamlanamadı. Tekrar giriş yapabilirsin.";
}
