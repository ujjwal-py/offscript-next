import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { userPublishedPosts } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";
import type { OrderTypes, SortTypes } from "@/lib/types";

/** GET /v1/user/posts/published — current user's published posts */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    const params = request.nextUrl.searchParams;
    const posts = await userPublishedPosts(authUser.user_id, {
      order: params.get("order") === "asc" ? ("asc" as OrderTypes) : ("desc" as OrderTypes),
      sort_by: params.get("sort_by") === "updatedAt" ? ("updatedAt" as SortTypes) : ("likes" as SortTypes),
    });
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}
