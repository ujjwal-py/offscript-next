"use client";

import Image from "next/image";
import { useEffect } from "react";
import { HeartIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { useLikeStore } from "@/store/like-store";
import type { OpenablePost } from "@/lib/types";

function PostCard({ post }: { post: OpenablePost }) {
  const homePost = "author" in post && "Likes" in post ? post : null;
  const likes = useLikeStore((state) => state.likesByPost[post.id] ?? homePost?.Likes ?? []);
  const setLikes = useLikeStore((state) => state.setLikes);

  useEffect(() => {
    if (homePost) {
      setLikes(post.id, homePost.Likes);
    }
  }, [post.id, homePost, setLikes]);

  if (!homePost) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden card-hover">
      {post.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover rounded-t-xl"
          />
        </div>
      )}
      <CardContent className="gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold line-clamp-2 leading-snug text-left">{post.title}</CardTitle>
          <span className="flex items-center gap-1 text-sm font-semibold shrink-0 text-red-500">
            <HeartIcon className="size-4" /> {likes.length}
          </span>
        </div>
        <p className="line-clamp-3 text-sm text-left leading-relaxed text-muted-foreground">{post.description}</p>
      </CardContent>
      <CardFooter className="gap-1 p-4 pt-0 border-t border-border/50">
        <p className="text-sm text-muted-foreground">Posted on: {post.updatedAt.slice(0, 10)}</p>
      </CardFooter>
    </Card>
  );
}

export default PostCard;
