import { RiskLabel } from "@/lib/types";

export function getGuidanceCopy(label: RiskLabel) {
  switch (label) {
    case "Critical":
      return {
        badge: "Hemen başla",
        summary: "Öncelikli ders",
      };
    case "High":
      return {
        badge: "Yakın takipte",
        summary: "Sıradaki öncelik",
      };
    case "Moderate":
      return {
        badge: "Gözle",
        summary: "Bu hafta takip et",
      };
    case "Low":
    default:
      return {
        badge: "Sakin",
        summary: "Şimdilik bekleyebilir",
      };
  }
}
