"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useLikeStore } from "@/store/like-store";
import { useUser } from "@/components/user-provider";
import type { HomePost } from "@/lib/types";

function LikeButton({ post }: { post: HomePost }) {
  const user = useUser();
  const likes = useLikeStore((state) => state.likesByPost[post.id] ?? post.Likes);
  const setLikes = useLikeStore((state) => state.setLikes);
  const addLike = useLikeStore((state) => state.addLike);
  const removeLike = useLikeStore((state) => state.removeLike);
  const [pending, setPending] = useState(false);
  const like = Boolean(user && likes.some((item) => item.userId === user.id));

  useEffect(() => {
    setLikes(post.id, post.Likes);
  }, [post.id, post.Likes, setLikes]);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    if (pending) return;

    setPending(true);
    try {
      if (!like) {
        await apiFetch(`/posts/${post.id}/like`, { method: "POST" });
        addLike({ postId: post.id, userId: user.id });
      } else {
        await apiFetch(`/posts/${post.id}/dislike`, { method: "DELETE" });
        removeLike({ postId: post.id, userId: user.id });
      }
      toast.success(`Post ${like === true ? "Unliked" : "Liked"}`);
    } catch {
      // The api client already displayed the error toast.
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <p className="text-base font-semibold">{like ? "Unlike" : "Like"}</p>
      <Button
        variant="outline"
        size="icon"
        aria-label={like ? "Unlike post" : "Like post"}
        className="text-red-500 hover:bg-muted"
        onClick={handleLike}
        disabled={pending}
      >
        <HeartIcon className={like ? "fill-red-500 text-red-500" : ""} />
      </Button>
    </div>
  );
}

export default LikeButton;
