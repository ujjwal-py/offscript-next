import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuthUser } from "@/lib/auth";
import { errorResponse } from "@/lib/route-utils";

/** POST /v1/logout — clear the auth cookie */
export async function POST() {
  try {
    await requireAuthUser();
    const cookieStore = await cookies();
    cookieStore.delete({ name: "jwt_token", path: "/" });
    return NextResponse.json({ message: "Logged out" });
  } catch (err) {
    return errorResponse(err);
  }
}
