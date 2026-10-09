import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostDialog from "@/components/post-dialog";
import PublishedPostCard from "@/components/published-post-card";
import ProfilePostView from "@/components/profile-post-view";
import SearchOptions from "@/components/search-options";
import EmptyState from "@/components/empty-state";
import LogoutButton from "@/components/logout-button";
import { getAuthUser } from "@/lib/auth";
import { searchUserPosts, userPublishedPosts } from "@/lib/services/posts";
import { parseFeedSearchParams } from "@/components/home-content";
import type { PublishedPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Profile",
};

/** /profile — user info, published posts, search and logout (protected). */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const sp = await searchParams;
  const { q, sortBy, order } = parseFeedSearchParams(sp);

  const posts: PublishedPost[] = q.trim()
    ? await searchUserPosts(user.id, { q, sort_by: sortBy, order })
    : await userPublishedPosts(user.id, { sort_by: sortBy, order });

  return (
    <div className="min-h-screen">
      <div className="m-2 flex items-center justify-between gap-4 rounded-lg border-2 p-4">
        <p className="text-center text-2xl font-bold">Welcome, {user.name || "user"}</p>
        <LogoutButton />
      </div>

      <h2 className="font-tech ml-2 mb-2 text-center text-2xl font-semibold">
        Your Published Posts
      </h2>
      <SearchOptions q={q} sortBy={sortBy} order={order} />

      {posts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <PostDialog key={post.id} post={post} trigger={<PublishedPostCard post={post} />}>
              <ProfilePostView post={post} />
            </PostDialog>
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
