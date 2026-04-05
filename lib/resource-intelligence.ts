import { StudyIntelligence } from "@/lib/subject-intelligence";
import { ResourceItem } from "@/lib/types";

export interface ResourceGuidance {
  resourceId: string;
  badge: string;
  summary: string;
  actionLabel: string;
  score: number;
}

type ResourceKind =
  | "questions"
  | "summary"
  | "slides"
  | "notes"
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

function inferResourceKind(title: string): ResourceKind {
  const normalized = normalizeText(title);

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

  return "unknown";
}

function getProgressRatio(resource: ResourceItem) {
  if (resource.pageCount <= 0) return 0;
  return resource.pagesRead / resource.pageCount;
}

export function getResourceGuidance(
  resource: ResourceItem,
  intelligence: StudyIntelligence,
  hoursUntilExam: number,
): ResourceGuidance {
  const kind = inferResourceKind(resource.title);
  const progressRatio = getProgressRatio(resource);
  const examClose = hoursUntilExam > 0 && hoursUntilExam <= 48;
  const resourceHasPages = resource.pageCount > 0;

  let score = 0;
  let badge = "Genel kaynak";
  let actionLabel = intelligence.sessionLabel;
  let summary = "Bu kaynak dersin genel akışına destek olur.";

  if (intelligence.mode === "practice") {
    if (kind === "questions") {
      score += 5;
      badge = "Soru çözümü için iyi";
      actionLabel = "Soruyla başla";
      summary = "Burada doğrudan soru çözmek daha iyi sonuç verir.";
    } else if (resource.contentHint === "formula-heavy") {
      score += 3;
      badge = "Referans olarak güçlü";
      actionLabel = "Formülleri gözden geçir";
      summary = "Önce kilit formülleri tazele, sonra soruya dön.";
    } else if (kind === "summary" || kind === "notes") {
      score += 2;
      badge = "Kısa tekrar için iyi";
      actionLabel = "Kısa tekrar yap";
      summary = "Uzun okuma yerine kısa tekrar için kullanmak daha mantıklı.";
    } else {
      score += 1;
      badge = "Destek kaynağı";
      actionLabel = "Referans olarak aç";
      summary = "Bunu açık tutup asıl ilerlemeyi soru çözerek yapmak daha iyi gider.";
    }
  } else if (intelligence.mode === "reading") {
    if (kind === "summary") {
      score += examClose ? 5 : 3;
      badge = examClose ? "Son tekrar için iyi" : "Hızlı giriş için iyi";
      actionLabel = examClose ? "Kısa tekrar yap" : "Buradan başla";
      summary = examClose
        ? "Sınav yakınken kısa özetler en temiz tekrar yolunu açar."
        : "Kavramlara hızlıca yerleşmek için iyi bir giriş noktası.";
    } else if (resource.contentHint === "prose-heavy" || kind === "notes" || kind === "book") {
      score += 3;
      badge = "Okuma ile başla";
      actionLabel = "Oku ve not al";
      summary = "Bu kaynak düzenli okuma ve kısa not alma akışına daha uygun.";
    } else if (kind === "slides") {
      score += 2;
      badge = "Başlık taraması için iyi";
      actionLabel = "Önce tarama yap";
      summary = "Önce başlıkları tara, sonra detaylı kaynağa geçmek iyi olur.";
    } else {
      score += 1;
      badge = "Tamamlayıcı kaynak";
      actionLabel = "Okumaya eşlik et";
      summary = "Bunu ana okuma kaynağını destekleyen kısa bir katman gibi kullan.";
    }
  } else {
    if (kind === "summary") {
      score += 4;
      badge = "İlk ısınma için iyi";
      actionLabel = "Önce burayı aç";
      summary = "Kısa özetle başlayıp ardından soru veya detaylı nota geçmek iyi gider.";
    } else if (kind === "questions") {
      score += 3;
      badge = "Pekiştirme için iyi";
      actionLabel = "Sonra soru çöz";
      summary = "Kısa bir okuma sonrası bunu pekiştirme için açmak mantıklı.";
    } else if (resource.contentHint === "mixed" || kind === "notes") {
      score += 2.5;
      badge = "Dengeli kaynak";
      actionLabel = "Oku, sonra uygula";
      summary = "Burada kavramı toparlayıp ardından uygulamaya geçmek doğal olur.";
    } else {
      score += 1.5;
      badge = "Çalışmaya uygun";
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

  return {
    resourceId: resource.id,
    badge,
    summary,
    actionLabel,
    score,
  };
}

export function pickPrimaryResourceGuidance(
  resources: ResourceItem[],
  intelligence: StudyIntelligence,
  hoursUntilExam: number,
) {
  if (resources.length === 0) return null;

  return resources
    .map((resource) => ({
      resource,
      guidance: getResourceGuidance(resource, intelligence, hoursUntilExam),
    }))
    .sort((left, right) => right.guidance.score - left.guidance.score)[0] ?? null;
}
