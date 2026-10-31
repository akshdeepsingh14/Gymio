// Announcements and gym photos. Same pattern as the other services: in the
// backend phase only the bodies of these functions change to API calls, and
// photos go to an image storage service instead of the browser.
//
// Every post and photo records who created it. Edits and archive changes record who touched it
// last. Deletes leave an audit entry, because the record itself is gone afterwards.

import { actorRef } from "@/lib/attribution";
import { todayISO } from "@/lib/dates";
import { PHOTO_LIMIT } from "@/lib/updates";
import { appendAudit } from "@/services/auditService";
import { ServiceError } from "@/services/memberService";
import { assertCan } from "@/services/actor";
import { getDb, lastSaveWorked, updateDb } from "@/services/mockDb";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const DENIED = "Your role cannot publish or change gym updates.";

function findPost(id) {
  const post = getDb().announcements.find((item) => item.id === id);
  if (!post) throw new ServiceError("This post no longer exists.");
  return post;
}

function findPhoto(id) {
  const photo = getDb().photos.find((item) => item.id === id);
  if (!photo) throw new ServiceError("This photo no longer exists.");
  return photo;
}

const touched = (actor) => ({ updatedBy: actorRef(actor), updatedAt: new Date().toISOString() });

// ---- Announcements ----

export async function createAnnouncement(input) {
  const actor = assertCan("updates.publish", DENIED);

  await wait();
  const post = {
    id: newId("ann"),
    title: input.title.trim(),
    excerpt: input.message.trim(),
    visibility: input.visibility,
    status: "published",
    publishedOn: todayISO(),
    createdAt: new Date().toISOString(),
    createdBy: actorRef(actor),
  };
  updateDb((state) => ({ ...state, announcements: [post, ...state.announcements] }));
  return post;
}

export async function updateAnnouncement(id, input) {
  const actor = assertCan("updates.publish", DENIED);

  await wait();
  findPost(id);
  updateDb((state) => ({
    ...state,
    announcements: state.announcements.map((post) =>
      post.id === id
        ? {
            ...post,
            title: input.title.trim(),
            excerpt: input.message.trim(),
            visibility: input.visibility,
            ...touched(actor),
          }
        : post,
    ),
  }));
}

/** status: "published" | "archived". Archived posts disappear from members but can be restored. */
export async function setAnnouncementStatus(id, status) {
  const actor = assertCan("updates.publish", DENIED);

  await wait(250);
  if (!["published", "archived"].includes(status)) throw new ServiceError("Unknown post status.");
  findPost(id);
  updateDb((state) => ({
    ...state,
    announcements: state.announcements.map((post) =>
      post.id === id ? { ...post, status, ...touched(actor) } : post,
    ),
  }));
}

export async function deleteAnnouncement(id) {
  assertCan("updates.publish", DENIED);

  await wait(250);
  const post = findPost(id);
  updateDb((state) => ({
    ...state,
    announcements: state.announcements.filter((item) => item.id !== id),
    auditLog: appendAudit(state, {
      action: "update.deleted",
      summary: `Deleted announcement "${post.title}".`,
    }),
  }));
}

// ---- Photos ----

export async function addPhoto({ src, caption, visibility }) {
  const actor = assertCan("updates.publish", DENIED);

  await wait();
  if (getDb().photos.length >= PHOTO_LIMIT) {
    throw new ServiceError(`The demo keeps up to ${PHOTO_LIMIT} photos. Delete one to add another.`);
  }
  const photo = {
    id: newId("photo"),
    src,
    caption: caption.trim(),
    visibility,
    addedOn: todayISO(),
    createdAt: new Date().toISOString(),
    createdBy: actorRef(actor),
  };
  updateDb((state) => ({ ...state, photos: [photo, ...state.photos] }));

  // The browser's storage can be full. Say so, instead of showing a photo that vanishes on refresh.
  if (!lastSaveWorked()) {
    updateDb((state) => ({ ...state, photos: state.photos.filter((item) => item.id !== photo.id) }));
    throw new ServiceError("Your browser has no room left to keep this photo. Delete a photo, or choose a smaller image.");
  }
  return photo;
}

export async function updatePhoto(id, { caption, visibility }) {
  const actor = assertCan("updates.publish", DENIED);

  await wait();
  findPhoto(id);
  updateDb((state) => ({
    ...state,
    photos: state.photos.map((photo) =>
      photo.id === id ? { ...photo, caption: caption.trim(), visibility, ...touched(actor) } : photo,
    ),
  }));
}

export async function deletePhoto(id) {
  assertCan("updates.publish", DENIED);

  await wait(250);
  const photo = findPhoto(id);
  updateDb((state) => ({
    ...state,
    photos: state.photos.filter((item) => item.id !== id),
    auditLog: appendAudit(state, {
      action: "photo.deleted",
      summary: photo.caption ? `Deleted photo "${photo.caption}".` : "Deleted a gym photo.",
    }),
  }));
}