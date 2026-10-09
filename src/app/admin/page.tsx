import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostDialog from "@/components/post-dialog";
import AdminPostCard from "@/components/admin-post-card";
import AdminPostDetails from "@/components/admin-post-details";
import SearchInput from "@/components/search-input";
import { getAuthUser } from "@/lib/auth";
import { getPendingPostsAdmin, searchPublicPosts } from "@/lib/services/posts";
import { parseFeedSearchParams } from "@/components/home-content";
import type { AdminPost, HomePost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

/** /admin — moderation dashboard (protected, ADMIN role only). */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");
  if (user.role !== "ADMIN") redirect("/home?denied=1");

  const sp = await searchParams;
  const { q, sortBy, order } = parseFeedSearchParams(sp);

  const pendingPosts: AdminPost[] = await getPendingPostsAdmin();
  const publishedPosts: HomePost[] = q.trim()
    ? await searchPublicPosts({ q, sort_by: sortBy, order })
    : [];

  return (
    <div className="flex min-h-screen flex-col gap-8 p-4 md:p-8">
      <h1 className="font-tech text-3xl font-bold">Admin Dashboard</h1>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Pending posts</h2>
        {pendingPosts.length === 0 ? (
          <p className="text-muted-foreground">There are no pending posts.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingPosts.map((post) => (
              <PostDialog key={post.id} post={post} trigger={<AdminPostCard post={post} pending />}>
                <AdminPostDetails post={post} />
              </PostDialog>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Search published posts</h2>
        <SearchInput initialQ={q} />
        {!q.trim() ? (
          <p className="mt-4 text-muted-foreground">
            Search by title to manage published posts.
          </p>
        ) : publishedPosts.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            No published posts matched your search.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publishedPosts.map((post) => (
              <PostDialog
                key={post.id}
                post={post}
                trigger={<AdminPostCard post={post as unknown as AdminPost} />}
              >
                <AdminPostDetails post={post as unknown as AdminPost} />
              </PostDialog>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
