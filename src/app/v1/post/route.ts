import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { createPost } from "@/lib/services/posts";
import { errorResponse, parsePostForm } from "@/lib/route-utils";
import { createPostSchema } from "@/lib/validation";

/**
 * POST /v1/post — create a post.
 * Multipart form: title, status, description?, image? (like the original
 * authenticate + upload.single("image") + validate(createPostSchema) chain).
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    const formData = await request.formData();
    const { data, image } = await parsePostForm(formData, createPostSchema);
    const post = await createPost(authUser.user_id, data, image);
    return NextResponse.json(post);
  } catch (err) {
    return errorResponse(err);
  }
}
