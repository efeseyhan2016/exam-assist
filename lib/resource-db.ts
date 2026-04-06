import {
  deleteResourceFileFromCloud,
  uploadResourceFileToCloud,
} from "@/lib/cloud-resources";
import type { ResourceItem } from "@/lib/types";

const DB_NAME = "examassist-resources";
const FILE_STORE = "files";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveResourceFile(id: string, file: File) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  try {
    return await uploadResourceFileToCloud({ resourceId: id, file });
  } catch (error) {
    console.debug("[resource-db] cloud upload skipped", { id, error });
    return {
      storageProvider: "local" as const,
      mimeType: file.type || undefined,
    };
  }
}

export async function getResourceFile(id: string): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const request = tx.objectStore(FILE_STORE).get(id);
    request.onsuccess = () => resolve((request.result as File) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteResourceFile(resource: Pick<ResourceItem, "id" | "cloudPath">): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    tx.objectStore(FILE_STORE).delete(resource.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  try {
    await deleteResourceFileFromCloud(resource.cloudPath);
  } catch (error) {
    console.debug("[resource-db] cloud delete skipped", { id: resource.id, error });
  }
}
