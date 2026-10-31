// Roles, permissions and the staff invitation lifecycle.
// Permissions are checked in two places: the staff screens (navigation, routes, buttons) and
// the service layer (services/actor.js), which refuses an action the role does not allow.
// Both are a DEMO. In the backend phase the server checks every permission on every request.

export const PERMISSIONS = [
  {
    key: "members.view",
    group: "Members",
    label: "View members",
    description: "See the member list, details and membership history.",
  },
  {
    key: "members.manage",
    group: "Members",
    label: "Add and edit members",
    description: "Add members, edit details, renew, and change access status or access codes.",
  },
  {
    key: "payments.view",
    group: "Payments",
    label: "View payments",
    description: "See payment history and open receipts.",
  },
  {
    key: "payments.record",
    group: "Payments",
    label: "Record payments",
    description: "Take a payment from a member and issue a receipt.",
  },
  {
    key: "payments.adjust",
    group: "Payments",
    label: "Void and edit payments",
    description: "Correct records through the audit-logged adjustment process.",
  },
  {
    key: "access.review",
    group: "Access requests",
    label: "Approve or reject requests",
    description: "Decide who can open the member portal.",
  },
  {
    key: "updates.publish",
    group: "Gym updates",
    label: "Publish updates",
    description: "Post announcements and photos, and archive or delete them.",
  },
  {
    key: "plans.manage",
    group: "Plans",
    label: "Manage plans",
    description: "Create, edit and archive membership plans.",
  },
  {
    key: "reports.view",
    group: "Overview",
    label: "See revenue and analytics",
    description: "Revenue totals and charts on the dashboard.",
  },
];

export const PERMISSION_KEYS = PERMISSIONS.map((permission) => permission.key);

// A permission that only makes sense together with another one.
// Every needed permission is a base permission, so one pass is always enough.
const REQUIRES = {
  "members.manage": ["members.view"],
  "payments.record": ["payments.view", "members.view"],
  "payments.adjust": ["payments.view"],
  "access.review": ["members.view"],
};

export const ROLES = [
  { value: "manager", label: "Manager", description: "Runs the gym day to day." },
  { value: "frontDesk", label: "Front desk", description: "Handles sign-ups, renewals and payments at the counter." },
  { value: "trainer", label: "Trainer", description: "Sees members and posts updates." },
];

export const ROLE_VALUES = ROLES.map((role) => role.value);

export const roleLabel = (value) => ROLES.find((role) => role.value === value)?.label ?? "Staff";

export const DEFAULT_ROLE_PERMISSIONS = {
  manager: [...PERMISSION_KEYS],
  frontDesk: ["members.view", "members.manage", "payments.view", "payments.record", "access.review"],
  trainer: ["members.view", "updates.publish"],
};

// Always owner-only. These cannot be given to staff.
export const OWNER_ONLY = ["Gym profile", "Settings", "Staff and permissions", "Subscription and billing", "Data and privacy"];

// Permissions that deserve a second look before the owner hands them out.
export const SENSITIVE_PERMISSIONS = {
  "payments.adjust":
    "This person can void payments and edit payment records. It changes the gym's money history, although every change is logged with their name.",
  "reports.view": "This person can see total revenue and the payment breakdown for the whole gym.",
  "access.review":
    "This person decides who can open the member portal, which shows a member's own payments and receipts.",
  "plans.manage": "This person can change plan prices, which decides what every new member is charged.",
};


// What the owner sees. "pending", "expired" and "cancelled" are all people who have not
// joined yet. See displayStatus() for how they are told apart.
export const STAFF_STATUS_LABELS = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
  expired: "Expired",
  cancelled: "Cancelled",
};

const inOrder = (set) => PERMISSION_KEYS.filter((key) => set.has(key));

/** The list with anything it depends on added, unknown keys dropped, and the standard order. */
export function withDependencies(list) {
  const set = new Set(list.filter((key) => PERMISSION_KEYS.includes(key)));
  for (const key of [...set]) {
    for (const needed of REQUIRES[key] ?? []) set.add(needed);
  }
  return inOrder(set);
}

/** Ticks or unticks one permission. Ticking adds what it needs. Unticking also removes what depends on it. */
export function togglePermission(list, key, on) {
  const set = new Set(list);
  if (on) {
    set.add(key);
    for (const needed of REQUIRES[key] ?? []) set.add(needed);
  } else {
    set.delete(key);
    for (const [dependent, needed] of Object.entries(REQUIRES)) {
      if (needed.includes(key)) set.delete(dependent);
    }
  }
  return inOrder(set);
}

/** Permissions that another ticked permission needs. They stay ticked and cannot be unticked by themselves. */
export function lockedPermissions(list) {
  const locked = new Set();
  for (const key of list) {
    for (const needed of REQUIRES[key] ?? []) locked.add(needed);
  }
  return locked;
}

/** Permissions for every role, with gaps filled from the defaults. Safe to call with anything. */
export function getRolePermissions(input) {
  const source = input && typeof input === "object" ? input : {};
  return Object.fromEntries(
    ROLE_VALUES.map((role) => [
      role,
      Array.isArray(source[role]) ? withDependencies(source[role]) : [...DEFAULT_ROLE_PERMISSIONS[role]],
    ]),
  );
}

// ---------------------------------------------------------------------------------
// Invitations
//
// A record keeps two things:
//   status  "invited" | "active" | "suspended"     the account
//   invite  { token, state, sentAt, expiresAt, sendCount, invitedBy, usedAt, cancelledAt }
//           state is stored as "sent" | "cancelled" | "used"
//
// "Expired" is never stored. It is worked out from expiresAt, so it cannot go stale.
// Only the staff service writes these fields. Everything else reads them through the
// helpers below.
// ---------------------------------------------------------------------------------

export const INVITE_VALID_DAYS = 7;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export const inviteExpiry = (sentAtISO) => new Date(new Date(sentAtISO).getTime() + INVITE_VALID_DAYS * DAY_MS).toISOString();

/** "sent" | "expired" | "cancelled" | "used", or null when the record has no invite. */
export function inviteState(member, now = Date.now()) {
  const invite = member?.invite;
  if (!invite) return null;
  if (invite.state === "sent" && new Date(invite.expiresAt).getTime() <= now) return "expired";
  return invite.state;
}

/** "active" | "suspended" | "pending" | "expired" | "cancelled" */
export function displayStatus(member, now = Date.now()) {
  if (member.status === "active" || member.status === "suspended") return member.status;
  const state = inviteState(member, now);
  return state === "expired" || state === "cancelled" ? state : "pending";
}

const ON_TEAM = new Set(["active", "suspended", "pending"]);

/** Joined, suspended, or still holding a valid invite. Expired and cancelled invites are not on the team. */
export const isOnTeam = (member) => ON_TEAM.has(displayStatus(member));

/** Counts for the summary tiles. total = active + pending + suspended, so the tiles always add up. */
export function teamCounts(staff, now = Date.now()) {
  const counts = { active: 0, pending: 0, suspended: 0, closed: 0 };
  for (const member of staff) {
    const status = displayStatus(member, now);
    if (status === "expired" || status === "cancelled") counts.closed += 1;
    else counts[status] += 1;
  }
  return { ...counts, total: counts.active + counts.pending + counts.suspended };
}

/**
 * What the owner may do to this person right now, in menu order.
 * The staff service checks against this same list, so a button that is hidden is also
 * refused if it is called anyway (for example from a stale tab).
 */
export function availableActions(member, now = Date.now()) {
  switch (displayStatus(member, now)) {
    case "active":
      return ["edit", "suspend", "remove"];
    case "suspended":
      return ["edit", "reactivate", "remove"];
    case "pending":
            return ["edit", "resend", "copylink", "cancel"];
    case "expired":
      return ["edit", "resend", "delete"];
    default: // cancelled
      return ["reinvite", "delete"];
  }
}

/** "Expires in 6 days", "Expired yesterday" */
export function describeExpiry(invite, now = Date.now()) {
  const left = new Date(invite.expiresAt).getTime() - now;
  if (left <= 0) {
    const days = Math.floor(-left / DAY_MS);
    if (days === 0) return "Expired today";
    return days === 1 ? "Expired yesterday" : `Expired ${days} days ago`;
  }
  const hours = Math.ceil(left / HOUR_MS);
  if (hours < 24) return `Expires in ${hours} h`;
  const days = Math.ceil(left / DAY_MS);
  return `Expires in ${days} ${days === 1 ? "day" : "days"}`;
}

export const STAFF_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "suspended", label: "Suspended" },
  { id: "closed", label: "Closed" },
];

const STATUS_ORDER = { active: 0, pending: 1, suspended: 2, expired: 3, cancelled: 4 };

/** Search by name, email or role, narrowed by one filter. "closed" means expired or cancelled invites. */
export function filterStaff(staff, { query = "", filter = "all" } = {}, now = Date.now()) {
  const needle = query.trim().toLowerCase();

  return staff
    .filter((member) => {
      const status = displayStatus(member, now);
      if (filter === "closed" ? status !== "expired" && status !== "cancelled" : filter !== "all" && status !== filter) {
        return false;
      }
      if (!needle) return true;
      return [member.name, member.email, roleLabel(member.role)].some((text) => text.toLowerCase().includes(needle));
    })
    .sort(
      (a, b) =>
        STATUS_ORDER[displayStatus(a, now)] - STATUS_ORDER[displayStatus(b, now)] || a.name.localeCompare(b.name),
    );
}

/**
 * Brings a record saved before invitations existed up to date, so nobody's saved demo
 * data breaks. Someone who had joined gets a "used" invite. Someone still invited gets a
 * fresh seven-day invite counted from the day they were invited.
 */
export function normalizeStaffRecord(member) {
  if (member.invite) return member;

  const joined = member.status !== "invited";
  const sentAt = member.invitedAt ?? new Date().toISOString();
  const joinedAt = joined ? (member.joinedAt ?? member.lastActiveAt ?? sentAt) : null;

  return {
    ...member,
    joinedAt,
    invite: {
      token: `legacy-${member.id}`,
      state: joined ? "used" : "sent",
      sentAt,
      expiresAt: inviteExpiry(sentAt),
      sendCount: 1,
      invitedBy: "",
      usedAt: joinedAt,
      cancelledAt: null,
    },
  };
}