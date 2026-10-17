import type { ReactNode } from "react";
import { CardFooter } from "@/components/ui/card";
import TagChips from "@/components/tag-chips";

type PostTagsFooterProps = {
  /** The post's tags (nothing is shown when there are none) */
  tags?: string[] | null;
  /** Optional content shown on the right, e.g. a date */
  children?: ReactNode;
  className?: string;
};

/**
 * Small card footer that shows a post's tags, with optional content (such as a
 * date) aligned to the right. Renders nothing when there is nothing to show.
 */
function PostTagsFooter({ tags, children, className }: PostTagsFooterProps) {
  const hasTags = !!tags && tags.length > 0;
  if (!hasTags && !children) return null;

  return (
    <CardFooter
      className={`flex-wrap items-center justify-between gap-2 px-4 py-2.5${className ? ` ${className}` : ""}`}
    >
      <TagChips tags={tags} />
      {children}
    </CardFooter>
  );
}

export default PostTagsFooter;
