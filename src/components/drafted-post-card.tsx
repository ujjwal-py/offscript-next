import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import PostTagsFooter from "@/components/post-tags-footer";
import type { DraftPost } from "@/lib/types";

function DraftedPostCard({ post }: { post: DraftPost }) {
  const isPending = post.status === "PENDING";

  return (
    <Card className="w-full overflow-hidden card-hover">
      <CardContent className="gap-2 p-4">
        <CardTitle className="text-lg font-semibold truncate">{post.title}</CardTitle>
        <Badge
          className={isPending
            ? "bg-warning/15 text-warning border border-warning/20"
            : "bg-info/15 text-info border border-info/20"
          }
        >
          {post.status}
        </Badge>
      </CardContent>
      <PostTagsFooter tags={post.tags}>
        <p className="text-sm text-muted-foreground">Last updated - {post.updatedAt.slice(0, 10)}</p>
      </PostTagsFooter>
    </Card>
  );
}

export default DraftedPostCard;
