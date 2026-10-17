import { z } from "zod";

export const MAX_TAGS = 5;
export const TAG_REGEX = /^[a-z0-9-]{2,20}$/;

/**
 * Tag list: trimmed, lowercased, de-duplicated, at most MAX_TAGS, each
 * matching TAG_REGEX. Validation failures surface as field-level errors under
 * the `tags` key in the same `{ message, Errors }` shape as the other forms.
 */
export const tagsSchema = z
  .array(z.string())
  .default([])
  .transform((tags) =>
    Array.from(
      new Set(
        tags
          .map((tag) => tag.trim().toLowerCase().replace(/^#+/, ""))
          .filter(Boolean)
      )
    )
  )
  .refine((tags) => tags.length <= MAX_TAGS, {
    message: `You can add at most ${MAX_TAGS} tags`,
  })
  .refine((tags) => tags.every((tag) => TAG_REGEX.test(tag)), {
    message: "Tags must be 2-20 characters using lowercase letters, numbers or hyphens",
  });

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
  tags: tagsSchema,
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title Can't exceed 100 characters").optional(),
  description: z.string().trim().max(10000, "Desc can't exceed 10000 characters").optional(),
  status: z.enum(["DRAFT", "PENDING"]).optional(),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  tags: tagsSchema,
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
