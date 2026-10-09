import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";
import type { OrderTypes, SortTypes } from "@/lib/types";

/** GET /v1/posts — paginated feed of published posts */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const posts = await getAllPosts({
      page: Number(params.get("page")) || 1,
      order: params.get("order") === "asc" ? ("asc" as OrderTypes) : ("desc" as OrderTypes),
      sort_by: params.get("sort_by") === "updatedAt" ? ("updatedAt" as SortTypes) : ("likes" as SortTypes),
    });
    return NextResponse.json(posts);
  } catch (err) {
    return errorResponse(err);
  }
}
