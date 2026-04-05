export const TURKISH_UNIVERSITIES = [
  "Abdullah Gül Üniversitesi",
  "Akdeniz Üniversitesi",
  "Anadolu Üniversitesi",
  "Ankara Hacı Bayram Veli Üniversitesi",
  "Ankara Medipol Üniversitesi",
  "Ankara Üniversitesi",
  "Atatürk Üniversitesi",
  "Bahçeşehir Üniversitesi",
  "Başkent Üniversitesi",
  "Beykent Üniversitesi",
  "Boğaziçi Üniversitesi",
  "Bursa Uludağ Üniversitesi",
  "Çağ Üniversitesi",
  "Çankaya Üniversitesi",
  "Çukurova Üniversitesi",
  "Dokuz Eylül Üniversitesi",
  "Düzce Üniversitesi",
  "Ege Üniversitesi",
  "Erciyes Üniversitesi",
  "Eskişehir Osmangazi Üniversitesi",
  "Fırat Üniversitesi",
  "Galatasaray Üniversitesi",
  "Gazi Üniversitesi",
  "Gebze Teknik Üniversitesi",
  "Hacettepe Üniversitesi",
  "Hasan Kalyoncu Üniversitesi",
  "Işık Üniversitesi",
  "İbn Haldun Üniversitesi",
  "İskenderun Teknik Üniversitesi",
  "İstanbul Arel Üniversitesi",
  "İstanbul Bilgi Üniversitesi",
  "İstanbul Gelişim Üniversitesi",
  "İstanbul Kent Üniversitesi",
  "İstanbul Medeniyet Üniversitesi",
  "İstanbul Medipol Üniversitesi",
  "İstanbul Okan Üniversitesi",
  "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "İstanbul Ticaret Üniversitesi",
  "İstanbul Üniversitesi",
  "İzmir Bakırçay Üniversitesi",
  "İzmir Demokrasi Üniversitesi",
  "İzmir Ekonomi Üniversitesi",
  "İzmir Katip Çelebi Üniversitesi",
  "Kadir Has Üniversitesi",
  "Karadeniz Teknik Üniversitesi",
  "Kırıkkale Üniversitesi",
  "Koç Üniversitesi",
  "Kocaeli Üniversitesi",
  "Maltepe Üniversitesi",
  "Marmara Üniversitesi",
  "Mersin Üniversitesi",
  "Mimar Sinan Güzel Sanatlar Üniversitesi",
  "Muğla Sıtkı Koçman Üniversitesi",
  "Necmettin Erbakan Üniversitesi",
  "Ondokuz Mayıs Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "Özyeğin Üniversitesi",
  "Pamukkale Üniversitesi",
  "Sakarya Üniversitesi",
  "Selçuk Üniversitesi",
  "Ted Üniversitesi",
  "Tekirdağ Namık Kemal Üniversitesi",
  "TOBB Ekonomi ve Teknoloji Üniversitesi",
  "Trakya Üniversitesi",
  "Türk-Alman Üniversitesi",
  "Ufuk Üniversitesi",
  "Yeditepe Üniversitesi",
  "Yıldız Teknik Üniversitesi",
  "Yozgat Bozok Üniversitesi",
  "Yüksek İhtisas Üniversitesi",
] as const;

export const UNIVERSITY_DEPARTMENTS = [
  "Bilgisayar Mühendisliği",
  "Yazılım Mühendisliği",
  "Yapay Zeka Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği",
  "Makine Mühendisliği",
  "İnşaat Mühendisliği",
  "Mimarlık",
  "Tıp",
  "Diş Hekimliği",
  "Eczacılık",
  "Hemşirelik",
  "Hukuk",
  "Psikoloji",
  "PDR",
  "İktisat",
  "İşletme",
  "Uluslararası İlişkiler",
  "Siyaset Bilimi ve Kamu Yönetimi",
  "Maliye",
  "Yönetim Bilişim Sistemleri",
  "İngiliz Dili ve Edebiyatı",
  "Türk Dili ve Edebiyatı",
  "Mütercim Tercümanlık",
  "Radyo, Televizyon ve Sinema",
  "İletişim Tasarımı",
  "Gastronomi ve Mutfak Sanatları",
  "Turizm İşletmeciliği",
  "Matematik",
  "İstatistik",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Sosyoloji",
  "İlahiyat",
  "Çocuk Gelişimi",
  "Sınıf Öğretmenliği",
  "Okul Öncesi Öğretmenliği",
  "Özel Eğitim Öğretmenliği",
] as const;

export const PROFILE_CLASS_YEAR_OPTIONS = [
  { value: "", label: "Henüz seçmedim" },
  { value: "hazirlik", label: "Hazırlık" },
  { value: "1", label: "1. sınıf" },
  { value: "2", label: "2. sınıf" },
  { value: "3", label: "3. sınıf" },
  { value: "4", label: "4. sınıf" },
  { value: "5", label: "5. sınıf" },
  { value: "6+", label: "6+ sınıf" },
  { value: "lisansustu", label: "Lisansüstü" },
] as const;

export const KNOWN_LANGUAGE_OPTIONS = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "İngilizce" },
  { value: "de", label: "Almanca" },
  { value: "fr", label: "Fransızca" },
  { value: "es", label: "İspanyolca" },
  { value: "it", label: "İtalyanca" },
  { value: "ar", label: "Arapça" },
  { value: "ru", label: "Rusça" },
] as const;

function normalizeProfileText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const UNIVERSITY_ALIAS_MAP = new Map<string, string>([
  ["odtu", "Orta Doğu Teknik Üniversitesi"],
  ["orta dogu teknik", "Orta Doğu Teknik Üniversitesi"],
  ["itu", "İstanbul Teknik Üniversitesi"],
  ["istanbul teknik", "İstanbul Teknik Üniversitesi"],
  ["ytu", "Yıldız Teknik Üniversitesi"],
  ["yildiz teknik", "Yıldız Teknik Üniversitesi"],
  ["gazi", "Gazi Üniversitesi"],
  ["hacettepe", "Hacettepe Üniversitesi"],
  ["bogazici", "Boğaziçi Üniversitesi"],
  ["boun", "Boğaziçi Üniversitesi"],
  ["marmara", "Marmara Üniversitesi"],
  ["ankara universitesi", "Ankara Üniversitesi"],
  ["ankara", "Ankara Üniversitesi"],
  ["ege", "Ege Üniversitesi"],
  ["deu", "Dokuz Eylül Üniversitesi"],
  ["dokuz eylul", "Dokuz Eylül Üniversitesi"],
]);

const DEPARTMENT_ALIAS_MAP = new Map<string, string>([
  ["ybs", "Yönetim Bilişim Sistemleri"],
  ["yonetim bilisim sistemleri", "Yönetim Bilişim Sistemleri"],
  ["isletme", "İşletme"],
  ["business", "İşletme"],
  ["management", "İşletme"],
  ["iktisat", "İktisat"],
  ["eko", "İktisat"],
  ["eko no", "İktisat"],
  ["eko ing", "İktisat"],
  ["economics", "İktisat"],
  ["hukuk", "Hukuk"],
  ["law", "Hukuk"],
  ["bilgisayar muhendisligi", "Bilgisayar Mühendisliği"],
  ["computer engineering", "Bilgisayar Mühendisliği"],
  ["yazilim muhendisligi", "Yazılım Mühendisliği"],
  ["software engineering", "Yazılım Mühendisliği"],
  ["endustri muhendisligi", "Endüstri Mühendisliği"],
  ["industrial engineering", "Endüstri Mühendisliği"],
  ["uluslararasi iliskiler", "Uluslararası İlişkiler"],
  ["international relations", "Uluslararası İlişkiler"],
  ["psikoloji", "Psikoloji"],
  ["psychology", "Psikoloji"],
]);

function canonicalizeFromList(
  value: string,
  aliases: Map<string, string>,
  options: readonly string[],
) {
  const normalized = normalizeProfileText(value);
  if (!normalized) return "";

  const directAlias = aliases.get(normalized);
  if (directAlias) return directAlias;

  const directOption = options.find(
    (option) => normalizeProfileText(option) === normalized,
  );
  if (directOption) return directOption;

  const partialOption = options.find((option) => {
    const normalizedOption = normalizeProfileText(option);
    return (
      normalizedOption.includes(normalized) ||
      normalized.includes(normalizedOption)
    );
  });

  return partialOption ?? value.trim();
}

export function canonicalizeUniversityName(value: string) {
  return canonicalizeFromList(value, UNIVERSITY_ALIAS_MAP, TURKISH_UNIVERSITIES);
}

export function canonicalizeDepartmentName(value: string) {
  return canonicalizeFromList(value, DEPARTMENT_ALIAS_MAP, UNIVERSITY_DEPARTMENTS);
}

export function inferDepartmentMatchScore(
  profileDepartment: string,
  candidateDepartmentHint?: string,
) {
  const normalizedProfile = normalizeProfileText(
    canonicalizeDepartmentName(profileDepartment),
  );
  const normalizedCandidate = normalizeProfileText(candidateDepartmentHint ?? "");

  if (!normalizedProfile || !normalizedCandidate) return 0;
  if (normalizedProfile === normalizedCandidate) return 3;

  const aliasProfile = canonicalizeDepartmentName(profileDepartment);
  const aliasCandidate = canonicalizeDepartmentName(candidateDepartmentHint ?? "");
  if (aliasProfile && aliasProfile === aliasCandidate) return 3;

  const profileTokens = new Set(normalizedProfile.split(" "));
  const candidateTokens = normalizedCandidate.split(" ");
  const overlap = candidateTokens.filter((token) => profileTokens.has(token));
  if (overlap.length >= 2) return 2;
  if (overlap.length >= 1) return 1;

  return 0;
}

export function inferTitleLanguageHint(title: string): "tr" | "en" | "mixed" {
  const normalized = normalizeProfileText(title);
  const turkishSpecific = /[çğıöşü]/i.test(title);
  if (turkishSpecific) return "tr";

  const turkishKeywords = [
    "hukuku",
    "ticaret",
    "iktisat",
    "isletme",
    "muhendisligi",
    "turkce",
    "ingilizce",
    "matematik",
  ];
  const englishKeywords = [
    "management",
    "research",
    "marketing",
    "finance",
    "computer",
    "introduction",
    "commercial",
    "english",
    "accounting",
    "law",
  ];

  const turkishHits = turkishKeywords.filter((keyword) => normalized.includes(keyword)).length;
  const hits = englishKeywords.filter((keyword) => normalized.includes(keyword)).length;
  if (turkishHits >= 1 && hits === 0) return "tr";
  if (hits >= 1) return "en";
  return "mixed";
}
