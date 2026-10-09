"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import type { OpenablePost } from "@/lib/types";

type PostDialogProps = {
  /** The post represented by this dialog (used for the "View in New tab" link) */
  post: OpenablePost;
  /** Element that opens the dialog when clicked */
  trigger: React.ReactNode;
  /** Rendered inside the dialog; may call `usePostDialog().close()` to close it */
  children: React.ReactNode;
};

const PostDialogContext = React.createContext<{ close: () => void } | null>(null);

/**
 * Access the surrounding PostDialog (if any). `close()` closes the dialog —
 * useful for forms rendered inside it.
 */
export function usePostDialog() {
  return React.useContext(PostDialogContext);
}

/**
 * Full-screen post dialog, ported from the original PostDialogue.
 * The header keeps the "View in New tab" link and Close button.
 */
function PostDialog({ post, trigger, children }: PostDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
      <DialogPrimitive.Trigger
        render={<button className="w-full cursor-pointer" data-slot="post-dialog-trigger" />}
      >
        {trigger}
      </DialogPrimitive.Trigger>
      {open && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <DialogPrimitive.Popup className="fixed inset-0 z-50 flex h-dvh w-dvw flex-col overflow-hidden bg-background p-4 outline-none">
            <div className="flex w-full items-center justify-between border-b pb-3">
              <Link
                href={`/post/${post.id}`}
                target="_blank"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View in New tab
              </Link>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6">
              <PostDialogContext.Provider value={{ close: () => setOpen(false) }}>
                {children}
              </PostDialogContext.Provider>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  );
}

export default PostDialog;
