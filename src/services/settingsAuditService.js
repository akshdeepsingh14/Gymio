// Writes Settings and Gym profile saves to the audit log. Kept apart from authService, which
// saves the change itself, so the two never import each other. DEMO ONLY, like all audit entries.

import { describeProfileChange, describeSettingsChange } from "@/lib/settingsAudit";
import { appendAudit } from "@/services/auditService";
import { updateDb } from "@/services/mockDb";

function log(action, summary) {
  if (!summary) return;
  try {
    updateDb((state) => ({ ...state, auditLog: appendAudit(state, { action, summary }) }));
  } catch {
    // The change itself is already saved. A full browser store must not report it as failed.
  }
}

export const logSettingsChange = (beforeUser, afterUser) =>
  log("settings.updated", describeSettingsChange(beforeUser?.gym, afterUser?.gym));

export const logProfileChange = (beforeUser, afterUser) =>
  log("profile.updated", describeProfileChange(beforeUser, afterUser));