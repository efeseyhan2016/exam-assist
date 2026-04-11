"use client";

import { useCallback, useEffect, useState } from "react";

import { createMaterialUpdateAcademicEvent } from "@/lib/academic-events";
import { uploadResourceFileToCloud } from "@/lib/cloud-resources";
import { deleteResourceFile, getResourceFile, saveResourceFile } from "@/lib/resource-db";
import {
  analyzeContentFingerprint,
  detectFileType,
  deriveTopicHints,
  extractPdfPageCount,
  extractPdfTextLines,
  inferResourceKindHintFromDocumentSignals,
} from "@/lib/pdf-engine";
import { validateResourceFile } from "@/lib/resource-validation";
import {
  readResources,
  removeAcademicEvent,
  upsertAcademicEvent,
  writeResources,
} from "@/lib/storage";
import { isSupabaseEnabled } from "@/lib/supabase/config";
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
  const cloudEnabled = isSupabaseEnabled();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      setResources(readResources());
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cloudEnabled || !isReady) {
      return;
    }

    const pendingResources = resources.filter((resource) => !resource.cloudPath);

    if (pendingResources.length === 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const upgrades = await Promise.all(
        pendingResources.map(async (resource) => {
          const file = await getResourceFile(resource.id).catch(() => null);

          if (!file) {
            return null;
          }

          const uploaded = await uploadResourceFileToCloud({
            resourceId: resource.id,
            file,
          }).catch(() => null);

          if (!uploaded?.cloudPath) {
            return null;
          }

          return {
            id: resource.id,
            cloudPath: uploaded.cloudPath,
            storageProvider: uploaded.storageProvider,
            mimeType: uploaded.mimeType,
          };
        }),
      );

      if (cancelled || upgrades.every((item) => item === null)) {
        return;
      }

      setResources((prev) => {
        const next = prev.map((resource) => {
          const upgraded = upgrades.find((item) => item?.id === resource.id);

          if (!upgraded) {
            return resource;
          }

          return {
            ...resource,
            cloudPath: upgraded.cloudPath,
            storageProvider: upgraded.storageProvider,
            mimeType: upgraded.mimeType ?? resource.mimeType,
          };
        });

        writeResources(next);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, isReady, resources]);

  const addResource = useCallback(async (subjectId: string, file: File): Promise<ResourceItem> => {
    const validationError = validateResourceFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const id = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const type = detectFileType(file);

    let pageCount = 0;
    let contentHint: ContentTypeHint | undefined;
    let topicHints: string[] | undefined;
    let resourceKindHint: ResourceItem["resourceKindHint"] | undefined;

    if (type === "pdf") {
      let pdfTextLines: string[] = [];

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
      try {
        pdfTextLines = await extractPdfTextLines(file);
        topicHints = deriveTopicHints({
          title: file.name.replace(/\.[^/.]+$/, ""),
          rowTexts: pdfTextLines,
        });
      } catch {
        // stays undefined/empty — no topic map, kind remains unknown
      }

      resourceKindHint = inferResourceKindHintFromDocumentSignals({
        title: file.name.replace(/\.[^/.]+$/, ""),
        lines: pdfTextLines,
        pageCount,
        contentHint,
      });
    } else {
      topicHints = deriveTopicHints({
        title: file.name.replace(/\.[^/.]+$/, ""),
      });
      resourceKindHint = inferResourceKindHintFromDocumentSignals({
        title: file.name.replace(/\.[^/.]+$/, ""),
      });
    }

    const persistedFile = await saveResourceFile(id, file);

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
      resourceKindHint,
      topicHints,
      storageProvider: persistedFile?.storageProvider ?? "local",
      cloudPath: persistedFile?.cloudPath,
      mimeType: persistedFile?.mimeType ?? (file.type.trim() ? file.type : undefined),
      engagementCount: 0,
      revisitCount: 0,
    };

    setResources((prev) => {
      const next = [...prev, item];
      writeResources(next);
      return next;
    });
    upsertAcademicEvent(createMaterialUpdateAcademicEvent(item));

    return item;
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
    const resource = resources.find((item) => item.id === id);
    if (resource) {
      await deleteResourceFile(resource).catch(() => null);
    }
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeResources(next);
      return next;
    });
    removeAcademicEvent(`resource-update:${id}`);
  }, [resources]);

  return { resources, isReady, addResource, updateProgress, updatePageCount, removeResource };
}
