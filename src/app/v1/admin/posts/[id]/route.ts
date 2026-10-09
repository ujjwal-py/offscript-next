import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { deletePostAdmin } from "@/lib/services/posts";
import { errorResponse } from "@/lib/route-utils";

/** DELETE /v1/admin/posts/:id — admin deletes any post */
export async function DELETE(request: Request, ctx: RouteContext<"/v1/admin/posts/[id]">) {
  try {
    await requireAdminUser();
    const { id } = await ctx.params;
    const result = await deletePostAdmin(id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
