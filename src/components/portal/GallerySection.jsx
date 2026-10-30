import { useState } from "react";
import { Images, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export function GallerySection({ photos }) {
  const [selected, setSelected] = useState(null);

  return (
    <section aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="font-display text-2xl font-extrabold uppercase leading-none">
        Gallery
      </h2>

      {photos.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Images}
          title="No photos yet"
          text="Photos of the gym will show up here."
        />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setSelected(photo)}
                aria-label={`Open photo: ${photo.caption || "Gym photo"}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden border border-border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <img
                  src={photo.src}
                  alt={photo.caption || "Gym photo"}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 outline-none">
            <Dialog.Title className="sr-only">{selected?.caption || "Gym photo"}</Dialog.Title>
            <Dialog.Description className="sr-only">Enlarged gym photo</Dialog.Description>
            {selected && (
              <figure className="border-2 border-foreground bg-popover">
                <img
                  src={selected.src}
                  alt={selected.caption || "Gym photo"}
                  className="max-h-[75svh] w-full object-contain"
                />
                {selected.caption && (
                  <figcaption className="border-t border-border p-3 text-sm">{selected.caption}</figcaption>
                )}
              </figure>
            )}
            <Dialog.Close asChild>
              <Button variant="outline" size="icon" aria-label="Close photo" className="absolute -top-3 -right-3 bg-background">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}