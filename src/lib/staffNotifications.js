// Staff see the same kinds of notifications as the owner, but only the ones their
// permissions let them act on, and every link points into the staff portal.
// Each staff member also chooses which kinds they want (Settings > Notifications). The
// gym's own notification switches belong to the owner and do not apply here.

import { buildNotifications } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import { DEFAULT_STAFF_PREFS } from "@/lib/staffAccount";

const NEEDS = {
  req: "access.review",
  expiry: "members.view",
  pay: "payments.view",
  post: "updates.publish",
};

export function buildStaffNotifications({ db, settings, today, currency, permissions, prefs = DEFAULT_STAFF_PREFS }) {
  const chosen = {
    ...settings,
    notifyInApp: prefs.inApp,
    notifyAccessRequests: prefs.requests,
    notifyExpiry: prefs.expiry,
    notifyPayments: prefs.payments,
    notifyAnnouncements: prefs.posts,
  };

  return buildNotifications({ db, settings: chosen, today, currency })
    .filter((item) => {
      const needed = NEEDS[item.id.split("-")[0]];
      return !needed || hasPermission(permissions, needed);
    })
    .map((item) => ({ ...item, to: item.to.replace(/^\/app/, "/staff") }));
}