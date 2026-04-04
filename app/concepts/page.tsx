"use client";

import { useState } from "react";

const concepts = ["cosmic", "editorial", "vivid"] as const;
type Concept = (typeof concepts)[number];

export default function ConceptsPage() {
  const [active, setActive] = useState<Concept>("cosmic");

  return (
    <div className="min-h-screen bg-black">
      {/* Picker */}
      <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 flex gap-2 rounded-full border border-white/10 bg-black/60 p-1.5 backdrop-blur-xl">
        {concepts.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={[
              "rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300",
              active === c
                ? "bg-white text-black"
                : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>

      {active === "cosmic" && <CosmicConcept />}
      {active === "editorial" && <EditorialConcept />}
      {active === "vivid" && <VividConcept />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONCEPT 1 — COSMIC
   Apple × Vercel. Ultra-dark, vivid aurora, gradient text, luminous glass.
────────────────────────────────────────────────────────────────────────────── */
function CosmicConcept() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#020510" }} />

      {/* Aurora — vivid, saturated, large */}
      <div className="absolute" style={{
        width: "80vw", height: "80vw", top: "-35%", left: "10%",
        background: "radial-gradient(circle at 40% 40%, rgba(56,189,248,0.55), rgba(99,102,241,0.35) 40%, rgba(139,92,246,0.15) 65%, transparent 75%)",
        filter: "blur(80px)", borderRadius: "50%",
        animation: "none",
      }} />
      <div className="absolute" style={{
        width: "60vw", height: "60vw", bottom: "-20%", right: "-5%",
        background: "radial-gradient(circle, rgba(16,185,129,0.40), rgba(20,184,166,0.20) 50%, transparent 70%)",
        filter: "blur(90px)", borderRadius: "50%",
      }} />
      <div className="absolute" style={{
        width: "40vw", height: "40vw", top: "40%", left: "-10%",
        background: "radial-gradient(circle, rgba(139,92,246,0.30), transparent 70%)",
        filter: "blur(80px)", borderRadius: "50%",
      }} />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 65% 65% at 50% 45%, transparent 20%, rgba(2,5,16,0.82) 100%)",
      }} />

      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px",
      }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[520px] px-6 py-20">
        {/* Badge */}
        <div className="mb-10 flex justify-center">
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
            borderRadius: 100, padding: "8px 20px",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#38BDF8", boxShadow: "0 0 8px rgba(56,189,248,0.8)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.26em", color: "rgba(186,230,253,0.8)", textTransform: "uppercase" }}>
              EXAM ASSIST
            </span>
          </div>
        </div>

        {/* Heading — gradient text */}
        <h1 style={{
          fontSize: "clamp(3rem, 8vw, 4.5rem)",
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          textAlign: "center",
          marginBottom: 20,
          background: "linear-gradient(135deg, #fff 30%, #7DD3FC 60%, #A78BFA 90%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Hoş geldin.
        </h1>

        <p style={{ textAlign: "center", color: "rgba(148,163,184,0.85)", fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
          Sınav haftanda seni yönlendirecek<br />kişisel çalışma alanın.
        </p>

        {/* Input */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{
            position: "absolute", inset: -1, borderRadius: 18,
            background: "linear-gradient(135deg, rgba(56,189,248,0.4), rgba(139,92,246,0.2))",
            padding: 1,
          }}>
            <div style={{ background: "rgba(5,10,24,0.9)", borderRadius: 17, height: "100%" }} />
          </div>
          <input placeholder="Adın ve soyadın" style={{
            position: "relative", width: "100%", padding: "16px 20px",
            background: "transparent",
            border: "none", outline: "none",
            color: "white", fontSize: 14,
            borderRadius: 18, boxSizing: "border-box",
          }} />
        </div>

        {/* Button */}
        <button style={{
          width: "100%", padding: "16px 24px",
          background: "linear-gradient(135deg, #38BDF8, #818CF8)",
          border: "none", borderRadius: 18,
          color: "white", fontSize: 14, fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 0 40px rgba(56,189,248,0.35), 0 0 80px rgba(129,140,248,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}>
          Devam →
        </button>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "rgba(100,116,139,0.7)" }}>
          Tüm veriler cihazında saklanır · Hesap gerekmez
        </p>

        {/* Dashboard preview card */}
        <div style={{
          marginTop: 48,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 28,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(24px)",
          padding: 24,
        }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(100,116,139,0.6)", textTransform: "uppercase", marginBottom: 16 }}>
            ÖRNEK · ANA EKRAN
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Sonraki Sınav", value: "3g 14s", accent: "#38BDF8" },
              { label: "Risk Skoru", value: "Kritik", accent: "#F87171" },
              { label: "Günlük Hedef", value: "%72", accent: "#34D399" },
              { label: "Öncelik", value: "Matematik", accent: "#A78BFA" },
            ].map((tile) => (
              <div key={tile.label} style={{
                padding: "16px", borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.03)",
              }}>
                <p style={{ fontSize: 10, color: "rgba(100,116,139,0.7)", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {tile.label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: tile.accent, letterSpacing: "-0.02em" }}>
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONCEPT 2 — EDITORIAL
   Linear × Raycast. Minimal, crisp, monochrome + single accent.
────────────────────────────────────────────────────────────────────────────── */
function EditorialConcept() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center" style={{ background: "#080809" }}>
      {/* Very subtle top gradient */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,189,248,0.07), transparent)",
      }} />

      {/* Fine grid */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative z-10 w-full max-w-[480px] px-6 py-20">
        {/* Logo mark */}
        <div className="mb-14 flex items-center gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #38BDF8, #0EA5E9)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 14, fontWeight: 800 }}>E</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: "0.08em", fontWeight: 500 }}>
            EXAM ASSIST
          </span>
          <div style={{
            marginLeft: "auto",
            fontSize: 11, color: "rgba(56,189,248,0.8)", fontWeight: 500,
            border: "1px solid rgba(56,189,248,0.2)", borderRadius: 6,
            padding: "2px 8px", letterSpacing: "0.06em",
          }}>
            BETA
          </div>
        </div>

        {/* Large editorial heading */}
        <h1 style={{
          fontSize: "clamp(3.5rem, 9vw, 5.5rem)",
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          color: "white",
          marginBottom: 28,
        }}>
          Sınav<br />
          <span style={{ color: "rgba(255,255,255,0.25)" }}>haftana</span><br />
          hazır mısın?
        </h1>

        <div style={{
          width: 40, height: 2,
          background: "#38BDF8",
          marginBottom: 24,
        }} />

        <p style={{ color: "rgba(148,163,184,0.7)", fontSize: 14, lineHeight: 1.9, marginBottom: 40, maxWidth: 340 }}>
          Kişisel çalışma komuta merkezin. Sınav önceliklerini, materyallerini ve zamanını bir arada yönet.
        </p>

        {/* Clean input */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 11, color: "rgba(100,116,139,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Adın
          </label>
          <input placeholder="Vatan Demir" style={{
            width: "100%", padding: "14px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            color: "white", fontSize: 15, outline: "none",
            boxSizing: "border-box",
          }} />
        </div>

        <button style={{
          width: "100%", padding: "15px 24px", marginTop: 8,
          background: "#38BDF8",
          border: "none", borderRadius: 12,
          color: "#020510", fontSize: 14, fontWeight: 700,
          cursor: "pointer", letterSpacing: "0.02em",
        }}>
          Çalışmaya Başla
        </button>

        <p style={{ marginTop: 16, fontSize: 12, color: "rgba(100,116,139,0.5)" }}>
          Hesap gerekmez · Tamamen yerel
        </p>

        {/* Dashboard preview */}
        <div style={{
          marginTop: 48,
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          background: "rgba(255,255,255,0.02)",
          padding: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Bu haftanın özeti</p>
            <span style={{ fontSize: 11, color: "#38BDF8" }}>→ Tümünü gör</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { subject: "Matematik Final", days: "3g", risk: "KRİTİK", riskColor: "#F87171", bar: 85 },
              { subject: "AİT Vize", days: "8g", risk: "ORTA", riskColor: "#FBBF24", bar: 45 },
              { subject: "Fizik Final", days: "12g", risk: "İYİ", riskColor: "#34D399", bar: 22 },
            ].map((item) => (
              <div key={item.subject} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
                background: "rgba(255,255,255,0.02)",
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "white", fontWeight: 500, marginBottom: 4 }}>{item.subject}</p>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${item.bar}%`, background: item.riskColor, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: item.riskColor, fontWeight: 700, letterSpacing: "0.06em" }}>{item.risk}</p>
                  <p style={{ fontSize: 11, color: "rgba(100,116,139,0.7)" }}>{item.days}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONCEPT 3 — VIVID
   Framer × Superhuman. Deep violet, mesh gradient, colorful borders, bold.
────────────────────────────────────────────────────────────────────────────── */
function VividConcept() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Deep violet base */}
      <div className="absolute inset-0" style={{ background: "#0C0618" }} />

      {/* Vivid mesh */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 70% 50% at 20% 20%, rgba(124,58,237,0.45), transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 10%, rgba(219,39,119,0.25), transparent 55%),
          radial-gradient(ellipse 70% 60% at 50% 90%, rgba(56,189,248,0.30), transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 60%, rgba(16,185,129,0.20), transparent 55%)
        `,
        filter: "blur(40px)",
      }} />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.12]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Center dark focus */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 55% 60% at 50% 45%, rgba(12,6,24,0.65) 0%, transparent 100%)",
      }} />

      <div className="relative z-10 w-full max-w-[520px] px-6 py-20">
        {/* Pill badge — colorful */}
        <div className="mb-8 flex justify-center">
          <div style={{
            position: "relative", overflow: "hidden",
            display: "inline-flex", alignItems: "center", gap: 10,
            borderRadius: 100, padding: "1px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(219,39,119,0.6), rgba(56,189,248,0.5))",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#0C0618", borderRadius: 99, padding: "7px 18px",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "linear-gradient(135deg, #7C3AED, #EC4899)",
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", color: "rgba(216,180,254,0.9)", textTransform: "uppercase" }}>
                EXAM ASSIST
              </span>
            </div>
          </div>
        </div>

        {/* Big vivid heading */}
        <h1 style={{
          fontSize: "clamp(3rem, 9vw, 5rem)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          textAlign: "center",
          marginBottom: 16,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #fff 20%, #C4B5FD 50%, #F472B6 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Sınavına<br />hakim ol.
          </span>
        </h1>

        <p style={{ textAlign: "center", color: "rgba(196,181,253,0.6)", fontSize: 15, lineHeight: 1.8, marginBottom: 40 }}>
          Risk motorlu kişisel çalışma merkezi.
        </p>

        {/* Gradient border input */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 16, padding: 1,
            background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(219,39,119,0.3), rgba(56,189,248,0.4))",
          }}>
            <div style={{ background: "#0C0618", borderRadius: 15, height: "100%" }} />
          </div>
          <input placeholder="Adın ve soyadın" style={{
            position: "relative", width: "100%",
            padding: "15px 20px", background: "transparent",
            border: "none", outline: "none",
            color: "white", fontSize: 14, borderRadius: 16,
            boxSizing: "border-box",
          }} />
        </div>

        {/* Vivid gradient button */}
        <button style={{
          width: "100%", padding: "16px 24px",
          background: "linear-gradient(135deg, #7C3AED, #EC4899 60%, #38BDF8)",
          border: "none", borderRadius: 16,
          color: "white", fontSize: 14, fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 0 32px rgba(124,58,237,0.45), 0 0 60px rgba(236,72,153,0.20)",
          letterSpacing: "0.01em",
        }}>
          Çalışmaya Başla ✦
        </button>

        {/* Dashboard bento preview */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(196,181,253,0.4)", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
            ÖRNEK · ÖNCELIK PANELI
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 10 }}>
            {/* Big card */}
            <div style={{
              gridColumn: "1 / -1",
              padding: "20px", borderRadius: 20,
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30, width: 120, height: 120,
                borderRadius: "50%", background: "rgba(124,58,237,0.2)",
                filter: "blur(30px)",
              }} />
              <p style={{ fontSize: 10, color: "rgba(196,181,253,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>SONRAKI SINAV</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: 4 }}>3g 14s</p>
              <p style={{ fontSize: 13, color: "rgba(196,181,253,0.6)" }}>Matematik Final</p>
              <div style={{
                marginTop: 14, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)",
              }}>
                <div style={{ height: "100%", width: "68%", borderRadius: 2, background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
              </div>
            </div>

            <div style={{
              padding: "18px", borderRadius: 18,
              background: "rgba(236,72,153,0.10)",
              border: "1px solid rgba(236,72,153,0.20)",
            }}>
              <p style={{ fontSize: 10, color: "rgba(251,191,36,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>RİSK</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#F87171" }}>KRİTİK</p>
            </div>

            <div style={{
              padding: "18px", borderRadius: 18,
              background: "rgba(56,189,248,0.08)",
              border: "1px solid rgba(56,189,248,0.18)",
            }}>
              <p style={{ fontSize: 10, color: "rgba(56,189,248,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>HEDEF</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#38BDF8" }}>%72</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
