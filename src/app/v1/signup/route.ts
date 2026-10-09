import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, authCookieOptions } from "@/lib/auth";
import { createUser } from "@/lib/services/users";
import { errorResponse, validateBody } from "@/lib/route-utils";
import { UserSchema } from "@/lib/validation";

/** POST /v1/signup — create a user and set the auth cookie */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = validateBody(UserSchema, body);
    const { user, token } = await createUser(data);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, token, authCookieOptions());

    return NextResponse.json({
      message: "user created",
      user,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
