import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostDialog from "@/components/post-dialog";
import PostForm from "@/components/post-form";
import CreatePostDialog from "@/components/create-post-dialog";
import DraftedPostCard from "@/components/drafted-post-card";
import EmptyState from "@/components/empty-state";
import SearchInput from "@/components/search-input";
import PaginationControls from "@/components/pagination-controls";
import { parseFeedSearchParams } from "@/components/home-content";
import { getAuthUser } from "@/lib/auth";
import {
  countSearchUserUnPublishedPosts,
  countUserUnPublishedPosts,
  searchUserUnPublishedPosts,
  userUnPublishedPosts,
  POSTS_PER_PAGE,
} from "@/lib/services/posts";

export const metadata: Metadata = {
  title: "My Posts",
};

/** /my-posts — create posts and manage drafts with search (protected). */
export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const sp = await searchParams;
  const { q, page } = parseFeedSearchParams(sp);
  const searching = q.trim().length > 0;

  // Count first so we know how many pages exist, then clamp the requested page.
  const total = searching
    ? await countSearchUserUnPublishedPosts(user.id, q)
    : await countUserUnPublishedPosts(user.id);
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const posts = searching
    ? await searchUserUnPublishedPosts(user.id, { q, page: currentPage })
    : await userUnPublishedPosts(user.id, currentPage);

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <p className="text-lg font-medium text-muted-foreground">Draft a post now</p>
        <CreatePostDialog />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-tech text-center text-3xl font-bold">Drafted Posts</h2>
        <SearchInput initialQ={q} placeholder="Search drafts..." />

        {posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostDialog key={post.id} post={post} trigger={<DraftedPostCard post={post} />}>
                <PostForm post={post} usage="update" />
              </PostDialog>
            ))}
          </ul>
        ) : (
          <EmptyState
            message={
              searching ? "No drafts matched your search." : "No drafts or pending posts found."
            }
          />
        )}

        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} q={q} />
        )}
      </div>
    </div>
  );
}
