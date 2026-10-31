import { Check, Mail } from "lucide-react";

import { STAFF_ACTION_META, STATUS_BADGE_VARIANTS } from "@/components/settings/staffActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDb } from "@/hooks/useDb";
import { auditMeta, describeAudit } from "@/lib/auditLog";
import { formatDate } from "@/lib/dates";
import { timeAgo } from "@/lib/format";
import { getInitials } from "@/lib/profile";
import {
  availableActions,
  describeExpiry,
  displayStatus,
  getRolePermissions,
  inviteState,
  OWNER_ONLY,
  PERMISSIONS,
  roleLabel,
  STAFF_STATUS_LABELS,
} from "@/lib/staff";
import { formatDateTime } from "@/lib/security";

const ACTIVITY_LIMIT = 8;

function Field({ label, children }) {
  return (
    <div>
      <dt className="label-mono text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{children || "—"}</dd>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="label-mono border-b border-border pb-2 text-muted-foreground">{children}</h3>;
}

const dateOf = (iso) => (iso ? formatDate(iso.slice(0, 10)) : "");

function InvitationBox({ member }) {
  const { invite } = member;
  const state = inviteState(member);

  const copy = {
    sent: {
      title: "Invite sent",
      text: `${describeExpiry(invite)}. Sent ${timeAgo(invite.sentAt).toLowerCase()}${invite.sendCount > 1 ? `, ${invite.sendCount} times in total` : ""}.`,
    },
    expired: {
      title: "Invite expired",
      text: `${describeExpiry(invite)}. Resend it to give them a new link. The old one will not work.`,
    },
    cancelled: {
      title: "Invite cancelled",
      text: `You cancelled this invite ${invite.cancelledAt ? timeAgo(invite.cancelledAt).toLowerCase() : ""}. The link no longer works. Invite them again to start over.`,
    },
    used: {
      title: "Invite accepted",
      text: `They joined ${invite.usedAt ? timeAgo(invite.usedAt).toLowerCase() : ""}. The link has been used and cannot be used again.`,
    },
  }[state];

  if (!copy) return null;

  return (
    <section className="space-y-3">
      <SectionTitle>Invitation</SectionTitle>
      <div className="space-y-2 rounded-sm border border-border p-4">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-semibold">{copy.title}</p>
        </div>
        <p className="text-sm text-muted-foreground">{copy.text}</p>
        {state !== "used" && (
          <p className="text-sm text-muted-foreground">Demo: no email is ever sent. This only changes the record.</p>
        )}
      </div>
    </section>
  );
}

/**
 * `memberId` is looked up live, so the view updates itself after an action.
 * `onAction(actionId, member)` is the same handler the row menu uses.
 */
export function StaffDetailSheet({ open, onOpenChange, memberId, onAction }) {
  const db = useDb();
  const member = db.staff.find((item) => item.id === memberId) ?? null;

  const status = member ? displayStatus(member) : null;
  const granted = member ? getRolePermissions(db.rolePermissions)[member.role] : [];
  const activity = member
    ? db.auditLog
        .filter((entry) => entry.subjectId === member.id)
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, ACTIVITY_LIMIT)
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5 pr-16">
          <SheetTitle>{member?.name ?? "Team member"}</SheetTitle>
          <SheetDescription>{member ? member.email : "This person is no longer on your team."}</SheetDescription>
        </SheetHeader>

        {member && (
          <>
            <div className="flex-1 space-y-8 overflow-y-auto p-5">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Hex className="size-12">
                    <span className="font-mono text-sm font-bold">{getInitials(member.name)}</span>
                  </Hex>
                  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{STAFF_STATUS_LABELS[status]}</Badge>
                  <Badge variant="outline">{roleLabel(member.role)}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Phone">{member.phone}</Field>
                  <Field label="Joined">{dateOf(member.joinedAt)}</Field>
                  <Field label="Last active">{member.lastActiveAt ? timeAgo(member.lastActiveAt) : ""}</Field>
                  <Field label="Invited">{dateOf(member.invitedAt)}</Field>
                  <Field label="Invited by">{member.invite?.invitedBy}</Field>
                  <Field label="Gym access">{status === "active" ? "Can sign in" : status === "suspended" ? "Suspended" : "Not joined"}</Field>
                </dl>
              </section>

              <InvitationBox member={member} />

              <section className="space-y-3">
                <SectionTitle>
                  Permissions · {granted.length} of {PERMISSIONS.length}
                </SectionTitle>
                <p className="text-sm text-muted-foreground">
                  Set by the {roleLabel(member.role)} role. Change it in Roles and permissions below, and it applies to
                  everyone with that role.
                </p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((permission) => {
                    const has = granted.includes(permission.key);
                    return (
                      <li
                        key={permission.key}
                        className={has ? "flex items-start gap-2 text-sm" : "flex items-start gap-2 text-sm text-muted-foreground line-through"}
                      >
                        <Check className={has ? "mt-0.5 size-4 shrink-0" : "mt-0.5 size-4 shrink-0 opacity-30"} aria-hidden="true" />
                        <span>
                          {permission.label}
                          {!has && <span className="sr-only"> (not allowed)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm text-muted-foreground">Always owner-only: {OWNER_ONLY.join(", ")}.</p>
              </section>

              <section className="space-y-3">
                <SectionTitle>Recent activity</SectionTitle>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing recorded for this person yet.</p>
                ) : (
                  <ul>
                    {activity.map((entry) => (
                      <li key={entry.id} className="space-y-1 border-b border-border py-3 last:border-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant={auditMeta(entry.action).variant}>{auditMeta(entry.action).label}</Badge>
                          <span className="label-mono text-muted-foreground">{formatDateTime(entry.at)}</span>
                        </div>
                        <p className="break-words text-sm">{describeAudit(entry)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-sm text-muted-foreground">
                  This is the history of changes to their account. What they do after signing in will appear here once
                  staff sign-in is switched on.
                </p>
              </section>
            </div>

            <SheetFooter className="mt-0 flex-row flex-wrap justify-end gap-2 border-t border-border p-5">
              {availableActions(member).map((id) => {
                const { label, icon: Icon, danger } = STAFF_ACTION_META[id];
                return (
                  <Button
                    key={id}
                    type="button"
                    variant={danger ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => onAction(id, member)}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </Button>
                );
              })}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}