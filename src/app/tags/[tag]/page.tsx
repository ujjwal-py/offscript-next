import type { Metadata } from "next";
import PostDialog from "@/components/post-dialog";
import PostCard from "@/components/post-card";
import ViewPostCard from "@/components/view-post-card";
import EmptyState from "@/components/empty-state";
import PaginationControls from "@/components/pagination-controls";
import { countPostsByTag, getPostsByTag, TAG_PAGE_SIZE } from "@/lib/services/posts";
import type { HomePost } from "@/lib/types";

type Props = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag.trim().toLowerCase()}` };
}

/** /tags/:tag — published posts carrying an exact tag, newest first, 10 per page. */
export default async function TagPage({ params, searchParams }: Props) {
  const { tag } = await params;
  const normalizedTag = tag.trim().toLowerCase();

  const sp = await searchParams;
  const page = Number(sp.page) || 1;

  // Count first (same `where` as the findMany) so we know how many pages exist,
  // then clamp the requested page into that range.
  const total = await countPostsByTag(normalizedTag);
  const totalPages = Math.max(1, Math.ceil(total / TAG_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const posts: HomePost[] = await getPostsByTag(normalizedTag, currentPage);

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <h1 className="font-tech mt-4 text-center text-4xl font-bold break-all">
          #{normalizedTag}
        </h1>

        {posts.length > 0 ? (
          <ul className="mt-4 grid grid-cols-1 gap-4 bg-background md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostDialog key={post.id} post={post} trigger={<PostCard post={post} />}>
                <ViewPostCard post={post} />
              </PostDialog>
            ))}
          </ul>
        ) : (
          <EmptyState message={`No posts tagged #${normalizedTag}.`} />
        )}

        {totalPages > 1 && (
          <PaginationControls currentPage={currentPage} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}
