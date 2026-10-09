import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/empty-state";
import LikeButton from "@/components/like-button";
import { getSingleHomePost } from "@/lib/services/posts";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getSingleHomePost(id);
  return {
    title: post ? post.title : "Post not found",
  };
}

/** /post/:id — full page for a single published post. */
export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getSingleHomePost(id);

  if (!post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <EmptyState message="No post found" />
        <Link href="/home" className="text-primary underline-offset-4 hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <Card className="m-3 w-full overflow-hidden p-2 md:p-4">
      <CardContent className="flex w-full flex-col items-center justify-center gap-3 pt-2 md:gap-4 md:pt-4">
        <h1 className="font-tech w-full text-center text-xl font-bold wrap-anywhere md:text-4xl">
          {post.title}
        </h1>
        <p className="w-full text-center text-base font-semibold wrap-anywhere text-muted-foreground">
          {post.author.name || "user"} - {post.author.email}
        </p>
        {post.imageUrl && (
          <div className="relative h-[35vh] max-h-[55vh] w-full md:h-[55vh]">
            <Image src={post.imageUrl} alt={post.title} fill sizes="100vw" className="object-contain" />
          </div>
        )}
        <p className="w-full text-left text-lg wrap-anywhere whitespace-pre-line">
          {post.description && post.description}
        </p>
        <LikeButton post={post} />
      </CardContent>
    </Card>
  );
}
