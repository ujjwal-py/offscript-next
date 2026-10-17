import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostDialog from "@/components/post-dialog";
import PostForm from "@/components/post-form";
import DraftedPostCard from "@/components/drafted-post-card";
import EmptyState from "@/components/empty-state";
import PaginationControls from "@/components/pagination-controls";
import { parseFeedSearchParams } from "@/components/home-content";
import { getAuthUser } from "@/lib/auth";
import { countUserUnPublishedPosts, userUnPublishedPosts, POSTS_PER_PAGE } from "@/lib/services/posts";

export const metadata: Metadata = {
  title: "My Posts",
};

/** /my-posts — create posts and manage drafts (protected). */
export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const sp = await searchParams;
  const { page } = parseFeedSearchParams(sp);

  // Count first so we know how many pages exist, then clamp the requested page.
  const total = await countUserUnPublishedPosts(user.id);
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const posts = await userUnPublishedPosts(user.id, currentPage);

  return (
    <div className="flex flex-col gap-6 p-2">
      <PostForm usage="create" />

      <div>
        <h2 className="font-tech mb-2 text-center text-3xl font-bold">Drafted Posts</h2>
        {posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostDialog key={post.id} post={post} trigger={<DraftedPostCard post={post} />}>
                <PostForm post={post} usage="update" />
              </PostDialog>
            ))}
          </ul>
        ) : (
          <EmptyState message="No drafts or pending posts found." />
        )}

        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}
