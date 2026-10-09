import { create } from "zustand";
import type { Likes } from "@/lib/types";

interface LikeState {
  likesByPost: Record<number, Likes[]>;
  setLikes: (postId: number, likes: Likes[]) => void;
  addLike: (like: Likes) => void;
  removeLike: (like: Likes) => void;
}

/**
 * Zustand store for optimistic like updates, ported from the original client.
 * Cards seed it from the server data and the LikeButton updates it instantly.
 */
export const useLikeStore = create<LikeState>((set) => ({
  likesByPost: {},
  setLikes: (postId, likes) =>
    set((state) => ({
      likesByPost: state.likesByPost[postId]
        ? state.likesByPost
        : { ...state.likesByPost, [postId]: likes },
    })),
  addLike: (like) =>
    set((state) => {
      const currentLikes = state.likesByPost[like.postId] ?? [];
      const alreadyLiked = currentLikes.some(
        (item) => item.userId === like.userId && item.postId === like.postId
      );

      if (alreadyLiked) return state;

      return {
        likesByPost: {
          ...state.likesByPost,
          [like.postId]: [...currentLikes, like],
        },
      };
    }),
  removeLike: (like) =>
    set((state) => ({
      likesByPost: {
        ...state.likesByPost,
        [like.postId]: (state.likesByPost[like.postId] ?? []).filter(
          (item) => !(item.userId === like.userId && item.postId === like.postId)
        ),
      },
    })),
}));
