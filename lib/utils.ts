import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Words that should stay uppercase regardless of position (course codes, abbreviations)
const ALWAYS_UPPER = new Set(["ii", "iii", "iv", "vi", "vii", "viii", "pom", "ai", "hr"]);

// Common small words to keep lowercase when not first
const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at",
  "to", "by", "in", "of", "up", "as", "is",
  "ve", "ya", "da", "de", "ile", "bu", "bir", "için",
]);

/**
 * Converts an ALL CAPS subject title (e.g. from PDF import) to readable title case.
 * Keeps course codes (e.g. "MAN409") intact.
 *
 * "MAN409 RETAIL MARKETING MANAGEMENT" → "MAN409 Retail Marketing Management"
 */
export function toSubjectTitleCase(title: string): string {
  if (!title) return title;

  // If already mixed-case (not all-caps), return as-is
  const lettersOnly = title.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "");
  if (lettersOnly.length > 0 && lettersOnly !== lettersOnly.toUpperCase()) {
    return title;
  }

  return title
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return word;

      // Keep course codes uppercase: starts with letters followed immediately by digits (e.g. MAN409, AIT204)
      if (/^[A-ZĞÜŞİÖÇ]{2,}[0-9]/.test(word)) return word;

      const lower = word.toLowerCase();

      // Always uppercase short abbreviations
      if (ALWAYS_UPPER.has(lower)) return word.toUpperCase();

      // Small words stay lowercase unless they're the first word
      if (index > 0 && LOWERCASE_WORDS.has(lower)) return lower;

      // Capitalize first letter
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
