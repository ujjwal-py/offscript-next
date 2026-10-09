import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().trim().toLowerCase().optional(),
  email: z.string().trim().toLowerCase().email("Invalid Email address"),
  password: z.string().trim().min(8, "Password should be minimum of 8 characters"),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title Can't exceed 100 characters"),
  description: z.string().trim().max(10000, "Desc can't exceed 10000 characters").optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  status: z.enum(["DRAFT", "PENDING"]),
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title Can't exceed 100 characters").optional(),
  description: z.string().trim().max(10000, "Desc can't exceed 10000 characters").optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
});

export const adminPostSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED", "REMOVED"]),
});

export const likesSchema = z.object({
  postId: z.number().int().positive("Post ID must be a positive integer"),
});

export type UserBody = z.infer<typeof UserSchema>;
export type NewPostBody = z.infer<typeof createPostSchema>;
export type UpdatePostBody = z.infer<typeof updatePostSchema>;
export type AdminPostBody = z.infer<typeof adminPostSchema>;
export type LikesBody = z.infer<typeof likesSchema>;
