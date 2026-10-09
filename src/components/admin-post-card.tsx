"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import type { AdminPost, AdminStatus } from "@/lib/types";

type AdminPostCardProps = {
  post: AdminPost;
  pending?: boolean;
};

/**
 * Admin moderation card. Approve / Reject buttons appear for pending posts and
 * a Remove button for published ones. Clicks are stopped from bubbling so the
 * surrounding full-screen dialog does not open.
 */
function AdminPostCard({ post, pending = false }: AdminPostCardProps) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  const changeStatus = async (status: AdminStatus) => {
    if (changing) return;
    setChanging(true);
    try {
      await apiFetch(`/admin/posts/${post.id}/status`, {
        method: "PUT",
        body: { status },
      });
      toast.success(`Post ${status.toLowerCase()}`);
      router.refresh();
    } catch {
      // The api client already displayed the error toast.
    } finally {
      setChanging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-warning/15 text-warning border border-warning/20";
      case "PUBLISHED":
        return "bg-success/15 text-success border border-success/20";
      case "REJECTED":
        return "bg-destructive/15 text-destructive border border-destructive/20";
      case "REMOVED":
        return "bg-muted text-muted-foreground border border-border";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  return (
    <Card className="w-full overflow-hidden card-hover">
      <CardContent className="gap-2 p-4">
        <p className="text-lg font-semibold truncate">{post.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">By {post.author.name || post.author.email}</p>
          <Badge className={getStatusBadge(post.status)}>{post.status}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2 p-4 pt-0 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {post.updatedAt.slice(0, 10)}
        </p>
        <div
          className="flex gap-2"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {pending ? (
            <>
              <Button
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90 focus-ring"
                disabled={changing}
                onClick={() => changeStatus("PUBLISHED")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 focus-ring"
                disabled={changing}
                onClick={() => changeStatus("REJECTED")}
              >
                Reject
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 focus-ring"
              disabled={changing}
              onClick={() => changeStatus("REMOVED")}
            >
              Remove
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default AdminPostCard;
