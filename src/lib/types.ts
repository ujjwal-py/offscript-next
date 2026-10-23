export type PostStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

export type AdminStatus = Extract<PostStatus, "PUBLISHED" | "REJECTED">;

export type UserRole = "USER" | "ADMIN";

export interface Likes {
  userId: string;
  postId: string;
}

export interface Author {
  username: string;
  email: string;
}

export interface AdminAuthor {
  id: string;
  username: string;
  email: string;
}

/** The authenticated user as returned by /v1/me and used across the client */
export type AuthUserInfo = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO string
};

export interface BasePost {
  id: string;
  title: string;
  description: string;
  updatedAt: string; // ISO string
  imageUrl?: string | null;
  status: PostStatus;
  tags: string[];
}

export interface HomePost extends BasePost {
  author: Author;
  Likes: Likes[];
}

export type DraftPost = BasePost;

export interface PublishedPost extends BasePost {
  Likes: Likes[];
}

export type AdminPost = HomePost & {
  author: AdminAuthor;
};

export type OpenablePost = HomePost | DraftPost | PublishedPost;

export type SortTypes = "updatedAt" | "likes";
export type OrderTypes = "asc" | "desc";
