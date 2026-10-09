import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser } from "@/lib/services/users";
import { errorResponse, validateBody } from "@/lib/route-utils";
import { UserSchema } from "@/lib/validation";
import { config } from "@/lib/config";


/** POST /v1/signup — create a user and set the auth cookie */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = validateBody(UserSchema, body);
    const { user, token } = await createUser(data);

    const cookieStore = await cookies();
    cookieStore.set("jwt_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.node_env === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      message: "user created",
      user,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
