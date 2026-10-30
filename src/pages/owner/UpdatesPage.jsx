import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ImagePlus, Images, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnnouncementCard } from "@/components/updates/AnnouncementCard";
import { AnnouncementSheet } from "@/components/updates/AnnouncementSheet";
import { PhotoGrid } from "@/components/updates/PhotoGrid";
import { PhotoSheet } from "@/components/updates/PhotoSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb } from "@/hooks/useDb";
import { isArchived, PHOTO_LIMIT } from "@/lib/updates";
import {
  deleteAnnouncement,
  deletePhoto,
  setAnnouncementStatus,
} from "@/services/updatesService";

function UpdatesSkeleton() {
  return (
    <div role="status" aria-label="Loading updates" className="mt-8 space-y-4">
      <Skeleton className="h-10 w-72 max-w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

export default function UpdatesPage() {
  const db = useDb();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("posts");
  const [filter, setFilter] = useState("published");

  // The dashboard's "Publish update" button links here with ?new=1
  const [postSheet, setPostSheet] = useState(() => ({ open: searchParams.get("new") === "1", post: null }));
  const [photoSheet, setPhotoSheet] = useState({ open: false, photo: null });
  const [confirm, setConfirm] = useState(null); // { kind: "post" | "photo", item }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Short pause so the loading state is visible. The real API will make it natural.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const publishedCount = db.announcements.filter((post) => !isArchived(post)).length;
  const archivedCount = db.announcements.length - publishedCount;
  const counts = { published: publishedCount, archived: archivedCount, all: db.announcements.length };

  const posts = useMemo(
    () =>
      db.announcements
        .filter((post) => filter === "all" || (filter === "archived" ? isArchived(post) : !isArchived(post)))
        .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [db.announcements, filter],
  );

  const photos = useMemo(
    () => [...db.photos].sort((a, b) => (b.createdAt ?? b.addedOn).localeCompare(a.createdAt ?? a.addedOn)),
    [db.photos],
  );

  const onPosts = tab === "posts";
  const atPhotoLimit = db.photos.length >= PHOTO_LIMIT;

  const toggleArchive = async (post) => {
    const archiving = !isArchived(post);
    setBusy(true);
    try {
      await setAnnouncementStatus(post.id, archiving ? "archived" : "published");
      toast.success(archiving ? "Announcement archived." : "Announcement restored.");
    } catch (error) {
      toast.error(error.message ?? "Could not update the announcement.");
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      if (confirm.kind === "post") await deleteAnnouncement(confirm.item.id);
      else await deletePhoto(confirm.item.id);
      toast.success(confirm.kind === "post" ? "Announcement deleted." : "Photo deleted.");
      setConfirm(null);
    } catch (error) {
      toast.error(error.message ?? "Could not delete this.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const description = `${publishedCount} ${publishedCount === 1 ? "announcement" : "announcements"} · ${db.photos.length} ${db.photos.length === 1 ? "photo" : "photos"}`;

  return (
    <>
      <title>Gym updates — Gymio</title>

      <PageHeader
        title="Gym updates"
        description={description}
        actions={
          onPosts ? (
            <Button size="lg" onClick={() => setPostSheet({ open: true, post: null })}>
              <Plus aria-hidden="true" />
              New announcement
            </Button>
          ) : (
            <Button size="lg" onClick={() => setPhotoSheet({ open: true, photo: null })} disabled={atPhotoLimit}>
              <ImagePlus aria-hidden="true" />
              Add photo
            </Button>
          )
        }
      />

      {loading ? (
        <UpdatesSkeleton />
      ) : (
        <div className="mt-8 space-y-6">
          <SegmentedControl
            label="Section"
            value={tab}
            onChange={setTab}
            items={[
              { id: "posts", label: "Announcements" },
              { id: "photos", label: "Photos", count: db.photos.length },
            ]}
          />

          {onPosts ? (
            <>
              <SegmentedControl
                label="Filter announcements"
                value={filter}
                onChange={setFilter}
                items={[
                  { id: "published", label: "Published", count: counts.published },
                  { id: "archived", label: "Archived", count: counts.archived },
                  { id: "all", label: "All", count: counts.all },
                ]}
              />

              {posts.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title={filter === "archived" ? "No archived posts" : "No announcements"}
                  text={
                    filter === "archived"
                      ? "Posts you archive show up here and can be restored."
                      : "Tell members about holiday hours, new classes or equipment changes."
                  }
                  action={
                    filter !== "archived" ? (
                      <Button onClick={() => setPostSheet({ open: true, post: null })}>
                        <Plus aria-hidden="true" />
                        Write an announcement
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {posts.map((post) => (
                    <AnnouncementCard
                      key={post.id}
                      post={post}
                      busy={busy}
                      onEdit={(item) => setPostSheet({ open: true, post: item })}
                      onToggleArchive={toggleArchive}
                      onDelete={(item) => setConfirm({ kind: "post", item })}
                    />
                  ))}
                </ul>
              )}
            </>
          ) : photos.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No photos yet"
              text="Add pictures of your gym. Visible photos appear in the member portal gallery."
              action={
                <Button onClick={() => setPhotoSheet({ open: true, photo: null })}>
                  <ImagePlus aria-hidden="true" />
                  Add your first photo
                </Button>
              }
            />
          ) : (
            <>
              <PhotoGrid
                photos={photos}
                busy={busy}
                onEdit={(photo) => setPhotoSheet({ open: true, photo })}
                onDelete={(photo) => setConfirm({ kind: "photo", item: photo })}
              />
              <p className="text-xs text-muted-foreground">
                {db.photos.length} of {PHOTO_LIMIT} photos. In this demo, photos are kept in your browser. The
                real app stores them with an image storage service.
              </p>
            </>
          )}
        </div>
      )}

      <AnnouncementSheet
        open={postSheet.open}
        onOpenChange={(open) => setPostSheet((current) => ({ ...current, open }))}
        post={postSheet.post}
      />

      <PhotoSheet
        open={photoSheet.open}
        onOpenChange={(open) => setPhotoSheet((current) => ({ ...current, open }))}
        photo={photoSheet.photo}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title={confirm?.kind === "photo" ? "Delete photo?" : "Delete announcement?"}
        description={
          confirm?.kind === "photo"
            ? "It is removed from the gallery for everyone. This cannot be undone. To only hide it, edit the photo instead."
            : "It is removed for everyone. This cannot be undone. To keep it but hide it, archive it instead."
        }
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={runDelete}
      />
    </>
  );
}