import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, SelectField, TextAreaField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { UpdateItem } from "@/components/portal/UpdatesSection";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { todayISO } from "@/lib/dates";
import { visibilityOptions } from "@/lib/updates";
import { announcementSchema } from "@/lib/validation/update";
import { createAnnouncement, updateAnnouncement } from "@/services/updatesService";

function PostForm({ post, onDone }) {
  const editing = Boolean(post);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: post?.title ?? "",
      message: post?.excerpt ?? "",
      visibility: post?.visibility ?? "members",
    },
  });

  const title = watch("title");
  const message = watch("message");
  const visibility = watch("visibility");

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await updateAnnouncement(post.id, values);
        toast.success("Announcement updated.");
      } else {
        await createAnnouncement(values);
        toast.success(values.visibility === "members" ? "Announcement published." : "Saved. Members cannot see it yet.");
      }
      onDone();
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <FormAlert message={errors.root?.message} />

        <TextField
          label="Title"
          autoComplete="off"
          placeholder="Holiday hours this weekend"
          error={errors.title?.message}
          {...register("title")}
        />

        <TextAreaField
          label="Message"
          rows={5}
          placeholder="What do members need to know?"
          hint={`${message.trim().length}/500`}
          error={errors.message?.message}
          {...register("message")}
        />

        <SelectField
          label="Who can see it"
          options={visibilityOptions}
          error={errors.visibility?.message}
          {...register("visibility")}
        />

        <div>
          <p className="label-mono mb-2 text-muted-foreground">Preview</p>
          <ul>
            <UpdateItem
              item={{
                title: title.trim() || "Your title",
                excerpt: message.trim() || "Your message appears here.",
                publishedOn: post?.publishedOn ?? todayISO(),
              }}
            />
          </ul>
          {visibility === "hidden" && (
            <p className="mt-2 text-sm text-muted-foreground">Members will not see this post while it is hidden.</p>
          )}
        </div>
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving…">
          {editing ? "Save changes" : "Publish"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function AnnouncementSheet({ open, onOpenChange, post }) {
  const editing = Boolean(post);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{editing ? "Edit announcement" : "New announcement"}</SheetTitle>
          <SheetDescription>
            {editing ? "Changes show to members straight away." : "Members see it in their portal once it is visible."}
          </SheetDescription>
        </SheetHeader>

        <PostForm key={post?.id ?? "new"} post={post} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}