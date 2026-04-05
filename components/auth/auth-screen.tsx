"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, LogIn, Shield, User, UserPlus } from "lucide-react";

import {
  AuthAccount,
  createAndWriteSession,
  hashPin,
  verifyPin,
  writeAuthAccount,
} from "@/lib/auth";

interface AuthScreenProps {
  existingAccount: AuthAccount | null;
  onAuthenticated: () => void;
}

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function AuthScreen({
  existingAccount,
  onAuthenticated,
}: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">(
    existingAccount ? "login" : "signup",
  );
  const [name, setName] = useState(existingAccount?.displayName ?? "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (usePin && pin.length < 4) {
      setError("PIN en az 4 haneli olmalı.");
      return;
    }

    if (usePin && pin !== confirmPin) {
      setError("PIN'ler eşleşmiyor.");
      return;
    }

    const pinHash = usePin ? await hashPin(pin) : null;

    const account: AuthAccount = {
      id: crypto.randomUUID(),
      displayName: name.trim(),
      pin: pinHash,
      createdAt: new Date().toISOString(),
    };

    writeAuthAccount(account);
    createAndWriteSession(account.id);
    onAuthenticated();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!existingAccount) return;

    if (existingAccount.pin) {
      const valid = await verifyPin(pin, existingAccount.pin);
      if (!valid) {
        setError("PIN hatalı. Tekrar dene.");
        return;
      }
    }

    createAndWriteSession(existingAccount.id);
    onAuthenticated();
  };

  const switchToSignup = () => {
    setMode("signup");
    setName("");
    setPin("");
    setConfirmPin("");
    setError(null);
    setUsePin(false);
  };

  const switchToLogin = () => {
    setMode("login");
    setName(existingAccount?.displayName ?? "");
    setPin("");
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      {/* ── Background ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#07060F]" />

      <div
        className="aurora-orb"
        style={{
          width: "90vw",
          height: "90vw",
          maxWidth: 960,
          maxHeight: 960,
          top: "-25%",
          right: "-15%",
          background:
            "radial-gradient(circle at 38% 38%, rgba(124,58,237,0.90), rgba(109,40,217,0.55) 40%, rgba(79,70,229,0.18) 62%, transparent 75%)",
          filter: "blur(60px)",
          animation: "aurora-a 20s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "70vw",
          height: "70vw",
          maxWidth: 800,
          maxHeight: 800,
          top: "-18%",
          left: "-20%",
          background:
            "radial-gradient(circle at 52% 52%, rgba(37,99,235,0.75), rgba(29,78,216,0.40) 45%, transparent 68%)",
          filter: "blur(68px)",
          animation: "aurora-b 26s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "80vw",
          height: "65vw",
          maxWidth: 880,
          maxHeight: 720,
          bottom: "-24%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(circle at 50% 38%, rgba(139,92,246,0.65), rgba(124,58,237,0.28) 45%, transparent 68%)",
          filter: "blur(80px)",
          animation: "aurora-c 18s ease-in-out infinite 4s",
        }}
      />
      <div
        className="aurora-orb"
        style={{
          width: "48vw",
          height: "48vw",
          maxWidth: 560,
          maxHeight: 560,
          top: "35%",
          left: "-8%",
          background:
            "radial-gradient(circle, rgba(6,182,212,0.45), rgba(14,165,233,0.18) 50%, transparent 70%)",
          filter: "blur(56px)",
          animation: "aurora-d 23s ease-in-out infinite 8s",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_44%,transparent_25%,rgba(7,6,15,0.55)_100%)]" />
      <div className="aurora-noise" />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[440px]">
        <motion.div {...slideUp(0)} className="mb-8 flex justify-center">
          <div className="relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 backdrop-blur-md">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <span className="relative h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            <span className="relative text-xs font-medium uppercase tracking-[0.24em] text-sky-100/75">
              EXAM ASSIST
            </span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Signup ───────────────────────────────────────────────── */}
          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-3 text-center text-[2.6rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                Hesap oluştur
              </h1>
              <p className="mb-8 text-center text-[15px] leading-[1.75] text-slate-400">
                Sınav haftanda seni yönlendirecek kişisel çalışma alanın.
              </p>

              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Adın ve soyadın"
                    autoFocus
                    className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                {/* PIN toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setUsePin(!usePin);
                    setPin("");
                    setConfirmPin("");
                    setError(null);
                  }}
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200",
                    usePin
                      ? "border-sky-400/30 bg-sky-400/[0.08] text-sky-200"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-400",
                  ].join(" ")}
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {usePin ? "PIN koruması aktif" : "PIN ile koru (isteğe bağlı)"}
                    </p>
                    <p className="mt-0.5 text-xs opacity-60">
                      Giriş yaparken PIN sorulsun
                    </p>
                  </div>
                </button>

                <AnimatePresence>
                  {usePin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => {
                            setPin(e.target.value.replace(/\D/g, ""));
                            setError(null);
                          }}
                          placeholder="4-6 haneli PIN"
                          className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </div>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => {
                            setConfirmPin(e.target.value.replace(/\D/g, ""));
                            setError(null);
                          }}
                          placeholder="PIN tekrar"
                          className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-rose-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="group w-full rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Hesap oluştur
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              {existingAccount && (
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
                >
                  Zaten hesabın var mı?{" "}
                  <span className="underline underline-offset-4">Giriş yap</span>
                </button>
              )}

              <p className="mt-5 text-center text-xs text-slate-600">
                Tüm veriler cihazında saklanır
              </p>
            </motion.div>
          )}

          {/* ── Login ────────────────────────────────────────────────── */}
          {mode === "login" && existingAccount && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-3 text-center text-[2.6rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                Tekrar hoş geldin
              </h1>
              <p className="mb-8 text-center text-[15px] leading-[1.75] text-slate-400">
                {existingAccount.displayName}, çalışma alanın seni bekliyor.
              </p>

              <form onSubmit={handleLogin} className="space-y-3">
                {/* Identity badge — read-only */}
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10">
                    <User className="h-4 w-4 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {existingAccount.displayName}
                    </p>
                    <p className="text-[11px] text-slate-500">Kişisel çalışma alanı</p>
                  </div>
                </div>

                {existingAccount.pin && (
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ""));
                        setError(null);
                      }}
                      placeholder="PIN gir"
                      autoFocus
                      className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </div>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-rose-400"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="group w-full rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Giriş yap
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  if (!confirm("Farklı bir hesap oluşturmak mevcut çalışma verilerini siler. Devam etmek istiyor musun?")) return;
                  localStorage.clear();
                  switchToSignup();
                }}
                className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
              >
                Farklı hesap oluştur
              </button>

              <p className="mt-5 text-center text-xs text-slate-600">
                Tüm veriler cihazında saklanır
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
