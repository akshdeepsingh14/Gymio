// Announcements and gym photos. Same pattern as the other services: in the
// backend phase only the bodies of these functions change to API calls, and
// photos go to an image storage service instead of the browser.

import { todayISO } from "@/lib/dates";
import { PHOTO_LIMIT } from "@/lib/updates";
import { ServiceError } from "@/services/memberService";
import { getDb, updateDb } from "@/services/mockDb";

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function assertPost(id) {
  if (!getDb().announcements.some((post) => post.id === id)) throw new ServiceError("This post no longer exists.");
}

function assertPhoto(id) {
  if (!getDb().photos.some((photo) => photo.id === id)) throw new ServiceError("This photo no longer exists.");
}

// ---- Announcements ----

export async function createAnnouncement(input) {
  await wait();
  const post = {
    id: newId("ann"),
    title: input.title.trim(),
    excerpt: input.message.trim(),
    visibility: input.visibility,
    status: "published",
    publishedOn: todayISO(),
    createdAt: new Date().toISOString(),
  };
  updateDb((state) => ({ ...state, announcements: [post, ...state.announcements] }));
  return post;
}

export async function updateAnnouncement(id, input) {
  await wait();
  assertPost(id);
  updateDb((state) => ({
    ...state,
    announcements: state.announcements.map((post) =>
      post.id === id
        ? { ...post, title: input.title.trim(), excerpt: input.message.trim(), visibility: input.visibility }
        : post,
    ),
  }));
}

/** status: "published" | "archived". Archived posts disappear from members but can be restored. */
export async function setAnnouncementStatus(id, status) {
  await wait(250);
  if (!["published", "archived"].includes(status)) throw new ServiceError("Unknown post status.");
  assertPost(id);
  updateDb((state) => ({
    ...state,
    announcements: state.announcements.map((post) => (post.id === id ? { ...post, status } : post)),
  }));
}

export async function deleteAnnouncement(id) {
  await wait(250);
  assertPost(id);
  updateDb((state) => ({ ...state, announcements: state.announcements.filter((post) => post.id !== id) }));
}

// ---- Photos ----

export async function addPhoto({ src, caption, visibility }) {
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
  };
  updateDb((state) => ({ ...state, photos: [photo, ...state.photos] }));
  return photo;
}

export async function updatePhoto(id, { caption, visibility }) {
  await wait();
  assertPhoto(id);
  updateDb((state) => ({
    ...state,
    photos: state.photos.map((photo) => (photo.id === id ? { ...photo, caption: caption.trim(), visibility } : photo)),
  }));
}

export async function deletePhoto(id) {
  await wait(250);
  assertPhoto(id);
  updateDb((state) => ({ ...state, photos: state.photos.filter((photo) => photo.id !== id) }));
}