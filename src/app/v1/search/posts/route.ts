import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { searchPublicPosts } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";
import type { OrderTypes, SortTypes } from "@/lib/types";

/** GET /v1/search/posts — search all published posts by title */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const posts = await searchPublicPosts({
      q: params.get("q") ?? "",
      order: params.get("order") === "asc" ? ("asc" as OrderTypes) : ("desc" as OrderTypes),
      sort_by: params.get("sort_by") === "updatedAt" ? ("updatedAt" as SortTypes) : ("likes" as SortTypes),
    });
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}
