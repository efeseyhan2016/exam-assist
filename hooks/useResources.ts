"use client";

import { useCallback, useEffect, useState } from "react";

import { deleteResourceFile, saveResourceFile } from "@/lib/resource-db";
import { analyzeContentFingerprint, detectFileType, extractPdfPageCount } from "@/lib/pdf-engine";
import { readResources, writeResources } from "@/lib/storage";
import { ContentTypeHint, ResourceItem } from "@/lib/types";

const INTERACTION_DEDUP_WINDOW_MS = 60_000;

function touchResource(resource: ResourceItem, nowIso: string): ResourceItem {
  const lastActiveAtMs = resource.lastActiveAt ? Date.parse(resource.lastActiveAt) : NaN;
  const nowMs = Date.parse(nowIso);
  const withinDedupWindow =
    Number.isFinite(lastActiveAtMs) && nowMs - lastActiveAtMs < INTERACTION_DEDUP_WINDOW_MS;

  if (withinDedupWindow) {
    return {
      ...resource,
      lastActiveAt: nowIso,
    };
  }

  const engagementCount = resource.engagementCount ?? 0;
  const revisitCount = resource.revisitCount ?? 0;

  return {
    ...resource,
    lastActiveAt: nowIso,
    engagementCount: engagementCount + 1,
    revisitCount: engagementCount > 0 ? revisitCount + 1 : revisitCount,
  };
}

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
      engagementCount: 0,
      revisitCount: 0,
    };

    setResources((prev) => {
      const next = [...prev, item];
      writeResources(next);
      return next;
    });
  }, []);

  const updateProgress = useCallback((id: string, pagesRead: number) => {
    setResources((prev) => {
      const nowIso = new Date().toISOString();
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const nextPagesRead = Math.max(0, Math.min(pagesRead, r.pageCount));
        if (nextPagesRead === r.pagesRead) return r;
        return touchResource(
          {
            ...r,
            pagesRead: nextPagesRead,
          },
          nowIso,
        );
      });
      writeResources(next);
      return next;
    });
  }, []);

  const updatePageCount = useCallback((id: string, pageCount: number) => {
    setResources((prev) => {
      const nowIso = new Date().toISOString();
      const next = prev.map((r) => {
        if (r.id !== id) return r;
        const nextPageCount = Math.max(0, pageCount);
        if (nextPageCount === r.pageCount) return r;
        return touchResource(
          {
            ...r,
            pageCount: nextPageCount,
            pagesRead: Math.min(r.pagesRead, nextPageCount),
          },
          nowIso,
        );
      });
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
