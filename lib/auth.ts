import { isSupabaseEnabled } from "@/lib/supabase/config";

/**
 * Local-first authentication layer for EXAM ASSIST.
 *
 * Stores a single account and session in localStorage.
 * No backend — everything stays on the user's device.
 *
 * PIN security: PINs are hashed with SHA-256 before storage.
 * Sessions expire after 30 days.
 */

export interface AuthAccount {
  id: string;
  displayName: string;
  /** SHA-256 hex hash of the PIN, or null if no PIN is set. */
  pin: string | null;
  createdAt: string;
}

export interface AuthSession {
  accountId: string;
  loggedInAt: string;
  /** ISO string — session is invalid after this point. */
  expiresAt: string;
}

const ACCOUNT_KEY = "examassist_auth_account";
const SESSION_KEY = "examassist_auth_session";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function isLocalAuthEnabledForRuntime(input?: {
  nodeEnv?: string;
  supabaseEnabled?: boolean;
}) {
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const supabaseEnabled = input?.supabaseEnabled ?? isSupabaseEnabled();

  return !(supabaseEnabled && nodeEnv === "production");
}

// ─── PIN Hashing ─────────────────────────────────────────────────────────────

/**
 * Hashes a PIN using SHA-256 with an account-scoped prefix.
 * Returns a hex string. Browser-only (uses Web Crypto API).
 */
export async function hashPin(pin: string, accountId?: string): Promise<string> {
  const encoder = new TextEncoder();
  // Prefix prevents cross-app hash reuse; account id prevents identical PINs from sharing hashes.
  const saltScope = accountId ? `${accountId}:` : "";
  const data = encoder.encode(`examassist:pin:${saltScope}${pin}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifies a raw PIN against a stored hash.
 * Returns true if the PIN matches, false otherwise.
 */
export async function verifyPin(
  rawPin: string,
  storedHash: string,
  accountId?: string,
): Promise<boolean> {
  if (accountId) {
    const accountScopedHash = await hashPin(rawPin, accountId);
    if (accountScopedHash === storedHash) {
      return true;
    }
  }

  // Backwards compat for accounts created before account-scoped PIN salts.
  const legacyHash = await hashPin(rawPin);
  return legacyHash === storedHash;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function readAuthAccount(): AuthAccount | null {
  if (typeof window === "undefined") return null;
  if (!isLocalAuthEnabledForRuntime()) return null;

  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      displayName: parsed.displayName,
      pin: typeof parsed.pin === "string" ? parsed.pin : null,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  if (!isLocalAuthEnabledForRuntime()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed.accountId !== "string" ||
      typeof parsed.loggedInAt !== "string"
    ) {
      return null;
    }

    // Backwards compat: sessions written before expiry was added have no expiresAt.
    // Preserve the original 30-day session window from loggedInAt instead of dropping users.
    const expiresAt =
      typeof parsed.expiresAt === "string"
        ? parsed.expiresAt
        : new Date(
            new Date(parsed.loggedInAt).getTime() + SESSION_DURATION_MS,
          ).toISOString();

    return {
      accountId: parsed.accountId,
      loggedInAt: parsed.loggedInAt,
      expiresAt,
    };
  } catch {
    return null;
  }
}

// ─── Write ───────────────────────────────────────────────────────────────────

export function writeAuthAccount(account: AuthAccount): void {
  if (typeof window === "undefined") return;
  if (!isLocalAuthEnabledForRuntime()) return;
  window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function writeAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  if (!isLocalAuthEnabledForRuntime()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Creates a new session with a 30-day expiry and writes it to storage. */
export function createAndWriteSession(accountId: string): void {
  const now = new Date();
  writeAuthSession({
    accountId,
    loggedInAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  });
}

// ─── Clear ───────────────────────────────────────────────────────────────────

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isSessionValid(
  account: AuthAccount | null,
  session: AuthSession | null,
): boolean {
  if (!account || !session) return false;
  if (session.accountId !== account.id) return false;

  // Check expiry
  const expiresAt = new Date(session.expiresAt).getTime();
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}
