import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CustomError } from "@/lib/errors";
import { config } from "@/lib/config";

/**
 * In-memory Supabase client. The client is created lazily so that the app
 * still boots (and posts work without images) when storage is not configured.
 */
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabase_url, config.supabase_service_role_key);
  }
  return supabase;
}

type UploadableImage = {
  /** Raw file contents */
  buffer: Buffer;
  /** e.g. image/jpeg */
  mimetype: string;
};

type UploadedImage = {
  path: string;
  publicUrl: string;
};

export const uploadPostImage = async (file: UploadableImage): Promise<UploadedImage> => {
  const bucket = config.supabase_bucket;
  if (!bucket || !config.supabase_url || !config.supabase_service_role_key) {
    throw new CustomError(500, "SUPABASE_CONFIG_ERROR", "Storage is not configured");
  }

  const extension = file.mimetype.split("/")[1] ?? "bin";
  const path = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  const { error } = await getSupabase().storage
    .from(bucket)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new CustomError(500, "SUPABASE_UPLOAD_ERROR", "Failed to upload image");
  }

  const publicUrl = getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, publicUrl };
};

export const deletePostImage = async (publicUrl: string | null) => {
  const bucket = config.supabase_bucket;
  if (!bucket || !publicUrl) return;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const pathname = new URL(publicUrl).pathname;
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex === -1) return;

  const path = decodeURIComponent(pathname.slice(markerIndex + marker.length));
  if (!path) return;

  const { error } = await getSupabase().storage.from(bucket).remove([path]);
  if (error) {
    throw new CustomError(500, "SUPABASE_DELETE_ERROR", "Failed to delete image");
  }
};
