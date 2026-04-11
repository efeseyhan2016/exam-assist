"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

export type FloatingFeedbackVariant = "success" | "info" | "error";

export interface FloatingFeedbackToastProps {
  id: string;
  title: string;
  body?: string;
  label?: string;
  variant?: FloatingFeedbackVariant;
  actionLabel?: string;
  onAction?: () => void;
  countdownMs?: number;
  showCountdownRing?: boolean;
  icon?: ReactNode;
}

const VARIANT_STYLES: Record<
  FloatingFeedbackVariant,
  {
    shell: string;
    label: string;
    iconWrap: string;
    iconText: string;
    action: string;
    countdownStroke: string;
  }
> = {
  success: {
    shell:
      "border-emerald-300/20 bg-[linear-gradient(135deg,rgba(4,18,13,0.97),rgba(7,36,21,0.92),rgba(6,15,11,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(16,185,129,0.12)]",
    label: "text-emerald-200/70",
    iconWrap: "border-emerald-300/18 bg-emerald-300/10",
    iconText: "text-emerald-100",
    action:
      "border-emerald-200/30 bg-emerald-300/16 text-emerald-50 hover:border-emerald-100/50 hover:bg-emerald-300/22",
    countdownStroke: "rgba(110,231,183,0.95)",
  },
  info: {
    shell:
      "border-sky-300/20 bg-[linear-gradient(135deg,rgba(8,16,31,0.97),rgba(9,27,49,0.92),rgba(8,15,27,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(56,189,248,0.10)]",
    label: "text-sky-200/70",
    iconWrap: "border-sky-300/18 bg-sky-300/10",
    iconText: "text-sky-100",
    action:
      "border-sky-200/30 bg-sky-300/14 text-sky-50 hover:border-sky-100/50 hover:bg-sky-300/20",
    countdownStroke: "rgba(125,211,252,0.95)",
  },
  error: {
    shell:
      "border-rose-300/20 bg-[linear-gradient(135deg,rgba(28,10,16,0.97),rgba(44,12,22,0.92),rgba(24,8,14,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35),0_0_30px_rgba(244,63,94,0.10)]",
    label: "text-rose-200/70",
    iconWrap: "border-rose-300/18 bg-rose-300/10",
    iconText: "text-rose-100",
    action:
      "border-rose-200/30 bg-rose-300/12 text-rose-50 hover:border-rose-100/50 hover:bg-rose-300/18",
    countdownStroke: "rgba(253,164,175,0.95)",
  },
};

export function FloatingFeedbackToast({
  id,
  title,
  body,
  label,
  variant = "success",
  actionLabel,
  onAction,
  countdownMs,
  showCountdownRing = false,
  icon,
}: FloatingFeedbackToastProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed left-4 right-4 top-4 z-[70] sm:left-auto sm:right-6 sm:top-6 sm:w-[390px]"
    >
      <div
        className={cn(
          "overflow-hidden rounded-[26px] p-4 backdrop-blur-xl",
          styles.shell,
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
              styles.iconWrap,
            )}
          >
            {icon ?? defaultVariantIcon(variant, styles.iconText)}
          </span>

          <div className="min-w-0 flex-1">
            {label ? (
              <p className={cn("text-[11px] uppercase tracking-[0.18em]", styles.label)}>
                {label}
              </p>
            ) : null}
            <p className="mt-1 text-sm font-semibold text-white">{title}</p>
            {body ? (
              <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
            ) : null}
          </div>

          {actionLabel && onAction ? (
            <motion.button
              type="button"
              onClick={onAction}
              animate={{
                boxShadow: [
                  "0 0 0 rgba(255,255,255,0)",
                  variant === "success"
                    ? "0 0 18px rgba(74,222,128,0.28)"
                    : variant === "info"
                      ? "0 0 18px rgba(56,189,248,0.24)"
                      : "0 0 18px rgba(244,63,94,0.22)",
                  "0 0 0 rgba(255,255,255,0)",
                ],
              }}
              transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border py-2 pl-2 pr-4 text-sm font-semibold transition",
                styles.action,
              )}
            >
              {showCountdownRing && countdownMs ? (
                <CountdownRing
                  durationMs={countdownMs}
                  strokeColor={styles.countdownStroke}
                />
              ) : null}
              {actionLabel}
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function defaultVariantIcon(variant: FloatingFeedbackVariant, className: string) {
  if (variant === "success") {
    return <CheckCircle2 className={cn("h-4.5 w-4.5", className)} />;
  }

  if (variant === "error") {
    return <AlertCircle className={cn("h-4.5 w-4.5", className)} />;
  }

  return <Info className={cn("h-4.5 w-4.5", className)} />;
}

function CountdownRing({
  durationMs,
  strokeColor,
}: {
  durationMs: number;
  strokeColor: string;
}) {
  return (
    <div className="relative h-8 w-8 shrink-0">
      <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2.5"
        />
        <motion.circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="97.4"
          strokeDashoffset="0"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 97.4 }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/5">
        <RotateCcw className="h-3.5 w-3.5 text-white/90" />
      </div>
    </div>
  );
}
