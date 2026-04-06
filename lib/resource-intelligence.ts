import { getExamProximityProfile } from "@/lib/exam-proximity";
import { StudyIntelligence } from "@/lib/subject-intelligence";
import { ResourceItem } from "@/lib/types";

export interface ResourceGuidance {
  resourceId: string;
  badge: string;
  summary: string;
  actionLabel: string;
  score: number;
}

export interface ResourceUploadInsight {
  headline: string;
  body: string;
  topics: string[];
}

export function buildSubjectTopicMap(resources: ResourceItem[]) {
  const scored = new Map<string, { topic: string; score: number }>();

  for (const resource of resources) {
    for (const topic of resource.topicHints ?? []) {
      const current = scored.get(topic) ?? { topic, score: 0 };
      const progressBoost =
        resource.pageCount > 0 ? Math.min(0.8, resource.pagesRead / resource.pageCount) : 0;
      const engagementBoost = Math.min(1.2, (resource.engagementCount ?? 0) * 0.2);
      current.score += 1 + progressBoost + engagementBoost;
      scored.set(topic, current);
    }
  }

  return [...scored.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((entry) => entry.topic);
}

type ResourceKind =
  | "questions"
  | "summary"
  | "slides"
  | "notes"
  | "topic-notes"
  | "book"
  | "unknown";

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ACADEMIC_TOPIC_PATTERNS =
  /donemi|dönemi|politika|konferans|konferansi|antlasma|antlaşma|savasi|savaşı|iliski|ilişki|tarihi|kuram|yaklasim|yaklaşım|teori|teorisi|devrim|inkilap|inkılap/i;

function inferResourceKind(resource: ResourceItem): ResourceKind {
  const normalized = normalizeText(resource.title);

  if (
    /soru|quiz|past exam|cikmis|çikmis|deneme|problem set|worksheet|test/i.test(
      normalized,
    )
  ) {
    return "questions";
  }

  if (/ozet|özet|summary|cheat sheet|quick review/i.test(normalized)) {
    return "summary";
  }

  if (/sunum|slides|slayt|presentation/i.test(normalized)) {
    return "slides";
  }

  if (/ders notu|lecture note|notlar|notes/i.test(normalized)) {
    return "notes";
  }

  if (/textbook|kitap|chapter|bolum|bölüm|reader/i.test(normalized)) {
    return "book";
  }

  const wordCount = normalized.split(" ").filter(Boolean).length;
  const looksLikeTopicNotes =
    resource.type === "pdf" &&
    resource.contentHint === "prose-heavy" &&
    resource.pageCount >= 6 &&
    resource.pageCount <= 40 &&
    wordCount >= 3 &&
    ACADEMIC_TOPIC_PATTERNS.test(normalized);

  if (looksLikeTopicNotes) {
    return "topic-notes";
  }

  return "unknown";
}

function getProgressRatio(resource: ResourceItem) {
  if (resource.pageCount <= 0) return 0;
  return resource.pagesRead / resource.pageCount;
}

function getEngagementBoost(resource: ResourceItem, referenceTime: Date) {
  let score = 0;

  const engagementCount = resource.engagementCount ?? 0;
  const revisitCount = resource.revisitCount ?? 0;

  if (engagementCount > 0) score += 0.45;
  if (revisitCount > 0) score += Math.min(0.9, revisitCount * 0.3);

  if (resource.lastActiveAt) {
    const lastActiveMs = Date.parse(resource.lastActiveAt);
    if (Number.isFinite(lastActiveMs)) {
      const hoursSinceActive = (referenceTime.getTime() - lastActiveMs) / 3_600_000;
      if (hoursSinceActive <= 72) score += 0.45;
      else if (hoursSinceActive <= 168) score += 0.2;
    }
  }

  return score;
}

function getEngagementSentence(resource: ResourceItem, referenceTime: Date) {
  const revisitCount = resource.revisitCount ?? 0;
  const engagementCount = resource.engagementCount ?? 0;

  if (revisitCount > 0) {
    return " Daha önce geri döndüğün kaynaklardan biri olduğu için devam etmek daha doğal olabilir.";
  }

  if (engagementCount > 0 && resource.lastActiveAt) {
    const lastActiveMs = Date.parse(resource.lastActiveAt);
    if (Number.isFinite(lastActiveMs)) {
      const hoursSinceActive = (referenceTime.getTime() - lastActiveMs) / 3_600_000;
      if (hoursSinceActive <= 72) {
        return " Son çalıştığın kaynaklardan biri olduğu için yeniden açmak daha kolay olabilir.";
      }
    }
  }

  return "";
}

export function getResourceGuidance(
  resource: ResourceItem,
  intelligence: StudyIntelligence,
  hoursUntilExam: number,
  referenceTime: Date = new Date(),
): ResourceGuidance {
  const kind = inferResourceKind(resource);
  const progressRatio = getProgressRatio(resource);
  const proximity = getExamProximityProfile(hoursUntilExam);
  const examClose = proximity.prefersConsolidation || proximity.prefersQuickReview;
  const narrowedWindow = proximity.narrowsScope;
  const resourceHasPages = resource.pageCount > 0;

  let score = 0;
  let badge = "Genel kaynak";
  let actionLabel = intelligence.sessionLabel;
  let summary = "Bu kaynak dersin genel akışına destek olur.";

  if (intelligence.mode === "problem") {
    if (kind === "questions") {
      score += 5;
      badge = "Pratik için güçlü";
      actionLabel = proximity.prefersQuickReview ? "Çıkmış sorularla toparla" : "Sorularla başla";
      summary = proximity.prefersQuickReview
        ? "Son güne yaklaşırken bunu kısa ve yoğun bir problem review gibi kullanmak daha doğru duruyor."
        : "Bu kaynak doğrudan uygulama ve soru ritmine uygun duruyor.";
    } else if (resource.contentHint === "formula-heavy") {
      score += 3;
      badge = "Çerçeve için güçlü";
      actionLabel = "Formül çerçevesini gözden geçir";
      summary = narrowedWindow
        ? "Kalan sürede temel formülleri netleştirip doğrudan uygulamaya dönmek daha doğru olur."
        : "Önce temel formülleri ve ilişkileri netleştirip sonra uygulamaya dönmek daha doğru olur.";
    } else if (kind === "summary" || kind === "notes") {
      score += 2;
      badge = "Kısa tekrar için uygun";
      actionLabel = "Özet üstünden toparla";
      summary = "Uzun okuma yerine kısa bir toparlama katmanı olarak daha iyi çalışır.";
    } else {
      score += 1;
      badge = "Yardımcı kaynak";
      actionLabel = "Yan kaynak olarak kullan";
      summary = "Bunu ana pratik akışının yanında yardımcı bir referans gibi tutmak daha doğru olur.";
    }
  } else if (intelligence.mode === "conceptual") {
    if (kind === "summary") {
      score += examClose ? 5 : 3;
      badge = examClose ? "Tekrar için uygun" : "Çerçeve için uygun";
      actionLabel = examClose ? "Özet üstünden toparla" : "Kavramsal çerçeveyi kur";
      summary = examClose
        ? "Sınav yakınken kısa özetler dağılmadan toparlanmayı kolaylaştırır."
        : "Konu başlıklarını ve ana yapıyı yerleştirmek için iyi bir giriş noktası.";
    } else if (kind === "topic-notes") {
      score += examClose ? 4 : 4.5;
      badge = "Konu notu için uygun";
      actionLabel = examClose ? "Ana başlıkları toparla" : "Konuyu sıraya koy";
      summary = examClose
        ? "Sınava yaklaşırken bu konu notu ana başlıkları dağılmadan toparlamak için iyi duruyor."
        : "Bu kaynak dersin konu akışını ve temel kavramlarını yerleştirmek için güçlü bir giriş veriyor.";
    } else if (resource.contentHint === "prose-heavy" || kind === "notes" || kind === "book") {
      score += 3;
      badge = "Derin okuma için uygun";
      actionLabel = "Okumayla başla";
      summary = "Bu kaynak düzenli okuma ve kavramsal yerleştirme için daha uygun duruyor.";
    } else if (kind === "slides") {
      score += 2;
      badge = "Hızlı çerçeve için uygun";
      actionLabel = "Başlık yapısını tara";
      summary = "Önce yapıyı görmek, sonra detaylı kaynağa dönmek burada daha verimli olur.";
    } else {
      score += 1;
      badge = "Tamamlayıcı kaynak";
      actionLabel = "Ana okumaya eşlik et";
      summary = "Bunu ana okumanın yanında tamamlayıcı bir kaynak gibi kullanmak daha iyi gider.";
    }
  } else if (intelligence.mode === "interpretive") {
    if (kind === "summary" || kind === "notes") {
      score += examClose ? 5 : 4;
      badge = examClose ? "Toparlama için uygun" : "Tema çalışması için uygun";
      actionLabel = examClose ? "Ana temaları toparla" : "Ana fikri kur";
      summary = examClose
        ? "Sınav yakınken kısa özetler ana temaları dağıtmadan toparlamayı kolaylaştırır."
        : "Bu kaynak yorum çizgisini ve ana tartışmaları kurmak için iyi bir başlangıç verir.";
    } else if (kind === "topic-notes") {
      score += examClose ? 4.5 : 4.5;
      badge = "Konu notu için uygun";
      actionLabel = examClose ? "Ana temaları toparla" : "Konuları bağla";
      summary = examClose
        ? "Sınav yakınken bu konu notu ana tema ve karşılaştırmaları dağılmadan toplamak için güçlü duruyor."
        : "Bu kaynak ana argümanları ve dönemsel akışı kurmak için güçlü bir konu notu gibi davranıyor.";
    } else if (resource.contentHint === "prose-heavy" || kind === "book") {
      score += 3;
      badge = "Yorumlama için uygun";
      actionLabel = "Ana temaları çıkar";
      summary = "Bu kaynak ana argümanları, karşılaştırmaları ve kavramsal bağları görmek için daha uygun duruyor.";
    } else if (kind === "slides") {
      score += 2;
      badge = "Çerçeve için uygun";
      actionLabel = "Başlık ve akışı tara";
      summary = "Önce başlık yapısını görmek, sonra ana tartışmaya dönmek burada daha verimli olur.";
    } else {
      score += 1;
      badge = "İkinci kaynak olarak uygun";
      actionLabel = "Yorumlamayı destekle";
      summary = "Bunu ana yorumlama çalışmasını destekleyen ikinci bir kaynak gibi kullanmak daha sağlıklı olur.";
    }
  } else if (intelligence.mode === "memorization") {
    if (kind === "summary") {
      score += examClose ? 5 : 4;
      badge = examClose ? "Tekrar için uygun" : "Yapı kurmak için uygun";
      actionLabel = examClose ? "Kısa tekrar yap" : "Madde yapısını kur";
      summary = examClose
        ? "Sınav yakınken kısa özetler terim ve yapı tekrarını daha temiz hale getirir."
        : "Bu kaynak konu başlıklarını ve ana yapıyı düzenli biçimde yerleştirmek için uygun duruyor.";
    } else if (kind === "topic-notes") {
      score += examClose ? 4.5 : 4;
      badge = "Konu notu için uygun";
      actionLabel = examClose ? "Konu başlıklarını toparla" : "Konuyu sıraya koy";
      summary = examClose
        ? "Sınav yakınken bu konu notu dönemleri ve başlıkları dağılmadan toparlamak için iyi bir katman veriyor."
        : "Bu kaynak konu başlıklarını, dönem akışını ve temel yapıyı düzenli biçimde kurmak için uygun duruyor.";
    } else if (kind === "notes" || kind === "slides") {
      score += 3;
      badge = "Kısa tekrar için uygun";
      actionLabel = "Terimleri toparla";
      summary = "Bu kaynak kısa tekrar ve sınıflandırma için daha düzenli bir zemin veriyor.";
    } else if (resource.contentHint === "prose-heavy" || kind === "book") {
      score += 2;
      badge = "Kaynak taraması için uygun";
      actionLabel = "Başlık ve madde yapısını çıkar";
      summary = "Bu kaynak doğrudan ezber için değil, önce yapıyı çıkarmak için daha uygun görünüyor.";
    } else {
      score += 1;
      badge = "Yardımcı kaynak";
      actionLabel = "Tekrarı destekle";
      summary = "Bunu ana tekrarın yanında yardımcı bir kaynak gibi kullanmak daha mantıklı olur.";
    }
  } else {
    if (kind === "summary") {
      score += 4;
      badge = "Çerçeve kurmak için uygun";
      actionLabel = "Özet üstünden çerçeve kur";
      summary = "Kısa özetle ana yapıyı kurup ardından detay veya uygulamaya geçmek burada daha dengeli olur.";
    } else if (kind === "questions") {
      score += 3;
      badge = "Pekiştirme için uygun";
      actionLabel = "Uygulama tarafına geç";
      summary = "Kısa bir yerleşme sonrası bunu uygulama ve sağlamlaştırma için açmak mantıklı olur.";
    } else if (resource.contentHint === "mixed" || kind === "notes") {
      score += 2.5;
      badge = "Dengeli çalışma için uygun";
      actionLabel = "Kavramı kur, ardından uygula";
      summary = "Burada önce kavramı yerleştirip ardından uygulamaya dönmek doğal bir akış verir.";
    } else {
      score += 1.5;
      badge = "Çalışma akışına uygun";
      actionLabel = intelligence.sessionLabel;
      summary = "Bu kaynak dersin genel ritmine uyuyor.";
    }
  }

  if (resourceHasPages) {
    if (progressRatio === 0) score += 1.25;
    if (progressRatio > 0 && progressRatio < 0.7) score += 1.5;
    if (progressRatio >= 0.7) score -= 0.5;
  }

  if (examClose && kind === "summary") {
    score += 1;
  }

  if (narrowedWindow && kind === "topic-notes") {
    score += 0.6;
  }

  if (proximity.prefersQuickReview && kind === "questions" && intelligence.mode === "problem") {
    score += 0.75;
  }

  score += getEngagementBoost(resource, referenceTime);
  summary += getEngagementSentence(resource, referenceTime);

  return {
    resourceId: resource.id,
    badge,
    summary,
    actionLabel,
    score,
  };
}

export function buildResourceUploadInsight(input: {
  subjectTitle: string;
  resource: ResourceItem;
  existingResources: ResourceItem[];
  intelligence: StudyIntelligence;
  hoursUntilExam: number;
}) {
  const guidance = getResourceGuidance(
    input.resource,
    input.intelligence,
    input.hoursUntilExam,
  );
  const topics = buildSubjectTopicMap([...input.existingResources, input.resource]).slice(0, 3);
  const proximity = getExamProximityProfile(input.hoursUntilExam);
  const topicSentence =
    topics.length > 0
      ? `${topics.slice(0, 2).join(" ve ")} artık bu ders için daha görünür.`
      : `${input.resource.title} bu ders için daha net bir başlangıç veriyor.`;
  const timingSentence = proximity.prefersConsolidation || proximity.prefersQuickReview
    ? ` Şu aşamada ilk mantıklı adım ${guidance.actionLabel.toLocaleLowerCase("tr-TR")}.`
    : ` İlk mantıklı adım ${guidance.actionLabel.toLocaleLowerCase("tr-TR")}.`;

  return {
    headline: `${input.subjectTitle} için yeni bir kaynak eklendi`,
    body: `${topicSentence}${timingSentence}`,
    topics,
  } satisfies ResourceUploadInsight;
}

export function pickPrimaryResourceGuidance(
  resources: ResourceItem[],
  intelligence: StudyIntelligence,
  hoursUntilExam: number,
  referenceTime: Date = new Date(),
) {
  if (resources.length === 0) return null;

  return resources
    .map((resource) => ({
      resource,
      guidance: getResourceGuidance(resource, intelligence, hoursUntilExam, referenceTime),
    }))
    .sort((left, right) => right.guidance.score - left.guidance.score)[0] ?? null;
}
