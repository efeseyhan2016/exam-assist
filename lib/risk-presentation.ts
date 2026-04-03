import { RiskLabel } from "@/lib/types";

export function getGuidanceCopy(label: RiskLabel) {
  switch (label) {
    case "Critical":
      return {
        badge: "Start now",
        summary: "Best next block",
      };
    case "High":
      return {
        badge: "Keep close",
        summary: "Likely next",
      };
    case "Moderate":
      return {
        badge: "In view",
        summary: "Watch this week",
      };
    case "Low":
    default:
      return {
        badge: "Stable",
        summary: "Can wait a little",
      };
  }
}
