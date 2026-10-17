import PostDialog from "@/components/post-dialog";
import PostCard from "@/components/post-card";
import ViewPostCard from "@/components/view-post-card";
import SearchOptions from "@/components/search-options";
import EmptyState from "@/components/empty-state";
import PaginationControls from "@/components/pagination-controls";
import { DeniedToast } from "@/components/denied-toast";
import { countPublishedPosts, countSearchPublicPosts, getAllPosts, searchPublicPosts, POSTS_PER_PAGE } from "@/lib/services/posts";
import type { HomePost, OrderTypes, SortTypes } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

/** Reads the home feed options from the URL search params. */
export function parseFeedSearchParams(searchParams: SearchParams) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const page = Number(searchParams.page) || 1;
  const sortBy: SortTypes = searchParams.sort_by === "updatedAt" ? "updatedAt" : "likes";
  const order: OrderTypes = searchParams.order === "asc" ? "asc" : "desc";
  return { q, page, sortBy, order };
}

/**
 * Home feed, ported from the original Home page. The feed options live in the
 * URL search params, so search, sort and pagination all render on the server.
 */
export default async function HomeContent({ searchParams }: { searchParams: SearchParams }) {
  const { q, page, sortBy, order } = parseFeedSearchParams(searchParams);
  const denied = searchParams.denied === "1";
  const searching = q.trim().length > 0;

  // Count the matching posts first so we know how many pages exist, then
  // clamp the requested page into that range.
  const total = searching ? await countSearchPublicPosts(q) : await countPublishedPosts();
  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const posts: HomePost[] = searching
    ? await searchPublicPosts({ q, sort_by: sortBy, order, page: currentPage })
    : await getAllPosts({ page: currentPage, sort_by: sortBy, order });

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 md:px-8">
      {denied && <DeniedToast />}
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <h1 className="font-tech mt-4 text-center text-4xl font-bold">Home Feed</h1>
        <SearchOptions q={q} sortBy={sortBy} order={order} />

        {posts.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 bg-background md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostDialog
                key={post.id}
                post={post}
                trigger={<PostCard post={post} />}
              >
                <ViewPostCard post={post} />
              </PostDialog>
            ))}
          </ul>
        ) : (
          <EmptyState />
        )}

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            q={q}
            sortBy={sortBy}
            order={order}
          />
        )}
      </div>
    </div>
  );
}
