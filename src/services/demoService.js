// Puts the demo gym back to how it started. DEMO ONLY: the backend phase has no such thing.
//
// It removes the demo gym's saved data (members, payments, staff, audit log), the demo staff's
// own choices and sessions, and the demo owner's read marks. Anything belonging to a real
// account created in this browser is left alone. The demo owner's gym profile and settings
// live on the account itself and are not reset.

import { resetDemoStaffLogins } from "@/services/staffAuthService";

const DEMO_OWNER_ID = "owner_demo";

const isDemoKey = (key) =>
  key.startsWith("gymio-db-demo-") ||
  key === `gymio-security-${DEMO_OWNER_ID}` ||
  key === `gymio-read-notifications-${DEMO_OWNER_ID}` ||
  /^gymio-(staff-(prefs|photo|security)|read-notifications)-staff_demo_/.test(key);

export function resetDemoData() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
    keys.filter((key) => key && isDemoKey(key)).forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: there is nothing saved to reset.
  }

  // Demo staff passwords go back to the sample password, and a demo staff session is ended
  resetDemoStaffLogins();
}