import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { userUnPublishedPosts } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** GET /v1/user/posts/unpublished — current user's drafts, pending and rejected posts */
export async function GET() {
  try {
    const authUser = await requireAuthUser();
    const posts = await userUnPublishedPosts(authUser.user_id);
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}
