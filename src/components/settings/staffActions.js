// One place for what each staff action is called and looks like, so the row menu and the
// details view always agree. Which actions apply to a person is decided in lib/staff.js.

import { Ban, Link2, Pencil, Send, Trash2, UserCheck, UserX } from "lucide-react";

export const STAFF_ACTION_META = {
  edit: { label: "Edit details", icon: Pencil },
  resend: { label: "Resend invite", icon: Send },
  reinvite: { label: "Invite again", icon: Send },
  copylink: { label: "Copy invite link", icon: Link2 },
  cancel: { label: "Cancel invite", icon: Ban, danger: true },
  suspend: { label: "Suspend access", icon: UserX },
  reactivate: { label: "Reactivate", icon: UserCheck },
  remove: { label: "Remove from team", icon: Trash2, danger: true },
  delete: { label: "Delete record", icon: Trash2, danger: true },
};

// Variant for the status badge beside a name.
export const STATUS_BADGE_VARIANTS = {
  active: "secondary",
  pending: "outline",
  suspended: "destructive",
  expired: "destructive",
  cancelled: "outline",
};