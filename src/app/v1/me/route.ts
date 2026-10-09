import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { getMeUser } from "@/lib/services/users";
import { errorResponse } from "@/lib/route-utils";

/** GET /v1/me — current authenticated user */
export async function GET() {
  try {
    const authUser = await requireAuthUser();
    const user = await getMeUser(authUser.user_id);
    return NextResponse.json(user);
  } catch (err) {
    return errorResponse(err);
  }
}
