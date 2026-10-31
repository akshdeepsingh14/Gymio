import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { StaffDetailSheet } from "@/components/settings/StaffDetailSheet";
import { StaffRowMenu } from "@/components/settings/StaffRowMenu";
import { StaffSheet } from "@/components/settings/StaffSheet";
import { StaffStats } from "@/components/settings/StaffStats";
import { STATUS_BADGE_VARIANTS } from "@/components/settings/staffActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hex } from "@/components/ui/hex";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/format";
import { getInitials } from "@/lib/profile";
import {
  describeExpiry,
  displayStatus,
  filterStaff,
  roleLabel,
  STAFF_FILTERS,
  STAFF_STATUS_LABELS,
  teamCounts,
} from "@/lib/staff";

import { cancelInvite, getInviteLink, removeStaff, resendInvite, setStaffStatus } from "@/services/staffService";

function activityText(member, status) {
  switch (status) {
    case "pending":
    case "expired":
      return `${describeExpiry(member.invite)}`;
    case "cancelled":
      return member.invite.cancelledAt ? `Cancelled ${timeAgo(member.invite.cancelledAt).toLowerCase()}` : "Cancelled";
    default:
      return member.lastActiveAt ? `Last active ${timeAgo(member.lastActiveAt).toLowerCase()}` : "Never signed in";
  }
}

// What each action that needs a "are you sure?" says. The rest run straight away.
const CONFIRM_COPY = {
  suspend: (member) => ({
    title: "Suspend access?",
    description: `${member.name} will not be able to sign in until you reactivate them. Their name stays on your team.`,
    confirmLabel: "Suspend",
    destructive: false,
  }),
  cancel: (member) => ({
    title: "Cancel this invite?",
    description: `The link sent to ${member.name} stops working straight away. They stay in your list as cancelled, and you can invite them again later.`,
    confirmLabel: "Cancel invite",
    destructive: true,
  }),
  remove: (member) => ({
    title: "Remove from team?",
    description: `${member.name} loses access for good. Things they recorded, like payments, stay in your records and audit log.`,
    confirmLabel: "Remove",
    destructive: true,
  }),
  delete: (member) => ({
    title: "Delete this record?",
    description: `This removes ${member.name}'s closed invitation from the list. The history of it stays in your audit log.`,
    confirmLabel: "Delete",
    destructive: true,
  }),
};

// Actions that change something right away, with the message shown afterwards.
const DIRECT_ACTIONS = {
  resend: (member) => ({ task: () => resendInvite(member.id), message: `New invite sent to ${member.name} (demo).` }),
  reinvite: (member) => ({ task: () => resendInvite(member.id), message: `${member.name} invited again (demo).` }),
  copylink: (member) => ({
    task: async () => {
      const link = getInviteLink(member.id);
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        // The clipboard is unavailable on plain http:// pages, such as a LAN address
        window.prompt("Copy this invite link:", link);
      }
    },
    message: `Invite link for ${member.name} copied. Nothing is emailed in the demo, so share it yourself.`,
  }),

  reactivate: (member) => ({ task: () => setStaffStatus(member.id, "active"), message: `${member.name} reactivated.` }),
};

// Actions that go through a confirmation first, and what they do once confirmed.
const CONFIRMED_ACTIONS = {
  suspend: (member) => ({ task: () => setStaffStatus(member.id, "suspended"), message: `${member.name} suspended.` }),
  cancel: (member) => ({ task: () => cancelInvite(member.id), message: `Invite to ${member.name} cancelled.` }),
  remove: (member) => ({ task: () => removeStaff(member.id), message: `${member.name} removed.` }),
  delete: (member) => ({ task: () => removeStaff(member.id), message: "Record deleted." }),
};

export function StaffTeamCard({ staff }) {
  const [sheet, setSheet] = useState({ open: false, member: null });
  const [detail, setDetail] = useState({ open: false, id: null });
  const [confirm, setConfirm] = useState(null); // { kind, member }
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const counts = teamCounts(staff);
  const rows = filterStaff(staff, { query, filter });
  const filtering = query.trim() !== "" || filter !== "all";

  const filterItems = STAFF_FILTERS.map((item) => ({
    ...item,
    count: item.id === "all" ? staff.length : item.id === "closed" ? counts.closed : counts[item.id],
  }));

  const openInvite = () => setSheet({ open: true, member: null });
  const openEdit = (member) => setSheet({ open: true, member });
  const openDetail = (member) => setDetail({ open: true, id: member.id });
  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  const perform = async (task, message) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
      toast.success(message);
      setConfirm(null);
    } catch (error) {
      toast.error(error.message ?? "Something went wrong. Try again.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  // One entry point for the row menu and the details view.
  const handleAction = (id, member) => {
    if (id === "edit") return openEdit(member);
    if (CONFIRM_COPY[id]) return setConfirm({ kind: id, member });
    const direct = DIRECT_ACTIONS[id]?.(member);
    if (direct) return perform(direct.task, direct.message);
  };

  const confirmAction = () => {
    const { kind, member } = confirm;
    const { task, message } = CONFIRMED_ACTIONS[kind](member);
    return perform(task, message);
  };

  const copy = confirm ? CONFIRM_COPY[confirm.kind](confirm.member) : null;

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
          Demo only: invites never send an email. Use “Copy invite link” on a pending invite and open the link to join
          as that person. Staff sign in at /staff/sign-in with their own account, separate from yours. Roles are saved
          and shown to staff, but this screen does not enforce them yet. In the backend phase the server checks the
          permission on every request.
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
          <>
            <StaffStats counts={counts} />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email or role"
                  aria-label="Search your team"
                  className="pl-9"
                />
              </div>
              <SegmentedControl label="Filter the team" value={filter} onChange={setFilter} items={filterItems} />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No one matches"
                text="Try a different name, or clear the search and filter."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear search and filter
                  </Button>
                }
              />
            ) : (
              <>
                <ul className="divide-y divide-border rounded-sm border border-border">
                  {rows.map((member) => {
                    const status = displayStatus(member);
                    return (
                      <li key={member.id} className="flex items-start gap-3 p-4">
                        <Hex className="size-10">
                          <span className="font-mono text-xs font-bold">{getInitials(member.name)}</span>
                        </Hex>
                        <button
                          type="button"
                          onClick={() => openDetail(member)}
                          aria-label={`View details for ${member.name}`}
                          className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold">{member.name}</span>
                            <Badge variant={STATUS_BADGE_VARIANTS[status]}>{STAFF_STATUS_LABELS[status]}</Badge>
                          </span>
                          <span className="block truncate text-sm text-muted-foreground">{member.email}</span>
                          <span className="label-mono mt-1 block text-muted-foreground">
                            {roleLabel(member.role)} · {activityText(member, status)}
                          </span>
                        </button>
                        <StaffRowMenu member={member} onView={openDetail} onAction={handleAction} />
                      </li>
                    );
                  })}
                </ul>
                {filtering && (
                  <p className="label-mono text-muted-foreground" aria-live="polite">
                    Showing {rows.length} of {staff.length}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </CardContent>

      <StaffSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        member={sheet.member}
      />

      <StaffDetailSheet
        open={detail.open}
        onOpenChange={(open) => setDetail((current) => ({ ...current, open }))}
        memberId={detail.id}
        onAction={(id, member) => {
          // Editing opens a second drawer, so close this one first.
          if (id === "edit") setDetail((current) => ({ ...current, open: false }));
          handleAction(id, member);
        }}
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