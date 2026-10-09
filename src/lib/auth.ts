import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { CustomError, UnauthorizedError } from "@/lib/errors";
import type { AuthUserInfo, UserRole } from "@/lib/types";

export const AUTH_COOKIE = "jwt_token";

export const AUTH_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours, in seconds

export type AuthPayload = {
  user_id: string;
  role: UserRole;
};

const secretKey = () => new TextEncoder().encode(config.jwt_secret);

export async function signToken(user_id: string, role: UserRole): Promise<string> {
  return new SignJWT({ user_id, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, secretKey());
  const { user_id, role } = payload as unknown as AuthPayload;
  if (typeof user_id !== "string" || (role !== "USER" && role !== "ADMIN")) {
    throw new UnauthorizedError("Invalid or Expired Token");
  }
  return { user_id, role };
}

export function authCookieOptions(maxAge: number = AUTH_COOKIE_MAX_AGE) {
  const production = config.node_env === "production";
  return {
    httpOnly: true,
    sameSite: production ? ("none" as const) : ("lax" as const),
    secure: production,
    path: "/",
    maxAge,
  };
}

/**
 * Get the currently authenticated user (or null) for Server Components.
 * Wrapped in React `cache()` so multiple calls during one render are deduped.
 */
export const getAuthUser = cache(async (): Promise<AuthUserInfo | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
});

/** Require a valid JWT cookie. Throws UnauthorizedError otherwise. */
export async function requireAuthUser(): Promise<AuthPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    throw new UnauthorizedError();
  }
  try {
    return await verifyToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or Expired Token");
  }
}

/** Require the authenticated user to have the ADMIN role. */
export async function requireAdminUser(): Promise<AuthPayload> {
  const user = await requireAuthUser();
  if (user.role !== "ADMIN") {
    throw new CustomError(403, "INSUFFICIENT_PERMISSIONS", "Insufficient permissions for this action");
  }
  return user;
}
