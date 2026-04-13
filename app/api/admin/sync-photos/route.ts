import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { listDriveSubfolders, listDrivePhotos, downloadDriveFile } from "@/lib/google-drive";
import { optimizeImage } from "@/lib/image-optimizer";
import { getPhotoRegistry, savePhotoRegistry } from "@/lib/photo-registry";
import type { PhotoAsset, BlogFrontmatter } from "@/lib/types";

/**
 * Map Google Drive folder names to blog categories.
 */
const FOLDER_CATEGORY_MAP: Record<string, BlogFrontmatter["category"]> = {
  "HARDSCAPING": "hardscaping",
  "HARDSCAPING ": "hardscaping",
  "SOFTSCAPE & PLANTING": "softscaping-planting",
  "SOFTSCAPE & PLANTING ": "softscaping-planting",
  "IRRIGATION": "irrigation-drainage",
  "LANDSCAPE LIGHTING": "landscape-lighting",
  "LANDSCAPE LIGHTING ": "landscape-lighting",
  "STEEL FABRICATION": "metal-fabrication",
  "PROPERTY AND PEST MANAGEMENT": "property-management",
  "PROPERTY AND PEST MANAGEMENT ": "property-management",
  "Design": "landscape-design",
  "Install": "general",
  "Owner": "general",
};

function mapFolderToCategory(
  folderName: string
): BlogFrontmatter["category"] {
  // Try exact match first, then trimmed
  return (
    FOLDER_CATEGORY_MAP[folderName] ||
    FOLDER_CATEGORY_MAP[folderName.trim()] ||
    "general"
  );
}

/**
 * Generate descriptive alt text from filename and category.
 */
function generateAltText(filename: string, category: string): string {
  const name = filename
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[-_]/g, " ") // dashes/underscores to spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()); // title case

  const categoryLabel = category.replace(/-/g, " ");
  return `${name} — ${categoryLabel} project by Outdoor Renovations in Austin, TX`;
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json(
      { error: "GOOGLE_DRIVE_FOLDER_ID not set" },
      { status: 500 }
    );
  }

  try {
    console.log("[SYNC] Starting photo sync from Google Drive...");

    // Load existing registry
    const registry = await getPhotoRegistry();
    const existingIds = new Set(registry.photos.map((p) => p.id));

    // List subfolders (each is a service category)
    const subfolders = await listDriveSubfolders(folderId);
    console.log(`[SYNC] Found ${subfolders.length} category folders`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;
    const newPhotos: PhotoAsset[] = [];

    // Walk each subfolder
    for (const folder of subfolders) {
      const category = mapFolderToCategory(folder.name);
      console.log(`[SYNC] Scanning "${folder.name}" → category: ${category}`);

      const photos = await listDrivePhotos(folder.id);
      console.log(`[SYNC]   Found ${photos.length} images`);

      for (const photo of photos) {
        if (existingIds.has(photo.id)) {
          // Check if modified since last sync
          const existing = registry.photos.find((p) => p.id === photo.id);
          if (
            existing &&
            existing.driveModifiedTime === photo.modifiedTime
          ) {
            skipped++;
            continue;
          }
        }

        try {
          // Download from Drive
          console.log(`[SYNC]   Downloading: ${photo.name}`);
          const rawBuffer = await downloadDriveFile(photo.id);

          // Optimize
          const optimized = await optimizeImage(rawBuffer);
          console.log(
            `[SYNC]   Optimized: ${(parseInt(photo.size) / 1024 / 1024).toFixed(1)}MB → ${(optimized.sizeBytes / 1024).toFixed(0)}KB`
          );

          // Upload to Vercel Blob
          const blobName = `photos/${category}/${photo.name}`;
          const blob = await put(blobName, optimized.buffer, {
            access: "public",
            contentType: "image/jpeg",
          });
          console.log(`[SYNC]   Uploaded to Blob: ${blob.url}`);

          const asset: PhotoAsset = {
            id: photo.id,
            filename: photo.name,
            blobUrl: blob.url,
            category,
            alt: generateAltText(photo.name, category),
            width: optimized.width,
            height: optimized.height,
            sizeBytes: optimized.sizeBytes,
            driveModifiedTime: photo.modifiedTime,
            syncedAt: new Date().toISOString(),
            usageCount: 0,
            lastUsedAt: null,
          };

          newPhotos.push(asset);
          synced++;
        } catch (err) {
          console.error(`[SYNC]   Error processing ${photo.name}:`, err);
          errors++;
        }
      }
    }

    // Merge new photos into registry (replace existing by ID, add new)
    const updatedPhotos = registry.photos.filter(
      (p) => !newPhotos.find((n) => n.id === p.id)
    );
    updatedPhotos.push(...newPhotos);

    const updatedRegistry = {
      ...registry,
      photos: updatedPhotos,
      lastSyncedAt: new Date().toISOString(),
      driveFolderId: folderId,
    };

    // Save to GitHub
    await savePhotoRegistry(updatedRegistry);
    console.log(
      `[SYNC] Complete: ${synced} synced, ${skipped} skipped, ${errors} errors. Total: ${updatedPhotos.length} photos`
    );

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      errors,
      total: updatedPhotos.length,
      categories: Object.fromEntries(
        Object.entries(
          updatedPhotos.reduce(
            (acc, p) => {
              acc[p.category] = (acc[p.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          )
        )
      ),
    });
  } catch (error) {
    console.error("[SYNC] Photo sync error:", error);
    return NextResponse.json(
      {
        error: "Photo sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
