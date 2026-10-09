"use client";

import Image from "next/image";
import { HeartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { PublishedPost } from "@/lib/types";

function PublishedPostCard({ post }: { post: PublishedPost }) {
  return (
    <Card className="w-full overflow-hidden card-hover">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {post.imageUrl && (
            <div className="relative aspect-post-thumb w-24 h-24 shrink-0 rounded-lg overflow-hidden">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold line-clamp-2 leading-snug mb-2">{post.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-success/15 text-success border border-success/20 shrink-0">
                {post.status}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground shrink-0">
                <HeartIcon className="size-4 fill-red-500 text-red-500" />
                <span>{post.Likes?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-1 p-4 pt-0 border-t border-border/50">
        <p className="text-sm text-muted-foreground">Last updated - {post.updatedAt.slice(0, 10)}</p>
      </CardFooter>
    </Card>
  );
}

export default PublishedPostCard;
