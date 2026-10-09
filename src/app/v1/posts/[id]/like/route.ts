import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { likePost } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** POST /v1/posts/:id/like — like a published post */
export async function POST(request: Request, ctx: RouteContext<"/v1/posts/[id]/like">) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await ctx.params;
    const result = await likePost(authUser.user_id, id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
