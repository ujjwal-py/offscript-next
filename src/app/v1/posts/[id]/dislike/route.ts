import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { dislikePost } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** DELETE /v1/posts/:id/dislike — remove the current user's like */
export async function DELETE(request: Request, ctx: RouteContext<"/v1/posts/[id]/dislike">) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await ctx.params;
    const result = await dislikePost(authUser.user_id, id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
