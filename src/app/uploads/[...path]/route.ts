import { createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { findUploadFile } from "@/lib/storage";

/**
 * Serves files from UPLOAD_DIR at /uploads/<file>.
 *
 * A route handler is used instead of `public/uploads` because Next snapshots
 * the public folder at boot: files written at run time would 404 until the
 * server restarts.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await params;

  // Uploads are flat: /uploads/<name> only, no sub-paths.
  if (segments.length !== 1) {
    return new Response("Not found", { status: 404 });
  }

  const fileName = segments[0];
  const file = await findUploadFile(fileName);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const body = Readable.toWeb(createReadStream(file.path)) as ReadableStream<Uint8Array>;

  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": String(file.size),
      // Names are unique, so the bytes never change for a given URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
