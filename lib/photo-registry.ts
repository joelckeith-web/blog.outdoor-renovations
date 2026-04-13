/**
 * Photo registry — tracks synced photos and usage for deduplication.
 * Stored in GitHub as content/photo-registry.json, same pattern as rotation.ts.
 */

import type { PhotoAsset, PhotoRegistry } from "./types";
import { getFileFromGitHub, pushFileToGitHub } from "./github";

const REGISTRY_FILE = "content/photo-registry.json";

function defaultRegistry(): PhotoRegistry {
  return {
    photos: [],
    lastSyncedAt: new Date().toISOString(),
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
  };
}

/**
 * Read the photo registry from GitHub.
 */
export async function getPhotoRegistry(): Promise<PhotoRegistry> {
  try {
    const content = await getFileFromGitHub(REGISTRY_FILE);
    if (!content) {
      console.log("[PHOTOS] No photo registry found, using defaults.");
      return defaultRegistry();
    }
    return JSON.parse(content) as PhotoRegistry;
  } catch (err) {
    console.warn("[PHOTOS] Error reading photo registry:", err);
    return defaultRegistry();
  }
}

/**
 * Save the photo registry to GitHub.
 */
export async function savePhotoRegistry(
  registry: PhotoRegistry
): Promise<void> {
  await pushFileToGitHub(
    REGISTRY_FILE,
    JSON.stringify(registry, null, 2),
    `Update photo registry (${registry.photos.length} photos)`
  );
}

/**
 * Select the best photo for a blog post.
 * Strategy: least-recently-used within the matching category.
 * Falls back to 'general' category if no match found.
 */
export function selectPhotoForPost(
  registry: PhotoRegistry,
  category: string,
  recentlyUsedIds: string[]
): PhotoAsset | null {
  if (registry.photos.length === 0) return null;

  // Try matching category first, then fall back to general
  let candidates = registry.photos.filter((p) => p.category === category);
  if (candidates.length === 0) {
    candidates = registry.photos.filter((p) => p.category === "general");
  }
  if (candidates.length === 0) {
    // Last resort: pick from all photos
    candidates = [...registry.photos];
  }

  // Exclude recently used (prevent back-to-back repeats)
  const fresh = candidates.filter((p) => !recentlyUsedIds.includes(p.id));
  const pool = fresh.length > 0 ? fresh : candidates;

  // Sort by usage count (ascending), then by lastUsedAt (oldest first)
  pool.sort((a, b) => {
    if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
    if (!a.lastUsedAt) return -1;
    if (!b.lastUsedAt) return 1;
    return new Date(a.lastUsedAt).getTime() - new Date(b.lastUsedAt).getTime();
  });

  return pool[0] || null;
}

/**
 * Mark a photo as used — increment counter and update timestamp.
 */
export function markPhotoUsed(
  registry: PhotoRegistry,
  photoId: string
): PhotoRegistry {
  return {
    ...registry,
    photos: registry.photos.map((p) =>
      p.id === photoId
        ? {
            ...p,
            usageCount: p.usageCount + 1,
            lastUsedAt: new Date().toISOString(),
          }
        : p
    ),
  };
}
