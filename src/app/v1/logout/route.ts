import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuthUser, AUTH_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/route-utils";

/** POST /v1/logout — clear the auth cookie */
export async function POST() {
  try {
    await requireAuthUser();
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
    return NextResponse.json({ message: "Logged out" });
  } catch (err) {
    return errorResponse(err);
  }
}
