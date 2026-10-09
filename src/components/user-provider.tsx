"use client";

import { createContext, useContext } from "react";
import type { AuthUserInfo } from "@/lib/types";

const UserContext = createContext<AuthUserInfo | null>(null);

/**
 * Provides the server-fetched authenticated user to client components.
 * Re-renders with fresh data after router.refresh() (sign in / sign out).
 */
export function UserProvider({ user, children }: { user: AuthUserInfo | null; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
