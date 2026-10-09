"use client";

import Link from "next/link";
import { useUser } from "@/components/user-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function Navbar() {
  const user = useUser();

  return (
    <div className="p-2">
      <div className="flex h-auto min-h-[50px] w-full flex-wrap items-center justify-between gap-4 rounded-lg border-2 bg-card px-3 py-2 shadow-md">
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            href="/home"
            className="font-tech text-xl font-bold text-foreground"
          >
            Offscript
          </Link>
          <Link
            href="/home"
            className="text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/my-posts"
            className="text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            Create
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6">
          <ThemeToggle />
          <Link
            href="/profile"
            className="text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            Profile
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
