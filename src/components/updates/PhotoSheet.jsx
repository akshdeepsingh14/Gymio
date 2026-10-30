import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { FormAlert, SelectField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resizeImage } from "@/lib/image";
import { ACCEPTED_IMAGE_TYPES, MAX_SOURCE_BYTES, visibilityOptions } from "@/lib/updates";
import { photoSchema } from "@/lib/validation/update";
import { addPhoto, updatePhoto } from "@/services/updatesService";

function PhotoForm({ photo, onDone }) {
  const editing = Boolean(photo);
  const inputRef = useRef(null);
  const [src, setSrc] = useState(photo?.src ?? null);
  const [fileError, setFileError] = useState("");
  const [processing, setProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(photoSchema),
    defaultValues: { caption: photo?.caption ?? "", visibility: photo?.visibility ?? "members" },
  });

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFileError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setFileError("That image is over 8 MB. Choose a smaller one.");
      return;
    }

    setProcessing(true);
    try {
      setSrc(await resizeImage(file));
    } catch {
      setFileError("Could not read that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  const onSubmit = async (values) => {
    if (!src) {
      setFileError("Choose a photo first.");
      return;
    }
    try {
      if (editing) {
        await updatePhoto(photo.id, values);
        toast.success("Photo updated.");
      } else {
        await addPhoto({ ...values, src });
        toast.success("Photo added.");
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

        <div>
          <div className="aspect-[4/3] overflow-hidden border border-dashed border-border bg-muted/40">
            {src ? (
              <img src={src} alt="Selected gym photo" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagePlus className="size-8" aria-hidden="true" />
                <p className="text-sm">{processing ? "Preparing photo…" : "No photo chosen"}</p>
              </div>
            )}
          </div>

          {!editing && (
            <div className="mt-3">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={onFile}
                className="sr-only"
                id="photo-file"
                aria-describedby={fileError ? "photo-file-error" : undefined}
              />
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={processing}>
                <ImagePlus aria-hidden="true" />
                {src ? "Choose a different photo" : "Choose photo"}
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                JPG, PNG or WebP. The demo shrinks it and keeps it in this browser.
              </p>
            </div>
          )}
          {editing && <p className="mt-2 text-sm text-muted-foreground">To use a different picture, add a new photo.</p>}
          {fileError && (
            <p id="photo-file-error" role="alert" className="mt-2 text-sm text-destructive">
              {fileError}
            </p>
          )}
        </div>

        <TextField
          label="Caption (optional)"
          autoComplete="off"
          placeholder="New free-weights area"
          error={errors.caption?.message}
          {...register("caption")}
        />

        <SelectField
          label="Who can see it"
          options={visibilityOptions}
          error={errors.visibility?.message}
          {...register("visibility")}
        />
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving…" disabled={processing}>
          {editing ? "Save changes" : "Add photo"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

export function PhotoSheet({ open, onOpenChange, photo }) {
  const editing = Boolean(photo);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{editing ? "Edit photo" : "Add photo"}</SheetTitle>
          <SheetDescription>Photos appear in the member portal gallery when they are visible.</SheetDescription>
        </SheetHeader>

        <PhotoForm key={photo?.id ?? "new"} photo={photo} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}