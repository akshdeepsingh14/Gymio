import { useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/image";
import { ACCEPTED_IMAGE_TYPES, MAX_SOURCE_BYTES } from "@/lib/updates";
import { cn } from "@/lib/utils";

/**
 * Picks an image, shrinks it in the browser and hands back a data URL.
 * `shape` is "square" (logo, profile photo) or "wide" (cover image).
 * DEMO ONLY: the backend phase uploads to an image storage service instead.
 */
export function ImageUpload({ label, hint, value, onChange, shape = "square", maxSide = 800, fallback }) {
  const labelId = useId();
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That image is over 8 MB. Choose a smaller one.");
      return;
    }

    setProcessing(true);
    try {
      onChange(await resizeImage(file, { maxSide }));
    } catch {
      setError("Could not read that image. Try another one.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div role="group" aria-labelledby={labelId} className="space-y-2">
      <p id={labelId} className="label-mono">
        {label}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden border border-border bg-muted text-muted-foreground",
            shape === "wide" ? "aspect-[16/6] w-full max-w-sm" : "size-20",
          )}
        >
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            (fallback ?? <ImagePlus className="size-6" aria-hidden="true" />)
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            onChange={handleFile}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => inputRef.current?.click()}>
            {processing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
            {value ? "Replace" : "Upload"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" disabled={processing} onClick={() => onChange("")}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}