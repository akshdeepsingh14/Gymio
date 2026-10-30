import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StaffRowMenu } from "@/components/settings/StaffRowMenu";
import { StaffSheet } from "@/components/settings/StaffSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hex } from "@/components/ui/hex";
import { timeAgo } from "@/lib/format";
import { getInitials } from "@/lib/profile";
import { roleLabel, STAFF_STATUS_LABELS } from "@/lib/staff";
import {
  removeStaff,
  resendInvite,
  setStaffStatus,
  simulateAcceptInvite,
} from "@/services/staffService";

const BADGE_VARIANTS = { invited: "outline", active: "secondary", suspended: "destructive" };

function activityText(member) {
  if (member.status === "invited") return `Invited ${timeAgo(member.invitedAt).toLowerCase()}`;
  return member.lastActiveAt ? `Last active ${timeAgo(member.lastActiveAt).toLowerCase()}` : "Never signed in";
}

const CONFIRM_COPY = {
  suspend: (member) => ({
    title: "Suspend access?",
    description: `${member.name} will not be able to sign in until you reactivate them. Their name stays on your team.`,
    confirmLabel: "Suspend",
    destructive: false,
  }),
  remove: (member) =>
    member.status === "invited"
      ? {
          title: "Cancel this invite?",
          description: `The invite to ${member.name} is withdrawn. You can invite them again later.`,
          confirmLabel: "Cancel invite",
          destructive: true,
        }
      : {
          title: "Remove from team?",
          description: `${member.name} loses access for good. Things they recorded, like payments, stay in your records and audit log.`,
          confirmLabel: "Remove",
          destructive: true,
        },
};

export function StaffTeamCard({ staff }) {
  const [sheet, setSheet] = useState({ open: false, member: null });
  const [confirm, setConfirm] = useState(null); // { kind: "suspend" | "remove", member }
  const [busy, setBusy] = useState(false);

  const openInvite = () => setSheet({ open: true, member: null });
  const openEdit = (member) => setSheet({ open: true, member });

  const perform = async (task, message) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      toast.success(message);
      setConfirm(null);
    } catch (error) {
      toast.error(error.message ?? "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const copy = confirm ? CONFIRM_COPY[confirm.kind](confirm.member) : null;

  const confirmAction = () => {
    const { kind, member } = confirm;
    return kind === "suspend"
      ? perform(() => setStaffStatus(member.id, "suspended"), `${member.name} suspended.`)
      : perform(() => removeStaff(member.id), member.status === "invited" ? "Invite cancelled." : `${member.name} removed.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>People who help run your gym. Each has their own sign-in and only the permissions of their role.</CardDescription>
        <CardAction>
          <Button onClick={openInvite}>
            <Plus aria-hidden="true" />
            Invite staff
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div role="note" className="rounded-sm border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Demo only: invites send no email and staff cannot sign in yet, so the roles below are saved but not enforced.
          In the backend phase the server checks the permission on every request.
        </div>

        {staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff yet"
            text="You are the only person with access. Invite a manager, front desk or trainer."
            action={
              <Button onClick={openInvite}>
                <Plus aria-hidden="true" />
                Invite staff
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border rounded-sm border border-border">
            {staff.map((member) => (
              <li key={member.id} className="flex items-start gap-3 p-4">
                <Hex className="size-10">
                  <span className="font-mono text-xs font-bold">{getInitials(member.name)}</span>
                </Hex>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{member.name}</p>
                    <Badge variant={BADGE_VARIANTS[member.status]}>{STAFF_STATUS_LABELS[member.status]}</Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  <p className="label-mono mt-1 text-muted-foreground">
                    {roleLabel(member.role)} · {activityText(member)}
                  </p>
                </div>
                <StaffRowMenu
                  member={member}
                  onEdit={openEdit}
                  onResend={(item) => perform(() => resendInvite(item.id), `New invite sent to ${item.name} (demo).`)}
                  onAccept={(item) => perform(() => simulateAcceptInvite(item.id), `${item.name} joined (demo).`)}
                  onSuspend={(item) => setConfirm({ kind: "suspend", member: item })}
                  onReactivate={(item) => perform(() => setStaffStatus(item.id, "active"), `${item.name} reactivated.`)}
                  onRemove={(item) => setConfirm({ kind: "remove", member: item })}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <StaffSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        member={sheet.member}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !busy && !open && setConfirm(null)}
        title={copy?.title ?? ""}
        description={copy?.description ?? ""}
        confirmLabel={copy?.confirmLabel}
        destructive={copy?.destructive}
        loading={busy}
        onConfirm={confirmAction}
      />
    </Card>
  );
}