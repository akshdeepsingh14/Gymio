import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { isArchived } from "@/lib/updates";
import { cn } from "@/lib/utils";
import { describeActor } from "@/lib/attribution";

export function AnnouncementCard({ post, busy, onEdit, onToggleArchive, onDelete }) {
  const archived = isArchived(post);
  const visible = post.visibility === "members";

  return (
    <li className={cn("border border-border bg-card p-4 sm:p-5", archived && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono text-muted-foreground">{formatDate(post.publishedOn)}</p>
          <h3 className="mt-1 break-words font-semibold">{post.title}</h3>
          {post.createdBy?.name && (
            <p className="mt-1 text-xs text-muted-foreground">
              Posted by {describeActor(post.createdBy)}
              {post.updatedBy?.name ? ` · Last changed by ${post.updatedBy.name}` : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {archived && <Badge variant="secondary">Archived</Badge>}
          <Badge variant={visible ? "outline" : "secondary"}>{visible ? "Visible to members" : "Hidden"}</Badge>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
        {post.excerpt}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(post)} disabled={busy}>
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggleArchive(post)} disabled={busy}>
          {archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {archived ? "Restore" : "Archive"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(post)} disabled={busy} className="text-destructive">
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>
    </li>
  );
}