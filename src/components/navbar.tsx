"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { useUser } from "@/components/user-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const linkClass =
  "text-xl font-semibold text-foreground/80 transition-colors hover:text-foreground";

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
          <div className="hidden items-center gap-4 md:flex md:gap-8">
            <Link href="/home" className={linkClass}>
              Home
            </Link>
            {user && <Link href="/my-posts" className={linkClass}>Create</Link>}
          </div>
        </div>

        <div className="hidden items-center justify-center gap-6 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/profile" className={linkClass}>Profile</Link>
              {user.role === "ADMIN" && <Link href="/admin" className={linkClass}>Admin</Link>}
            </>
          ) : (
            <Link href="/auth" className={linkClass}>Sign in</Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Dialog>
            <DialogTrigger
              render={<Button variant="ghost" size="icon" aria-label="Open navigation menu" />}
            >
              <MenuIcon />
            </DialogTrigger>
            <DialogContent
              showCloseButton
              className="inset-y-0 left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none rounded-r-xl p-6"
            >
              <DialogHeader>
                <DialogTitle className="font-tech text-xl">Offscript</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col gap-4">
                <DialogClose nativeButton={false} render={<Link href="/home" className={linkClass} />}>
                  Home
                </DialogClose>
                {user ? (
                  <>
                    <DialogClose nativeButton={false} render={<Link href="/my-posts" className={linkClass} />}>
                      Create
                    </DialogClose>
                    <DialogClose nativeButton={false} render={<Link href="/profile" className={linkClass} />}>
                      Profile
                    </DialogClose>
                    {user.role === "ADMIN" && (
                      <DialogClose nativeButton={false} render={<Link href="/admin" className={linkClass} />}>
                        Admin
                      </DialogClose>
                    )}
                  </>
                ) : (
                  <DialogClose nativeButton={false} render={<Link href="/auth" className={linkClass} />}>
                    Sign in
                  </DialogClose>
                )}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
