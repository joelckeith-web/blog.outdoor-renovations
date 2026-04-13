/**
 * Image optimization using sharp.
 * Resizes and compresses photos for web delivery.
 */

import sharp from "sharp";

export interface OptimizedImage {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Optimize an image for blog featured use.
 * Defaults: 1200px max width, 80% JPEG quality.
 * Typical output: 150-250KB from 5-15MB originals.
 */
export async function optimizeImage(
  imageBuffer: ArrayBuffer,
  options?: {
    maxWidth?: number;
    quality?: number;
  }
): Promise<OptimizedImage> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 80;

  const result = await sharp(Buffer.from(imageBuffer))
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    sizeBytes: result.info.size,
  };
}
