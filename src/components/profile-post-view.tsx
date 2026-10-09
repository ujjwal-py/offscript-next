"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { OpenablePost } from "@/lib/types";

/**
 * Read-only card for viewing one of the user's own published posts
 * (ported from the custom ViewPostCard in the original Profile page).
 */
function ProfilePostView({ post }: { post: OpenablePost }) {
  return (
    <Card className="w-full max-w-full overflow-hidden rounded-md border-2 p-2">
      <CardContent className="flex w-full flex-col items-center justify-center gap-6 pt-4">
        <p className="text-3xl font-bold text-center">{post.title}</p>
        {post.imageUrl && (
          <div className="relative w-full aspect-post-detail max-h-[70vh]">
            <Image src={post.imageUrl} alt={post.title} fill sizes="100vw" className="object-contain rounded-xl" />
          </div>
        )}
        <p className="text-base text-muted-foreground whitespace-pre-line text-center">{post.description}</p>
      </CardContent>
    </Card>
  );
}

export default ProfilePostView;
