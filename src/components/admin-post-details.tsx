import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { AdminPost } from "@/lib/types";

/**
 * Read-only detail view of a post, shown in the admin dialog.
 */
function AdminPostDetails({ post }: { post: AdminPost }) {
  return (
    <div className="flex flex-col gap-5 p-2 md:p-6">
      <Badge
        className={
          post.status === "PENDING"
            ? "w-fit bg-orange-500/15 text-orange-600 dark:text-orange-400"
            : "w-fit bg-green-500/15 text-green-600 dark:text-green-400"
        }
      >
        {post.status}
      </Badge>
      <h2 className="text-center text-2xl font-bold md:text-3xl">{post.title}</h2>
      <p className="text-center text-muted-foreground">
        By {post.author.name || post.author.email}
      </p>
      {post.imageUrl && (
        <div className="relative h-[55vh] w-full">
          <Image src={post.imageUrl} alt={post.title} fill sizes="100vw" className="object-contain" />
        </div>
      )}
      <p className="whitespace-pre-line">{post.description || "No description provided."}</p>
    </div>
  );
}

export default AdminPostDetails;
