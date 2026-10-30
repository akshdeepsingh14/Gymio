// Rules and labels shared by the owner's Gym Updates screen and the member portal.

/** Photos are kept in the browser during the demo, so the count is capped. Real uploads come with the backend. */
export const PHOTO_LIMIT = 12;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

export const visibilityOptions = [
  { value: "members", label: "Visible to members" },
  { value: "hidden", label: "Hidden from members" },
];

/** Posts made before archiving existed have no status, so anything but "archived" is live. */
export const isArchived = (post) => post.status === "archived";

/** What a member is allowed to see. */
export const isShownToMembers = (item) => !isArchived(item) && item.visibility === "members";