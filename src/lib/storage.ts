import { randomUUID } from "node:crypto";
import { mkdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "@/lib/config";
import { ValidationError } from "@/lib/errors";

/**
 * Local image storage for post images.
 *
 * Every upload is re-encoded to WebP, which keeps the file under ~1 MB and
 * makes serving safe: nothing but a raster image can come out of the encoder,
 * so an SVG/HTML payload can never be served back to a browser. Files live in
 * UPLOAD_DIR and are exposed at /uploads/<uuid>.webp. Only that relative URL is
 * stored in Postgres, so the same row works on localhost or behind any domain.
 */

export const UPLOAD_URL_PREFIX = "/uploads";

/** Extra read/delete location kept so pre-migration images still resolve. */
const LEGACY_UPLOAD_DIR = path.join("public", "uploads");

/** Uploads are capped at 5 MB; the encoded file is kept below 1 MB. */
const TARGET_BYTES = 900 * 1024;
const MAX_DIMENSION = 1600;
/** Guard against decompression bombs before libvips allocates a bitmap. */
const MAX_INPUT_PIXELS = 50_000_000;
const OUTPUT_EXTENSION = "webp";

/** Re-encode attempts, cheapest first. Most images settle on the first pass. */
const ENCODE_STEPS: ReadonlyArray<{ scale: number; quality: number }> = [
  { scale: 1, quality: 76 },
  { scale: 1, quality: 68 },
  { scale: 1, quality: 60 },
  { scale: 0.8, quality: 70 },
  { scale: 0.65, quality: 60 },
];

/**
 * effort 2 keeps CPU roughly half of the default (4) for ~5% larger output,
 * which matters when several uploads land on a small instance at once.
 */
const WEBP_EFFORT = 2;

/** Formats libvips can decode and a browser can display. */
const SUPPORTED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff", "svg", "heif"]);

// Keep encoding predictable on small instances (a t3.small has 2 vCPUs) and
// skip libvips' operation cache: uploads are one-shot work.
sharp.concurrency(1);
sharp.cache(false);

export type UploadableImage = {
  /** Raw file contents */
  buffer: Buffer;
  /** e.g. image/jpeg (already validated by the form parser) */
  mimetype: string;
  size: number;
};

export type UploadedImage = {
  /** Stored file name, e.g. 2f1c...-....webp */
  fileName: string;
  /** Relative URL stored in the database */
  publicUrl: string;
};

const uploadRoot = () => path.resolve(process.cwd(), config.upload_dir);

const uploadRoots = (): string[] => [
  uploadRoot(),
  path.resolve(process.cwd(), LEGACY_UPLOAD_DIR),
];

const isInside = (root: string, candidate: string): boolean =>
  candidate === root || candidate.startsWith(root + path.sep);

let ensuredRoot: Promise<void> | null = null;
const ensureUploadRoot = (): Promise<void> => {
  ensuredRoot ??= mkdir(uploadRoot(), { recursive: true }).then(() => undefined);
  return ensuredRoot;
};

/** File names we are willing to read back: no separators, no dotfiles. */
export const isServableFileName = (fileName: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._-]*\.(webp|jpe?g|png|gif|avif)$/i.test(fileName);

const encode = async (input: Buffer, step: { scale: number; quality: number }): Promise<Buffer> =>
  sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate() // honour EXIF orientation, then drop metadata
    .resize({
      width: Math.round(MAX_DIMENSION * step.scale),
      height: Math.round(MAX_DIMENSION * step.scale),
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: step.quality, effort: WEBP_EFFORT })
    .toBuffer();

/** Re-encode to WebP under TARGET_BYTES, or the smallest attempt if not. */
async function compressToWebp(input: Buffer): Promise<Buffer> {
  const probe = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .metadata()
    .catch(() => null);

  if (!probe?.format || !probe.width || !probe.height) {
    throw new ValidationError("That file is not a readable image");
  }
  if (!SUPPORTED_FORMATS.has(probe.format)) {
    throw new ValidationError(`Unsupported image format: ${probe.format}`);
  }

  let smallest = await encode(input, ENCODE_STEPS[0]);
  if (smallest.length <= TARGET_BYTES) return smallest;

  for (const step of ENCODE_STEPS.slice(1)) {
    const encoded = await encode(input, step);
    if (encoded.length < smallest.length) smallest = encoded;
    if (encoded.length <= TARGET_BYTES) break;
  }
  return smallest;
}

/** Write the image to UPLOAD_DIR and return its relative public URL. */
export const uploadPostImage = async (file: UploadableImage): Promise<UploadedImage> => {
  const bytes = await compressToWebp(file.buffer);
  const fileName = `${randomUUID()}.${OUTPUT_EXTENSION}`;
  const root = uploadRoot();
  const target = path.join(root, fileName);

  if (!isInside(root, target)) {
    throw new ValidationError("Invalid upload path");
  }

  await ensureUploadRoot();
  // Write-then-rename: a partially written file can never be served.
  const temp = path.join(root, `.${fileName}.part`);
  await writeFile(temp, bytes);
  await rename(temp, target);

  return { fileName, publicUrl: `${UPLOAD_URL_PREFIX}/${fileName}` };
};

/** "https://host/uploads/x.webp" or "/uploads/x.webp" -> "x.webp". */
export function fileNameFromPublicUrl(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;

  let pathname: string;
  try {
    pathname = new URL(publicUrl, "http://localhost").pathname;
  } catch {
    return null;
  }

  const prefix = `${UPLOAD_URL_PREFIX}/`;
  if (!pathname.startsWith(prefix)) return null;

  const fileName = pathname.slice(prefix.length);
  return isServableFileName(fileName) ? fileName : null;
}

/** Absolute path + size for a stored image, or null when it does not exist. */
export async function findUploadFile(fileName: string): Promise<{ path: string; size: number } | null> {
  if (!isServableFileName(fileName)) return null;

  for (const root of uploadRoots()) {
    const candidate = path.join(root, fileName);
    if (!isInside(root, candidate)) continue;

    const info = await stat(candidate).catch(() => null);
    if (info?.isFile()) return { path: candidate, size: info.size };
  }
  return null;
}

/**
 * Remove the stored file for a post image. Relative /uploads URLs are deleted
 * from disk; anything else (legacy absolute Supabase URLs) is left alone.
 */
export const deletePostImage = async (publicUrl: string | null | undefined): Promise<void> => {
  const fileName = fileNameFromPublicUrl(publicUrl);
  if (!fileName) return;

  for (const root of uploadRoots()) {
    const target = path.join(root, fileName);
    if (!isInside(root, target)) continue;

    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
};
