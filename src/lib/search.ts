import { Prisma } from "@/generated/prisma/client";

/**
 * Build the Prisma `where` clause for a post search query.
 *
 * - The query is split on whitespace.
 * - Words starting with `#` are tags and must ALL match (`hasEvery`).
 * - Every remaining word must match the title OR the description OR an exact
 *   tag (case-insensitive `contains` / `has`).
 *
 * The same clause is used for both `findMany` and `count` so the page count
 * always matches the listed posts.
 */
export function buildPostWhere(query: string): Prisma.PostsWhereInput {
  const words = String(query ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const tagWords = words
    .filter((word) => word.startsWith("#"))
    .map((word) => word.slice(1).trim().toLowerCase())
    .filter(Boolean);

  const textWords = words.filter((word) => !word.startsWith("#"));

  const filters: Prisma.PostsWhereInput[] = [];

  if (tagWords.length > 0) {
    filters.push({ tags: { hasEvery: tagWords } });
  }

  for (const word of textWords) {
    filters.push({
      OR: [
        { title: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
        { tags: { has: word.toLowerCase() } },
      ],
    });
  }

  return filters.length > 0 ? { AND: filters } : {};
}
