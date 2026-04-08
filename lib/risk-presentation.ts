import { RiskLabel } from "@/lib/types";

export function getGuidanceCopy(label: RiskLabel, options?: { rank?: number }) {
  const rank = options?.rank;

  switch (label) {
    case "Critical":
      return {
        badge: "Öne al",
        summary:
          rank === undefined || rank === 1
            ? "Bugün ilk sırada"
            : rank === 2
              ? "İlk sıranın hemen arkasında"
              : "Bugün yakın planda",
      };
    case "High":
      return {
        badge: "Yakın takip",
        summary: rank !== undefined && rank > 1 ? "Bugün yakın takipte" : "Gündemin üstünde",
      };
    case "Moderate":
      return {
        badge: "Gündemde tut",
        summary: "Bu hafta izlemeye değer",
      };
    case "Low":
    default:
      return {
        badge: "Stabil",
        summary: "Şimdilik alan açıyor",
      };
  }
}
