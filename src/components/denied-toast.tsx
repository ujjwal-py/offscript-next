"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Renders nothing; shows the "not enough rights" toast once when an admin
 * guard redirects a non-admin user back to the home feed.
 */
export function DeniedToast() {
  useEffect(() => {
    toast.error("You don't have enough rights", {
      description: "FORBIDDEN_CONTENT",
    });
  }, []);

  return null;
}
