import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";

export function PhotoGrid({ photos, busy, onEdit, onDelete }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo) => (
        <li key={photo.id} className="overflow-hidden border border-border bg-card">
          <div className="relative aspect-[4/3] bg-muted">
            <img
              src={photo.src}
              alt={photo.caption || "Gym photo"}
              loading="lazy"
              className="size-full object-cover"
            />
            {photo.visibility === "hidden" && (
              <Badge variant="secondary" className="absolute left-2 top-2">
                Hidden
              </Badge>
            )}
          </div>
          <div className="space-y-3 p-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{photo.caption || "No caption"}</p>
              <p className="label-mono mt-1 text-muted-foreground">
                Added {formatDate(photo.addedOn)}
                {photo.createdBy?.name ? ` · ${photo.createdBy.name}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(photo)} disabled={busy}>
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(photo)}
                disabled={busy}
                className="text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}