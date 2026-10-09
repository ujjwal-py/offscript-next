import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { deletePostUser } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** DELETE /v1/post/:id — delete a post owned by the current user */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/v1/post/[id]">) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await ctx.params;
    const result = await deletePostUser(authUser.user_id, id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
