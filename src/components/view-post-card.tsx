"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import LikeButton from "@/components/like-button";
import type { HomePost } from "@/lib/types";

/**
 * Read-only post detail used in the home feed dialog and the profile dialogs.
 */
function ViewPostCard({ post }: { post: HomePost }) {
  return (
    <Card className="w-full overflow-hidden p-2 md:p-4">
      <CardContent className="flex w-full flex-col items-center justify-center gap-3 pt-2 md:gap-4 md:pt-4">
        <h1 className="w-full text-center text-xl font-bold break-all md:text-4xl">{post.title}</h1>
        <p className="w-full text-center text-base font-semibold break-all text-muted-foreground">
          {post.author.name || "user"} - {post.author.email}
        </p>
        {post.imageUrl && (
          <div className="relative w-full aspect-post-detail max-h-[70vh]">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-contain rounded-xl"
            />
          </div>
        )}
        <p className="w-full text-left text-lg break-all whitespace-pre-line">
          {post.description && post.description}
        </p>
        <LikeButton post={post} />
      </CardContent>
    </Card>
  );
}

export default ViewPostCard;
