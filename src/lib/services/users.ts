import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CustomError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import { signToken } from "@/lib/auth";
import type { AuthUserInfo } from "@/lib/types";
import type { UserBody as UserBodyInput } from "@/lib/validation";

/**
 * Creates a new user (signup). Throws 409 UE409 if the email already exists.
 * Returns the public user shape plus a signed JWT for the auth cookie.
 */
export async function createUser(body: UserBodyInput): Promise<{ user: AuthUserInfo; token: string }> {
  const { name, email, password } = body;

  const isExist = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (isExist) {
    throw new CustomError(409, "UE409", "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const token = await signToken(newUser.id, newUser.role);
  return {
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt.toISOString(),
      role: newUser.role,
    },
  };
}

/**
 * Signs a user in. Throws 404/401 "Invalid Email or Password" on failure.
 */
export async function logIn(body: UserBodyInput): Promise<{ user: AuthUserInfo; token: string }> {
  const { email, password } = body;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new NotFoundError("Invalid Email or Password");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new UnauthorizedError("Invalid Email or Password");
  }

  const token = await signToken(user.id, user.role);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      role: user.role,
    },
  };
}

/**
 * Returns the public shape of the user for GET /v1/me.
 * Throws UnauthorizedError when the user no longer exists.
 */
export async function getMeUser(id: string | undefined): Promise<AuthUserInfo> {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
    },
  });
  if (!user) {
    throw new UnauthorizedError();
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    role: user.role,
  };
}
