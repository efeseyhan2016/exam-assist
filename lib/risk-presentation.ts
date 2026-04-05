import { RiskLabel } from "@/lib/types";

export function getGuidanceCopy(label: RiskLabel) {
  switch (label) {
    case "Critical":
      return {
        badge: "Öne al",
        summary: "Bugün ilk sırada",
      };
    case "High":
      return {
        badge: "Yakın takip",
        summary: "Gündemin üstünde",
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
