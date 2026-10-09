import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { editPostStatusAdmin } from "@/lib/services/posts";
import { errorResponse, validateBody } from "@/lib/route-utils";
import { adminPostSchema } from "@/lib/validation";

/** PUT /v1/admin/posts/:id/status — approve, reject or remove a post */
export async function PUT(request: NextRequest, ctx: RouteContext<"/v1/admin/posts/[id]/status">) {
  try {
    await requireAdminUser();
    const { id } = await ctx.params;
    const body = await request.json();
    const { status } = validateBody(adminPostSchema, body);
    const result = await editPostStatusAdmin(id, status);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
