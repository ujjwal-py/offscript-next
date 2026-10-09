import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { editPost, getSingleHomePost } from "@/lib/services/posts";
import { errorResponse, parsePostForm } from "@/lib/route-utils";
import { updatePostSchema } from "@/lib/validation";

/** GET /v1/posts/:id — a single published post */
export async function GET(request: NextRequest, ctx: RouteContext<"/v1/posts/[id]">) {
  try {
    const { id } = await ctx.params;
    const post = await getSingleHomePost(id);
    return NextResponse.json({ post });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PUT /v1/posts/:id — edit a post owned by the current user.
 * Multipart form: title?, description?, status?, image?
 */
export async function PUT(request: NextRequest, ctx: RouteContext<"/v1/posts/[id]">) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await ctx.params;
    const formData = await request.formData();
    const { data, image } = await parsePostForm(formData, updatePostSchema);
    const post = await editPost(authUser.user_id, id, data, image);
    return NextResponse.json(post);
  } catch (err) {
    return errorResponse(err);
  }
}
