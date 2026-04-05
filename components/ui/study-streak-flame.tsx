"use client";

import { motion } from "framer-motion";

interface StudyStreakFlameProps {
  streak: number;
  /**
   * "default" — full vertical layout used in the sessions screen card
   * "compact" — horizontal layout used in the sidebar
   */
  size?: "default" | "compact";
  className?: string;
}

/**
 * A live, animated flame that represents the user's consecutive study-day streak.
 * When streak === 0 the flame is rendered dimmed / unlit.
 *
 * Animation design:
 *  - Outer flame: slow opacity flicker (1.9 s)
 *  - Inner flame: slightly faster flicker, offset phase (1.5 s, delay 0.25 s)
 *  - Core:        fast bright pulse (1.1 s, delay 0.10 s)
 *  - Sway:        gentle left–right lean on the whole flame body (3.2 s)
 *  - Glow:        ambient radial blur behind flame, pulses with outer (2.4 s)
 */
export function StudyStreakFlame({
  streak,
  size = "default",
  className = "",
}: StudyStreakFlameProps) {
  const isActive = streak > 0;
  const isCompact = size === "compact";

  const svgW = isCompact ? 28 : 52;
  const svgH = isCompact ? 40 : 72;

  return (
    <div
      className={`flex ${
        isCompact ? "flex-row items-center gap-2.5" : "flex-col items-center gap-2"
      } ${className}`}
    >
      {/* ── Flame visual ── */}
      <div className="relative" style={{ width: svgW, height: svgH }}>
        {/* Ambient glow — blurred circle behind the base of the flame */}
        {isActive && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 78%, rgba(251,146,60,0.50) 0%, rgba(239,68,68,0.18) 45%, transparent 72%)",
              filter: "blur(7px)",
            }}
            animate={{ opacity: [0.55, 1, 0.65, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Flame body — pivots from bottom for a natural sway */}
        <motion.div
          style={{
            width: svgW,
            height: svgH,
            position: "relative",
            zIndex: 1,
            originY: 1, // pivot from the flame base
          }}
          animate={isActive ? { rotate: [-1.6, 1.4, -0.7, 1.1, -1.6] } : {}}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            viewBox="0 0 40 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: svgW, height: svgH, display: "block" }}
            aria-hidden
          >
            <defs>
              {/* Outer: amber tip → orange mid → red base */}
              <linearGradient
                id="ea-flame-outer"
                x1="20" y1="0"
                x2="20" y2="56"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor="#fbbf24" />
                <stop offset="35%"  stopColor="#f97316" />
                <stop offset="80%"  stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.7" />
              </linearGradient>

              {/* Inner: near-white yellow → orange */}
              <linearGradient
                id="ea-flame-inner"
                x1="20" y1="6"
                x2="20" y2="50"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor="#fef08a" />
                <stop offset="40%"  stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.5" />
              </linearGradient>

              {/* Core: near-white → pale yellow */}
              <linearGradient
                id="ea-flame-core"
                x1="20" y1="15"
                x2="20" y2="42"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor="#fefce8" />
                <stop offset="60%"  stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Layer 1 — outer flame shell */}
            <motion.path
              d="M20 56 C8 52 2 40 4 28 C5 20 8 14 12 8 C14 4 16 1 18 0 C20 1 22 4 26 8 C30 13 34 20 35 28 C37 40 32 52 20 56Z"
              fill={isActive ? "url(#ea-flame-outer)" : "rgba(100,100,130,0.22)"}
              animate={isActive ? { opacity: [0.82, 1, 0.86, 1, 0.82] } : {}}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Layer 2 — inner flame */}
            <motion.path
              d="M20 50 C11 46 9 36 12 26 C13 20 15 15 17 11 C18 9 19 7 20 6 C21 7 22 9 23 11 C25 16 27 21 28 27 C30 37 28 46 20 50Z"
              fill={isActive ? "url(#ea-flame-inner)" : "rgba(80,80,110,0.14)"}
              animate={isActive ? { opacity: [0.72, 1, 0.78, 0.94, 0.72] } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.25,
              }}
            />

            {/* Layer 3 — bright core */}
            <motion.path
              d="M20 42 C15 38 14 30 16 24 C17 20 18 17 19 15 C20 14 21 16 22 19 C24 25 24 34 20 42Z"
              fill={isActive ? "url(#ea-flame-core)" : "rgba(60,60,90,0.09)"}
              animate={isActive ? { opacity: [0.65, 1, 0.72, 1, 0.65] } : {}}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.1,
              }}
            />
          </svg>
        </motion.div>
      </div>

      {/* ── Streak count + label ── */}
      <div
        className={
          isCompact ? "flex flex-col" : "flex flex-col items-center"
        }
      >
        <motion.span
          className={`font-bold tabular-nums leading-none ${
            isCompact ? "text-lg" : "text-3xl"
          } ${isActive ? "text-amber-300" : "text-slate-600"}`}
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {streak}
        </motion.span>
        <span
          className={`mt-0.5 uppercase tracking-[0.16em] ${
            isCompact ? "text-[9px]" : "text-[10px]"
          } ${isActive ? "text-amber-500/60" : "text-slate-700"}`}
        >
          günlük seri
        </span>
      </div>
    </div>
  );
}
