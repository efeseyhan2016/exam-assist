import { detectFileType } from "@/lib/pdf-engine";

export const MAX_RESOURCE_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function validateResourceFile(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  if (!file.name.trim()) {
    return "Dosya adı okunamadı. Lütfen dosyayı tekrar seç.";
  }

  if (file.size <= 0) {
    return "Boş dosya yüklenemiyor.";
  }

  if (file.size > MAX_RESOURCE_FILE_SIZE_BYTES) {
    return "Dosya 25 MB sınırını aşıyor.";
  }

  if (detectFileType(file as File) === "other") {
    return "Şimdilik sadece PDF, DOC ve DOCX yükleyebilirsin.";
  }

  return null;
}
