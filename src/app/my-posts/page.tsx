import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostDialog from "@/components/post-dialog";
import PostForm from "@/components/post-form";
import DraftedPostCard from "@/components/drafted-post-card";
import EmptyState from "@/components/empty-state";
import { getAuthUser } from "@/lib/auth";
import { userUnPublishedPosts } from "@/lib/services/posts";

export const metadata: Metadata = {
  title: "My Posts",
};

/** /my-posts — create posts and manage drafts (protected). */
export default async function MyPostsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth");

  const posts = await userUnPublishedPosts(user.id);

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
      </div>
    </div>
  );
}
