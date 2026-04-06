"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export const RESOURCE_BUCKET = "course-resources";

interface AuthenticatedCloudResourceContext {
  userId: string;
}

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function buildCloudResourcePath(
  userId: string,
  resourceId: string,
  filename: string,
) {
  const safeName = sanitizeFileSegment(filename) || "resource";
  return `${userId}/${resourceId}/${safeName}`;
}

async function readAuthenticatedCloudResourceContext(): Promise<AuthenticatedCloudResourceContext | null> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
  };
}

export async function uploadResourceFileToCloud(input: {
  resourceId: string;
  file: File;
}): Promise<{
  storageProvider: "local" | "supabase";
  cloudPath?: string;
  mimeType?: string;
} | null> {
  const supabase = getSupabaseBrowserClient();
  const context = await readAuthenticatedCloudResourceContext();

  if (!supabase || !context) {
    return {
      storageProvider: "local",
      mimeType: input.file.type || undefined,
    };
  }

  const cloudPath = buildCloudResourcePath(
    context.userId,
    input.resourceId,
    input.file.name,
  );

  const { error } = await supabase.storage
    .from(RESOURCE_BUCKET)
    .upload(cloudPath, input.file, {
      upsert: true,
      contentType: input.file.type || undefined,
    });

  if (error) {
    throw new Error("Kaynak dosyası şu anda buluta yüklenemedi.");
  }

  return {
    storageProvider: "supabase" as const,
    cloudPath,
    mimeType: input.file.type || undefined,
  };
}

export async function deleteResourceFileFromCloud(cloudPath?: string | null) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase || !cloudPath) {
    return;
  }

  const { error } = await supabase.storage.from(RESOURCE_BUCKET).remove([cloudPath]);

  if (error) {
    throw new Error("Kaynak dosyası şu anda buluttan silinemedi.");
  }
}
