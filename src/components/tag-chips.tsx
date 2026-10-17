"use client";

import Link from "next/link";

type TagChipsProps = {
  tags?: string[] | null;
  /** Render each tag as a link to /tags/[tag]. Defaults to true. */
  link?: boolean;
  className?: string;
};

const chipClass =
  "rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground";

/**
 * A post's tags rendered as chips. Each chip links to /tags/[tag] by default;
 * pass `link={false}` for read-only contexts such as post dialogs.
 */
function TagChips({ tags, link = true, className }: TagChipsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5${className ? ` ${className}` : ""}`}>
      {tags.map((tag) =>
        link ? (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            // The chip lives inside the card's dialog trigger button, so stop
            // the click from bubbling and opening the dialog.
            onClick={(event) => event.stopPropagation()}
            className={`${chipClass} transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary`}
          >
            #{tag}
          </Link>
        ) : (
          <span key={tag} className={chipClass}>
            #{tag}
          </span>
        )
      )}
    </div>
  );
}

export default TagChips;
