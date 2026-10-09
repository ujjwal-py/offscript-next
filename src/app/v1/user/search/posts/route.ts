import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { searchUserPosts } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";
import type { OrderTypes, SortTypes } from "@/lib/types";

/** GET /v1/user/search/posts — search the current user's published posts by title */
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuthUser();
    const params = request.nextUrl.searchParams;
    const posts = await searchUserPosts(authUser.user_id, {
      q: params.get("q") ?? "",
      order: params.get("order") === "asc" ? ("asc" as OrderTypes) : ("desc" as OrderTypes),
      sort_by: params.get("sort_by") === "updatedAt" ? ("updatedAt" as SortTypes) : ("likes" as SortTypes),
    });
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}
