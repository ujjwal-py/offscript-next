"use client";

import { PlusIcon } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { FullScreenDialog } from "@/components/post-dialog";
import PostForm from "@/components/post-form";

/**
 * "Create New Post" button that opens the create form in a full-screen dialog.
 * The submitted form calls `usePostDialog().close()` to dismiss itself.
 */
function CreatePostDialog() {
  return (
    <FullScreenDialog
      trigger={
        <>
          <PlusIcon data-icon="inline-start" className="size-5" />
          Create New Post
        </>
      }
      triggerClassName={cn(buttonVariants({ size: "lg" }), "h-11 cursor-pointer gap-2 px-6 text-base")}
      headerLeft={<p className="text-sm font-medium">Create New Post</p>}
    >
      <PostForm usage="create" />
    </FullScreenDialog>
  );
}

export default CreatePostDialog;
