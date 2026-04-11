"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Check, Languages, Save, School, UserRound } from "lucide-react";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { Card } from "@/components/ui/card";
import { FloatingFeedbackToast } from "@/components/ui/floating-feedback-toast";
import { useFloatingFeedback } from "@/hooks/useFloatingFeedback";
import {
  canonicalizeDepartmentName,
  canonicalizeUniversityName,
  KNOWN_LANGUAGE_OPTIONS,
  PROFILE_CLASS_YEAR_OPTIONS,
  TURKISH_UNIVERSITIES,
  UNIVERSITY_DEPARTMENTS,
} from "@/lib/profile-options";
import { PlanningRuntimeProfile } from "@/lib/planning-runtime";
import { writeUserProfile } from "@/lib/storage";
import { UserProfile } from "@/lib/types";

interface ProfileScreenProps {
  profile: PlanningRuntimeProfile;
  onProfileSaved: () => void;
}

interface ProfileDraft {
  name: string;
  language: UserProfile["language"];
  university: string;
  department: string;
  classYear: UserProfile["classYear"];
  knownLanguages: UserProfile["knownLanguages"];
}

function toDraft(profile: PlanningRuntimeProfile): ProfileDraft {
  return {
    name: profile.fullName,
    language: profile.language,
    university: profile.university,
    department: profile.department,
    classYear: profile.classYear,
    knownLanguages: profile.knownLanguages,
  };
}

export function ProfileScreen({ profile, onProfileSaved }: ProfileScreenProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => toDraft(profile));
  const { feedback, showFeedback } = useFloatingFeedback(2200);

  useEffect(() => {
    setDraft(toDraft(profile));
  }, [profile]);

  const profileSummary = useMemo(
    () =>
      [draft.university, draft.department, draft.classYear ? PROFILE_CLASS_YEAR_OPTIONS.find((option) => option.value === draft.classYear)?.label : ""]
        .filter(Boolean)
        .join(" • "),
    [draft.classYear, draft.department, draft.university],
  );

  const toggleKnownLanguage = (language: UserProfile["knownLanguages"][number]) => {
    setDraft((current) => ({
      ...current,
      knownLanguages: current.knownLanguages.includes(language)
        ? current.knownLanguages.filter((item) => item !== language)
        : [...current.knownLanguages, language],
    }));
  };

  const handleSave = () => {
    const normalizedName = draft.name.trim();
    if (!normalizedName) return;

    writeUserProfile({
      name: normalizedName,
      setupCompletedAt: profile.setupCompletedAt || new Date().toISOString(),
      language: draft.language,
      university: canonicalizeUniversityName(draft.university),
      department: canonicalizeDepartmentName(draft.department),
      classYear: draft.classYear,
      knownLanguages: draft.knownLanguages,
    });

    showFeedback({
      variant: "success",
      label: "Profil kaydedildi",
      title: "Akademik bağlam güncellendi",
      body: "Yeni profil bilgileri bundan sonraki önerilere temel olacak.",
      countdownMs: 2200,
    });
    onProfileSaved();
  };

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Profil"
        title="Çalışma profilini güncel tut"
        description="İsim, üniversite, bölüm, sınıf ve bildiğin diller burada dursun. Sonraki profil zenginleştirmelerini bu temel üstüne ekleriz."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">İsim</span>
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
                placeholder="Ad soyad"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Uygulama dili</span>
              <select
                value={draft.language}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    language: event.target.value as UserProfile["language"],
                  }))
                }
                className="w-full rounded-[18px] border border-white/10 bg-[#0d1222] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Üniversite</span>
              <input
                list="turkish-university-list"
                value={draft.university}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, university: event.target.value }))
                }
                className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
                placeholder="Üniversiteni seç veya yaz"
              />
              <datalist id="turkish-university-list">
                {TURKISH_UNIVERSITIES.map((university) => (
                  <option key={university} value={university} />
                ))}
              </datalist>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Bölüm</span>
              <input
                list="department-list"
                value={draft.department}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, department: event.target.value }))
                }
                className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
                placeholder="Bölümünü seç veya yaz"
              />
              <datalist id="department-list">
                {UNIVERSITY_DEPARTMENTS.map((department) => (
                  <option key={department} value={department} />
                ))}
              </datalist>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Sınıf</span>
              <select
                value={draft.classYear}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    classYear: event.target.value as UserProfile["classYear"],
                  }))
                }
                className="w-full rounded-[18px] border border-white/10 bg-[#0d1222] px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/35"
              >
                {PROFILE_CLASS_YEAR_OPTIONS.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 border-t border-white/8 pt-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              <Languages className="h-4 w-4" />
              Bildiğin diller
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {KNOWN_LANGUAGE_OPTIONS.map((language) => {
                const active = draft.knownLanguages.includes(language.value);
                return (
                  <button
                    key={language.value}
                    type="button"
                    onClick={() => toggleKnownLanguage(language.value)}
                    className={`flex items-center justify-between rounded-[16px] border px-3.5 py-3 text-left text-sm transition ${
                      active
                        ? "border-sky-300/30 bg-sky-300/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span>{language.label}</span>
                    {active ? <Check className="h-4 w-4 text-sky-200" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
            <p className="text-sm text-slate-400">
              Profil alanı artık düzenlenebilir. Sonraki pass&apos;te bunu daha zengin akademik ayarlara açabiliriz.
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="inline-flex items-center gap-2 rounded-[16px] border border-sky-300/25 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-white transition hover:border-sky-300/35 hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Profili kaydet
            </button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <UserRound className="h-5 w-5 text-slate-100" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Profil özeti</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{draft.name || "İsmini ekle"}</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <SummaryRow label="Akademik bağlam" value={profileSummary || "Henüz eklenmedi"} />
              <SummaryRow
                label="Bilinen diller"
                value={
                  draft.knownLanguages.length > 0
                    ? draft.knownLanguages
                        .map((code) => KNOWN_LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ?? code)
                        .join(", ")
                    : "Henüz eklenmedi"
                }
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              <School className="h-4 w-4" />
              Neden burada?
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Bu ekran şimdi isim ve akademik bağlamı tutuyor. Sonraki profil zenginleştirmelerini aynı kayıt yapısına ekleyebiliriz.
            </p>
          </Card>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {feedback ? <FloatingFeedbackToast {...feedback} /> : null}
      </AnimatePresence>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
