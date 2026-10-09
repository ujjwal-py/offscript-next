"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePostDialog } from "@/components/post-dialog";
import { apiFetch } from "@/lib/api";
import type { DraftPost } from "@/lib/types";

type PostFormProps = {
  /** Post to edit (update mode); omitted when creating */
  post?: DraftPost;
  usage: "create" | "update";
};

const initialData: DraftPost = {
  id: -1,
  title: "",
  updatedAt: "",
  status: "DRAFT",
};

/**
 * Create / update post form, ported from the original PostFormCard.
 * Submits multipart FormData to POST /v1/post or PUT /v1/posts/:id.
 */
function PostForm({ post, usage }: PostFormProps) {
  const router = useRouter();
  const dialog = usePostDialog();
  const [image, setImage] = useState<File | null>(null);
  const [data, setData] = useState<DraftPost>(post ?? initialData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("status", data.status);

    if (data.description) {
      formData.append("description", data.description);
    }
    if (image) {
      formData.append("image", image);
    }
    try {
      if (usage === "create") {
        await apiFetch("/post", { method: "POST", body: formData });
      } else {
        await apiFetch(`/posts/${data.id}`, { method: "PUT", body: formData });
      }
      dialog?.close();
      router.refresh();
      toast.success("Post created Successfully");
    } catch {
      // The api client already displayed the error toast.
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/post/${data.id}`, { method: "DELETE" });
      dialog?.close();
      toast.success("post has been deleted");
    } catch {
      // The api client already displayed the error toast.
    } finally {
      router.refresh();
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="text-center">
          {usage === "create" ? "Create" : "Update"} Post
        </CardTitle>
      </CardHeader>
      <CardContent className="flex w-full flex-col gap-3">
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="post-title">
            <span className="text-red-500">*</span> Post Title
          </Label>
          <Input
            id="post-title"
            placeholder="Enter post title"
            name="title"
            value={data.title}
            onChange={handleChange}
          />
        </div>
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="post-description">Description</Label>
          <Textarea
            id="post-description"
            placeholder="Enter post description"
            name="description"
            value={data.description ?? ""}
            onChange={handleChange}
          />
        </div>
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="post-image">Upload an Image for Post</Label>
          <div className="flex w-full flex-wrap items-stretch gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-transparent px-2.5 text-sm font-medium hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50">
              <UploadIcon className="size-4" /> Upload file
              <input
                id="post-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  setImage(e.target.files?.[0] ?? null);
                }}
              />
            </label>
            {image && (
              <span className="flex items-center text-sm text-muted-foreground">{image.name}</span>
            )}
            {data.imageUrl && (
              <Image
                width={48}
                height={48}
                src={data.imageUrl}
                alt="Selected file"
                className="h-12 w-12 rounded-md object-cover"
              />
            )}
          </div>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Label>Post status</Label>
          <RadioGroup
            value={data.status}
            onValueChange={(value) => {
              if (value === null) return;
              setData((prev) => ({
                ...prev,
                status: value as "DRAFT" | "PENDING",
              }));
            }}
          >
            <div className="flex w-full flex-wrap items-stretch justify-between gap-2">
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-muted has-data-[checked]:border-primary has-data-[checked]:bg-muted">
                <RadioGroupItem value="DRAFT" />
                Save as draft
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-muted has-data-[checked]:border-primary has-data-[checked]:bg-muted">
                <RadioGroupItem value="PENDING" />
                Submit for review
              </label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button onClick={handleSubmit}>
          {data.status === "PENDING" ? "Submit for review" : "Save draft"}
        </Button>
        {usage === "update" && (
          <Button variant="outline" className="text-red-500 hover:bg-red-500/10" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default PostForm;
