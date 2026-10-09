import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { getPendingPostsAdmin } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** GET /v1/admin/posts/pending — all posts awaiting moderation */
export async function GET() {
  try {
    await requireAdminUser();
    const posts = await getPendingPostsAdmin();
    return NextResponse.json({ posts });
  } catch (err) {
    return errorResponse(err);
  }
}
