export type PostStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "REMOVED";

export type AdminStatus = Extract<PostStatus, "PUBLISHED" | "REJECTED" | "REMOVED">;

export type UserRole = "USER" | "ADMIN";

export interface Likes {
  userId: string;
  postId: number;
}

export interface Author {
  name?: string | null;
  email: string;
}

export interface AdminAuthor {
  id?: string;
  name?: string | null;
  email: string;
}

/** The authenticated user as returned by /v1/me and used across the client */
export type AuthUserInfo = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: string; // ISO string
};

export interface BasePost {
  id: number;
  title: string;
  description?: string | null;
  updatedAt: string; // ISO string
  imageUrl?: string | null;
  status: PostStatus;
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
