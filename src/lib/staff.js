// Roles and permissions for a gym's staff.
//
// DEMO ONLY: the rules are saved and shown, but staff cannot sign in yet, so nothing
// is enforced. In the backend phase the server checks the permission on every request.
// Hiding a button is never the only protection.

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

export const STAFF_STATUS_LABELS = { invited: "Invited", active: "Active", suspended: "Suspended" };

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

/** Which owner screens a role can open, for the live preview. */
export function sectionsFor(permissions) {
  const has = (key) => permissions.includes(key);
  return [
    { label: "Overview", allowed: true },
    { label: "Revenue and analytics", allowed: has("reports.view") },
    { label: "Members", allowed: has("members.view") },
    { label: "Plans", allowed: has("plans.manage") },
    { label: "Payments", allowed: has("payments.view") },
    { label: "Access requests", allowed: has("access.review") },
    { label: "Gym updates", allowed: has("updates.publish") },
  ];
}