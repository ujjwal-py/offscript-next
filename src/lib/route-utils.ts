import { NextResponse } from "next/server";
import { CustomError, ValidationError } from "@/lib/errors";
import type { ZodType } from "zod";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Mirrors the Express global error handler:
 * - ValidationError -> 400 { message, Errors }
 * - CustomError     -> { message, errCode }
 * - anything else   -> 500 { message: "Something went wrong", errCode: "SE500" }
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ message: err.message, Errors: err.errors }, { status: err.statusCode });
  }
  if (err instanceof CustomError) {
    return NextResponse.json({ message: err.message, errCode: err.errorCode }, { status: err.statusCode });
  }
  console.error(err);
  return NextResponse.json({ message: "Something went wrong", errCode: "SE500" }, { status: 500 });
}

/** Validate a JSON request body with a Zod schema (like the validate middleware). */
export function validateBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Validation Error", result.error.flatten().fieldErrors);
  }
  return result.data;
}

export type PostImageFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

/**
 * Parse a multipart post form (create/update). Mirrors Multer's file filter and
 * size limits plus the Zod body validation of the original server.
 */
export async function parsePostForm<T>(
  formData: FormData,
  schema: ZodType<T>
): Promise<{ data: T; image: PostImageFile | null }> {
  const raw: Record<string, unknown> = {
    title: formData.get("title") ?? undefined,
    description: formData.get("description") ?? undefined,
    status: formData.get("status") ?? undefined,
  };

  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError("Validation Error", result.error.flatten().fieldErrors);
  }

  const imageEntry = formData.get("image");
  let image: PostImageFile | null = null;

  if (imageEntry instanceof File && imageEntry.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageEntry.type)) {
      throw new ValidationError("Only JPEG, PNG, and WEBP images are allowed");
    }
    if (imageEntry.size > MAX_IMAGE_SIZE) {
      throw new ValidationError("Image must be 5 MB or smaller");
    }
    image = {
      buffer: Buffer.from(await imageEntry.arrayBuffer()),
      mimetype: imageEntry.type,
      size: imageEntry.size,
    };
  }

  return { data: result.data, image };
}
