"use client";

import { useCallback, useEffect, useState } from "react";

import { deleteResourceFile, saveResourceFile } from "@/lib/resource-db";
import { analyzeContentFingerprint, detectFileType, extractPdfPageCount } from "@/lib/pdf-engine";
import { readResources, writeResources } from "@/lib/storage";
import { ContentTypeHint, ResourceItem } from "@/lib/types";

export function useResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setResources(readResources());
    setIsReady(true);
  }, []);

  const addResource = useCallback(async (subjectId: string, file: File): Promise<void> => {
    const id = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const type = detectFileType(file);

    let pageCount = 0;
    let contentHint: ContentTypeHint | undefined;

    if (type === "pdf") {
      try {
        pageCount = await extractPdfPageCount(file);
      } catch {
        // page count stays 0 — user can update manually
      }
      try {
        contentHint = await analyzeContentFingerprint(file);
      } catch {
        // stays undefined — no classification
      }
    }

    await saveResourceFile(id, file);

    const item: ResourceItem = {
      id,
      subjectId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type,
      pageCount,
      pagesRead: 0,
      fileSizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      contentHint,
    };

    setResources((prev) => {
      const next = [...prev, item];
      writeResources(next);
      return next;
    });
  }, []);

  const updateProgress = useCallback((id: string, pagesRead: number) => {
    setResources((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, pagesRead: Math.max(0, Math.min(pagesRead, r.pageCount)) } : r));
      writeResources(next);
      return next;
    });
  }, []);

  const updatePageCount = useCallback((id: string, pageCount: number) => {
    setResources((prev) => {
      const next = prev.map((r) =>
        r.id === id
          ? { ...r, pageCount: Math.max(0, pageCount), pagesRead: Math.min(r.pagesRead, pageCount) }
          : r,
      );
      writeResources(next);
      return next;
    });
  }, []);

  const removeResource = useCallback(async (id: string): Promise<void> => {
    await deleteResourceFile(id).catch(() => null);
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeResources(next);
      return next;
    });
  }, []);

  return { resources, isReady, addResource, updateProgress, updatePageCount, removeResource };
}
