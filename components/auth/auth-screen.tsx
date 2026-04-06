"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, LogIn, Shield, User, UserPlus } from "lucide-react";

import {
  AuthAccount,
  createAndWriteSession,
  hashPin,
  verifyPin,
  writeAuthAccount,
} from "@/lib/auth";
import {
  signInWithCloudAuth,
  signOutCloudAuth,
  signUpWithCloudAuth,
} from "@/lib/cloud-auth";
import { isSupabaseEnabled } from "@/lib/supabase/config";

type ExistingAuthAccount = AuthAccount & { email?: string };

interface AuthScreenProps {
  existingAccount: ExistingAuthAccount | null;
  onAuthenticated: () => void;
  initialNotice?: string | null;
}

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function AuthScreen({
  existingAccount,
  onAuthenticated,
  initialNotice,
}: AuthScreenProps) {
  const cloudEnabled = isSupabaseEnabled();
  const [mode, setMode] = useState<"login" | "signup">(
    cloudEnabled ? "login" : existingAccount ? "login" : "signup",
  );
  const [name, setName] = useState(cloudEnabled ? "" : existingAccount?.displayName ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(initialNotice ?? null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(
      cloudEnabled ? "login" : existingAccount ? "login" : "signup",
    );
    setName(cloudEnabled ? "" : existingAccount?.displayName ?? "");
    setEmail("");
    setPassword("");
  }, [cloudEnabled, existingAccount]);

  useEffect(() => {
    setInfo(initialNotice ?? null);
  }, [initialNotice]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (cloudEnabled) {
      if (!email.trim()) {
        setError("E-posta adresini ekleyebilirsin.");
        return;
      }

      if (password.length < 6) {
        setError("Şifre en az 6 karakter olmalı.");
        return;
      }

      if (password !== confirmValue) {
        setError("Şifreler eşleşmiyor.");
        return;
      }

      try {
        setSubmitting(true);
        setError(null);
        setInfo(null);
        const normalizedEmail = email.trim().toLowerCase();
        const result = await signUpWithCloudAuth({
          name: name.trim(),
          email: normalizedEmail,
          password,
        });

        if (result.signupState === "existing_account") {
          setPendingConfirmationEmail(null);
          setInfo("Bu e-posta ile zaten bir hesap var. Şifrenle giriş yapabilirsin.");
          setMode("login");
          setPassword("");
          setConfirmValue("");
          return;
        }

        if (result.signupState === "confirm_email") {
          setPendingConfirmationEmail(normalizedEmail);
          setInfo(
            "Hesabını açtık. Onay e-postasını doğruladıktan sonra giriş yapabilirsin.",
          );
          setMode("login");
          setPassword("");
          setConfirmValue("");
          return;
        }

        setPendingConfirmationEmail(null);
        onAuthenticated();
      } catch (signupError) {
        setError(
          signupError instanceof Error
            ? signupError.message
            : "Hesap şu anda oluşturulamadı.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (usePin && pin.length < 4) {
      setError("PIN en az 4 haneli olmalı.");
      return;
    }

    if (usePin && pin !== confirmValue) {
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

    if (cloudEnabled) {
      if (!email.trim() || !password.trim()) {
        setError("E-posta ve şifreyi birlikte gir.");
        return;
      }

      try {
        setSubmitting(true);
        setError(null);
        setInfo(null);
        const normalizedEmail = email.trim().toLowerCase();
        await signInWithCloudAuth({
          email: normalizedEmail,
          password,
        });
        setPendingConfirmationEmail(null);
        onAuthenticated();
      } catch (loginError) {
        const isPendingConfirmationAttempt =
          pendingConfirmationEmail === email.trim().toLowerCase() &&
          loginError instanceof Error &&
          loginError.message.toLowerCase().includes("e-posta veya şifre hatalı");

        setError(
          isPendingConfirmationAttempt
            ? "Bu hesap henüz doğrulanmadıysa giriş tamamlanmaz. Maildeki onay linkini açıp tekrar dene."
            : loginError instanceof Error
              ? loginError.message
              : "Giriş şu anda tamamlanamadı.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
    setEmail("");
    setPassword("");
    setPin("");
    setConfirmValue("");
    setError(null);
    setInfo(null);
    setPendingConfirmationEmail(null);
    setUsePin(false);
  };

  const switchToLogin = () => {
    setMode("login");
    setName(existingAccount?.displayName ?? "");
    setPassword("");
    setPin("");
    setConfirmValue("");
    setError(null);
    setInfo(null);
    setPendingConfirmationEmail(null);
  };

  const handleContinue = () => {
    setError(null);
    setInfo(null);
    onAuthenticated();
  };

  const handleUseAnotherAccount = async (nextMode: "login" | "signup") => {
    if (cloudEnabled) {
      await signOutCloudAuth();
    }
    setMode(nextMode);
    setName(nextMode === "signup" ? "" : existingAccount?.displayName ?? "");
    setEmail("");
    setPassword("");
    setConfirmValue("");
    setError(null);
    setInfo(null);
    setPendingConfirmationEmail(null);
  };

  const helperCopy = cloudEnabled
    ? {
        titleSignup: "Hesabını aç",
        body: "Hesabınla giriş yaptığında çalışma alanın aynı hesap altında kalır.",
        footer: "Profilin ve çalışma alanın hesabına bağlı olarak devam eder.",
      }
    : {
        titleSignup: "Hesap oluştur",
        body: "Sınav haftanda seni yönlendirecek kişisel çalışma alanın.",
        footer: "Tüm veriler cihazında saklanır",
      };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
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
          {mode === "signup" ? (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="mb-3 text-center text-[2.6rem] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                {helperCopy.titleSignup}
              </h1>
              <p className="mb-8 text-center text-[15px] leading-[1.75] text-slate-400">
                {helperCopy.body}
              </p>

              {cloudEnabled && existingAccount ? (
                <div className="mb-5 space-y-3 rounded-[28px] border border-white/[0.10] bg-white/[0.03] p-3 backdrop-blur-sm">
                  <p className="px-1 text-center text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Bu cihazda kayıtlı hesap
                  </p>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10">
                      <User className="h-4 w-4 text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {existingAccount.displayName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {existingAccount.email ?? "Kayıtlı profil"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400/25 hover:text-white"
                  >
                    Bu hesapla devam et
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUseAnotherAccount("signup")}
                    className="w-full text-center text-sm text-slate-400 transition hover:text-slate-200"
                  >
                    Farklı hesapla kayıt ol
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                      setInfo(null);
                    }}
                    placeholder="Adın ve soyadın"
                    autoFocus
                    className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                  />
                </div>

                {cloudEnabled ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                          setInfo(null);
                        }}
                        placeholder="E-posta adresin"
                        className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                          setInfo(null);
                        }}
                        placeholder="Şifre oluştur"
                        className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={confirmValue}
                        onChange={(e) => {
                          setConfirmValue(e.target.value);
                          setError(null);
                          setInfo(null);
                        }}
                        placeholder="Şifre tekrar"
                        className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUsePin(!usePin);
                        setPin("");
                        setConfirmValue("");
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
                      {usePin ? (
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
                              value={confirmValue}
                              onChange={(e) => {
                                setConfirmValue(e.target.value.replace(/\D/g, ""));
                                setError(null);
                              }}
                              placeholder="PIN tekrar"
                              className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </>
                )}

                {error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-rose-400"
                  >
                    {error}
                  </motion.p>
                ) : null}

                {info ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-sky-200"
                  >
                    {info}
                  </motion.p>
                ) : null}

                <button
                  type="submit"
                  disabled={!name.trim() || submitting}
                  className="group w-full rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {cloudEnabled ? "Devam et" : "Hesap oluştur"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              {(existingAccount || cloudEnabled) ? (
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
                >
                  Zaten hesabın var mı?{" "}
                  <span className="underline underline-offset-4">Giriş yap</span>
                </button>
              ) : null}

              <p className="mt-5 text-center text-xs text-slate-600">
                {helperCopy.footer}
              </p>
            </motion.div>
          ) : (
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
                {cloudEnabled
                  ? "Hesabına gir, sonra kaldığın yerden devam edelim."
                  : `${existingAccount?.displayName}, çalışma alanın seni bekliyor.`}
              </p>

              {cloudEnabled && existingAccount ? (
                <div className="mb-5 space-y-3 rounded-[28px] border border-white/[0.10] bg-white/[0.03] p-3 backdrop-blur-sm">
                  <p className="px-1 text-center text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Bu cihazda kayıtlı hesap
                  </p>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10">
                      <User className="h-4 w-4 text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {existingAccount.displayName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {existingAccount.email ?? "Kayıtlı profil"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-400/25 hover:text-white"
                  >
                    Bu hesapla devam et
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleUseAnotherAccount("login")}
                    className="w-full text-center text-sm text-slate-400 transition hover:text-slate-200"
                  >
                    Farklı hesapla giriş yap
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-3">
                {cloudEnabled ? (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                        setInfo(null);
                      }}
                      placeholder="E-posta adresin"
                      autoFocus
                      className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10">
                      <User className="h-4 w-4 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {existingAccount?.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500">Kişisel çalışma alanı</p>
                    </div>
                  </div>
                )}

                {cloudEnabled || existingAccount?.pin ? (
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      inputMode={cloudEnabled ? undefined : "numeric"}
                      maxLength={cloudEnabled ? undefined : 6}
                      value={cloudEnabled ? password : pin}
                      onChange={(e) => {
                        if (cloudEnabled) {
                          setPassword(e.target.value);
                        } else {
                          setPin(e.target.value.replace(/\D/g, ""));
                        }
                        setError(null);
                        setInfo(null);
                      }}
                      placeholder={cloudEnabled ? "Şifren" : "PIN gir"}
                      autoFocus={!cloudEnabled}
                      className="w-full rounded-2xl border border-white/[0.12] bg-black/[0.38] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-sm transition-all duration-200 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </div>
                ) : null}

                {error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-rose-400"
                  >
                    {error}
                  </motion.p>
                ) : null}

                {info ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-sky-200"
                  >
                    {info}
                  </motion.p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || (cloudEnabled ? !email.trim() || !password.trim() : false)}
                  className="group w-full rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(14,165,233,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-200 hover:from-sky-300 hover:to-sky-500 hover:shadow-[0_0_52px_rgba(14,165,233,0.44)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Giriş yap
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </form>

              {cloudEnabled ? (
                <button
                  type="button"
                  onClick={switchToSignup}
                  className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
                >
                  Hesabın yok mu?{" "}
                  <span className="underline underline-offset-4">Hesap oluştur</span>
                </button>
              ) : (
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
              )}

              <p className="mt-5 text-center text-xs text-slate-600">
                {helperCopy.footer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
