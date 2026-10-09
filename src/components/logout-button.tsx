"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

/**
 * Logout button for the profile header. Calls POST /v1/logout and refreshes;
 * the profile page's server-side auth check then redirects to /auth.
 */
function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleLogout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // The api client already displayed the error toast.
    } finally {
      setPending(false);
      router.refresh();
    }
  };

  return (
    <Button
      variant="outline"
      className="bg-red-600 text-white hover:bg-red-600/80 dark:bg-red-600"
      onClick={handleLogout}
      disabled={pending}
    >
      <LogOutIcon data-icon="inline-start" /> Logout
    </Button>
  );
}

export default LogoutButton;
