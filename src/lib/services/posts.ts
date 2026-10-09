import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { CustomError, NotFoundError } from "@/lib/errors";
import { deletePostImage, uploadPostImage } from "@/lib/supabase";
import type { PostImageFile } from "@/lib/route-utils";
import type { NewPostBody, UpdatePostBody } from "@/lib/validation";
import type { AdminPost, AdminStatus, DraftPost, HomePost, OrderTypes, PublishedPost, SortTypes } from "@/lib/types";

type PostOrderBy = Prisma.PostsOrderByWithRelationInput;

const likesOrderBy = (order: OrderTypes): PostOrderBy => ({ Likes: { _count: order } });
const dateOrderBy = (order: OrderTypes): PostOrderBy => ({ updatedAt: order });

const parseOrderId = (id: string): number => {
  const parsed = parseInt(id, 10);
  if (!Number.isInteger(parsed)) {
    throw new CustomError(400, "INVALID_POST_ID", "Post id must be an integer");
  }
  return parsed;
};

/** POST /v1/post — create a post (optionally with an uploaded image). */
export async function createPost(
  authorId: string,
  body: NewPostBody,
  image: PostImageFile | null
): Promise<DraftPost> {
  const { title, description, status } = body;

  const uploadedImage = image ? await uploadPostImage(image) : null;
  try {
    const newPost = await prisma.posts.create({
      data: {
        title,
        description,
        authorId,
        imageUrl: uploadedImage?.publicUrl ?? null,
        status,
      },
    });
    revalidateTag("posts", { expire: 0 });
    revalidateTag("user-posts", { expire: 0 });
    return {
      ...newPost,
      updatedAt: newPost.updatedAt.toISOString(),
    };
  } catch (error) {
    if (uploadedImage) {
      await deletePostImage(uploadedImage.publicUrl).catch(() => undefined);
    }
    throw error;
  }
}

/** PUT /v1/posts/:id — edit a post owned by the current user. */
export async function editPost(
  authorId: string,
  id: string,
  body: UpdatePostBody,
  image: PostImageFile | null
): Promise<DraftPost> {
  const postId = parseOrderId(id);
  const { title, description, status } = body;

  const existingPost = await prisma.posts.findUnique({
    where: { id: postId, authorId },
    select: { imageUrl: true },
  });
  if (!existingPost) {
    throw new NotFoundError("Post not found or it does not belong to the user");
  }

  const uploadedImage = image ? await uploadPostImage(image) : null;

  try {
    const post = await prisma.posts.update({
      where: { id: postId, authorId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(uploadedImage && { imageUrl: uploadedImage.publicUrl }),
        ...(status !== undefined && { status }),
      },
    });

    if (uploadedImage && existingPost.imageUrl) {
      await deletePostImage(existingPost.imageUrl).catch(() => undefined);
    }

    revalidateTag("posts", { expire: 0 });
    revalidateTag("user-posts", { expire: 0 });
    return {
      ...post,
      updatedAt: post.updatedAt.toISOString(),
    };
  } catch (error) {
    if (uploadedImage) {
      await deletePostImage(uploadedImage.publicUrl).catch(() => undefined);
    }
    throw error;
  }
}

/** GET /v1/posts — paginated published feed (9 per page). */
export const getAllPosts = unstable_cache<
  (options: { page: number; order: OrderTypes; sort_by: SortTypes }) => Promise<HomePost[]>
>(
  async (options: {
    page: number;
    order: OrderTypes;
    sort_by: SortTypes;
  }): Promise<HomePost[]> => {
    const page = options.page || 1;
    const limit = 9;
    const offset = (page - 1) * limit;
    const orderBy = options.sort_by === "updatedAt" ? dateOrderBy(options.order) : likesOrderBy(options.order);

    const posts = await prisma.posts.findMany({
      where: {
        status: "PUBLISHED",
      },
      skip: offset,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        imageUrl: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        Likes: {
          select: {
            userId: true,
            postId: true,
          },
        },
        updatedAt: true,
      },
    });

    return posts.map((post) => ({ ...post, updatedAt: post.updatedAt.toISOString() }));
  },
  ["posts-feed"],
  { revalidate: 60, tags: ["posts"] }
);

/** GET /v1/posts/:id — one published post (or null). */
export const getSingleHomePost = unstable_cache<
  (id: string) => Promise<HomePost | null>
>(
  async (id: string): Promise<HomePost | null> => {
    const postId = Number(id);
    if (!Number.isInteger(postId)) return null;

    const post = await prisma.posts.findUnique({
      where: {
        id: postId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        imageUrl: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        Likes: {
          select: {
            userId: true,
            postId: true,
          },
        },
        updatedAt: true,
      },
    });

    if (!post) return null;
    return { ...post, updatedAt: post.updatedAt.toISOString() };
  },
  ["post-single"],
  { revalidate: 60, tags: ["posts"] }
);

/** GET /v1/search/posts — case-insensitive title search over published posts. */
export const searchPublicPosts = unstable_cache<
  (options: { q: string; order: OrderTypes; sort_by: SortTypes }) => Promise<HomePost[]>
>(
  async (options: {
    q: string;
    order: OrderTypes;
    sort_by: SortTypes;
  }): Promise<HomePost[]> => {
    const q = String(options.q || "").trim();
    if (!q) {
      throw new CustomError(400, "SEARCH_QUERY_REQUIRED", "Search query is required");
    }
    const orderBy = options.sort_by === "likes" ? likesOrderBy(options.order) : dateOrderBy(options.order);

    const posts = await prisma.posts.findMany({
      where: {
        title: {
          contains: q,
          mode: "insensitive",
        },
        status: "PUBLISHED",
      },
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
        imageUrl: true,
        Likes: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return posts.map((post) => ({
      ...post,
      updatedAt: post.updatedAt.toISOString(),
      Likes: post.Likes.map((like) => ({ userId: like.userId, postId: like.postId })),
    }));
  },
  ["posts-search"],
  { revalidate: 60, tags: ["posts"] }
);

/** GET /v1/user/posts/unpublished — current user's DRAFT/PENDING/REJECTED posts. */
export const userUnPublishedPosts = unstable_cache<
  (authorId: string) => Promise<DraftPost[]>
>(
  async (authorId: string): Promise<DraftPost[]> => {
    const posts = await prisma.posts.findMany({
      where: {
        authorId: authorId,
        status: {
          in: ["DRAFT", "PENDING", "REJECTED"],
        },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        status: true,
        Likes: {
          select: {
            userId: true,
            postId: true,
          },
        },
        imageUrl: true,
      },
    });

    return posts.map((post) => ({ ...post, updatedAt: post.updatedAt.toISOString() }));
  },
  ["user-drafts"],
  { revalidate: 30, tags: ["user-posts"] }
);

/** GET /v1/user/posts/published — current user's published posts. */
export const userPublishedPosts = unstable_cache<
  (authorId: string, options: { order: OrderTypes; sort_by: SortTypes }) => Promise<PublishedPost[]>
>(
  async (
    authorId: string,
    options: { order: OrderTypes; sort_by: SortTypes }
  ): Promise<PublishedPost[]> => {
    const orderBy = options.sort_by === "updatedAt" ? dateOrderBy(options.order) : likesOrderBy(options.order);

    const posts = await prisma.posts.findMany({
      where: {
        authorId: authorId,
        status: "PUBLISHED",
      },
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
        imageUrl: true,
        Likes: true,
      },
    });

    return posts.map((post) => ({
      ...post,
      updatedAt: post.updatedAt.toISOString(),
      Likes: post.Likes.map((like) => ({ userId: like.userId, postId: like.postId })),
    }));
  },
  ["user-published"],
  { revalidate: 60, tags: ["user-posts", "posts"] }
);

/** GET /v1/user/search/posts — title search within the user's published posts. */
export const searchUserPosts = unstable_cache<
  (authorId: string, options: { q: string; order: OrderTypes; sort_by: SortTypes }) => Promise<PublishedPost[]>
>(
  async (
    authorId: string,
    options: { q: string; order: OrderTypes; sort_by: SortTypes }
  ): Promise<PublishedPost[]> => {
    const q = String(options.q || "").trim();
    if (!q) {
      throw new CustomError(400, "SEARCH_QUERY_REQUIRED", "Search query is required");
    }
    const orderBy = options.sort_by === "updatedAt" ? dateOrderBy(options.order) : likesOrderBy(options.order);

    const posts = await prisma.posts.findMany({
      where: {
        authorId: authorId,
        title: {
          contains: q,
          mode: "insensitive",
        },
        status: "PUBLISHED",
      },
      orderBy,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
        imageUrl: true,
        Likes: true,
      },
    });

    return posts.map((post) => ({
      ...post,
      updatedAt: post.updatedAt.toISOString(),
      Likes: post.Likes.map((like) => ({ userId: like.userId, postId: like.postId })),
    }));
  },
  ["user-search"],
  { revalidate: 60, tags: ["user-posts", "posts"] }
);

/** DELETE /v1/admin/posts/:id — admin deletes any post (likes first). */
export async function deletePostAdmin(id: string): Promise<{ message: string }> {
  const postId = parseOrderId(id);

  const existingPost = await prisma.posts.findUnique({
    where: {
      id: postId,
    },
  });
  if (!existingPost) {
    throw new NotFoundError("Post not found");
  }

  await prisma.likes.deleteMany({
    where: {
      postId: postId,
    },
  });

  await prisma.posts.delete({
    where: {
      id: postId,
    },
  });

  revalidateTag("posts", { expire: 0 });
  revalidateTag("user-posts", { expire: 0 });
  revalidateTag("admin-posts", { expire: 0 });
  return { message: "Post deleted successfully" };
}

/** DELETE /v1/post/:id — user deletes their own post. */
export async function deletePostUser(authorId: string, id: string): Promise<{ message: string }> {
  const postId = parseOrderId(id);

  const existingPost = await prisma.posts.findUnique({
    where: {
      id: postId,
      authorId,
    },
  });
  if (!existingPost) {
    throw new NotFoundError("Post not found or it does not belong to the user");
  }

  await prisma.likes.deleteMany({
    where: {
      postId: postId,
    },
  });

  await prisma.posts.delete({
    where: {
      id: postId,
      authorId,
    },
  });

  revalidateTag("posts", { expire: 0 });
  revalidateTag("user-posts", { expire: 0 });
  return { message: "Post deleted successfully" };
}

/** POST /v1/posts/:id/like — like a published post once. */
export async function likePost(userId: string, id: string): Promise<{ message: string }> {
  const postId = parseOrderId(id);

  const validPost = await prisma.posts.findUnique({
    where: {
      id: postId,
      status: "PUBLISHED",
    },
  });
  if (!validPost) {
    throw new NotFoundError("Post not found or not published");
  }
  const existingLike = await prisma.likes.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
  if (existingLike) {
    throw new CustomError(400, "ALREADY_LIKED", "You have already liked this post");
  }
  await prisma.likes.create({
    data: {
      postId,
      userId,
    },
  });
  revalidateTag("posts", { expire: 0 });
  revalidateTag("user-posts", { expire: 0 });
  return { message: "Post liked successfully" };
}

/** DELETE /v1/posts/:id/dislike — remove the current user's like. */
export async function dislikePost(userId: string, id: string): Promise<{ message: string }> {
  const postId = parseOrderId(id);

  const validPost = await prisma.posts.findUnique({
    where: {
      id: postId,
      status: "PUBLISHED",
    },
  });
  if (!validPost) {
    throw new NotFoundError("Post not found or not published");
  }
  const existingLike = await prisma.likes.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
  if (!existingLike) {
    throw new CustomError(400, "NOT_LIKED", "You have not liked this post yet");
  }
  await prisma.likes.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
  revalidateTag("posts", { expire: 0 });
  revalidateTag("user-posts", { expire: 0 });
  return { message: "Post disliked successfully" };
}

/** PUT /v1/admin/posts/:id/status — approve / reject / remove a post. */
export async function editPostStatusAdmin(id: string, status: AdminStatus): Promise<{ message: string }> {
  const postId = parseOrderId(id);

  if (!["PUBLISHED", "REJECTED", "REMOVED"].includes(status)) {
    throw new CustomError(400, "INVALID_STATUS", "Invalid admin post status");
  }

  await prisma.posts.update({
    where: {
      id: postId,
    },
    data: {
      status,
    },
  });

  revalidateTag("posts", { expire: 0 });
  revalidateTag("user-posts", { expire: 0 });
  revalidateTag("admin-posts", { expire: 0 });
  return { message: "Post status updated successfully" };
}

/** GET /v1/admin/posts/pending — all posts awaiting moderation. */
export const getPendingPostsAdmin = unstable_cache<
  () => Promise<AdminPost[]>
>(
  async (): Promise<AdminPost[]> => {
    const pendingPosts = await prisma.posts.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        updatedAt: true,
        imageUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Likes: {
          select: {
            userId: true,
            postId: true,
          },
        },
      },
    });

    return pendingPosts.map((post) => ({ ...post, updatedAt: post.updatedAt.toISOString() }));
  },
  ["admin-pending"],
  { revalidate: 30, tags: ["admin-posts", "posts"] }
);
