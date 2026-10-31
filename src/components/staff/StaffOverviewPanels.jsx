import { Link } from "react-router";
import { CalendarCheck, History, KeyRound, Megaphone, ReceiptText, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Panel, PanelLink } from "@/components/common/Panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatShortDate } from "@/lib/dates";
import { formatMoney, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const rowClass = "flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0";

const ACTIONS = [
  { permission: "members.manage", to: "/staff/members?new=1", label: "Add member", icon: UserPlus },
  { permission: "payments.record", to: "/staff/payments?new=1", label: "Record payment", icon: ReceiptText },
  { permission: "access.review", to: "/staff/access-requests", label: "Review requests", icon: KeyRound },
  { permission: "updates.publish", to: "/staff/updates", label: "Publish update", icon: Megaphone },
];

/** Only the shortcuts this person is allowed to use. */
export function StaffQuickActions({ can }) {
  const actions = ACTIONS.filter((action) => can(action.permission));
  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Quick actions" role="group">
      {actions.map(({ to, label, icon: Icon }, index) => (
        <Link
          key={to}
          to={to}
          className={cn(buttonVariants({ variant: index === 0 ? "default" : "outline" }), "h-10 gap-2 px-4")}
        >
          <Icon aria-hidden="true" />
          {label}
        </Link>
      ))}
    </div>
  );
}

function RenewalBadge({ item }) {
  if (item.inGrace) return <Badge variant="destructive">Grace · {Math.abs(item.daysLeft)}d late</Badge>;
  if (item.daysLeft === 0) return <Badge>Today</Badge>;
  return <Badge variant="outline">{item.daysLeft}d left</Badge>;
}

export function StaffRenewals({ items }) {
  const visible = items.slice(0, 6);

  return (
    <Panel
      title="Upcoming renewals"
      description="Due within 14 days, or inside the grace period"
      action={<PanelLink to="/staff/members">Members</PanelLink>}
    >
      {visible.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Nothing due" text="No memberships end in the next 14 days." />
      ) : (
        <ul>
          {visible.map((item) => (
            <li key={item.id} className={rowClass}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className="label-mono mt-1 text-muted-foreground">
                  {item.id} · {formatShortDate(item.expiresOn)}
                </p>
              </div>
              <RenewalBadge item={item} />
            </li>
          ))}
        </ul>
      )}
      {items.length > visible.length && <p className="mt-3 text-xs text-muted-foreground">+{items.length - visible.length} more</p>}
    </Panel>
  );
}

export function StaffRecentMembers({ items }) {
  return (
    <Panel title="New members" action={<PanelLink to="/staff/members">All members</PanelLink>}>
      {items.length === 0 ? (
        <EmptyState icon={UserPlus} title="No members yet" text="New sign-ups will appear here." />
      ) : (
        <ul>
          {items.map((member) => (
            <li key={member.id} className={rowClass}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{member.name}</p>
                <p className="label-mono mt-1 text-muted-foreground">{[member.id, member.locality].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{formatDate(member.joinedOn)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function StaffRecentPayments({ items, currency }) {
  return (
    <Panel title="Recent payments" action={<PanelLink to="/staff/payments">All payments</PanelLink>}>
      {items.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No payments yet" text="Recorded payments will show up here." />
      ) : (
        <ul>
          {items.map((payment) => (
            <li key={payment.id} className={rowClass}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{payment.memberName}</p>
                <p className="label-mono mt-1 text-muted-foreground">
                  {payment.receiptNo} · {payment.methodLabel} · {formatShortDate(payment.date)}
                </p>
              </div>
              <p className="shrink-0 font-mono text-sm font-semibold">{formatMoney(payment.amount, currency)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function StaffRequests({ items }) {
  return (
    <Panel
      title="Pending requests"
      description="Members waiting for approval"
      action={<PanelLink to="/staff/access-requests">Review</PanelLink>}
    >
      {items.length === 0 ? (
        <EmptyState icon={KeyRound} title="All clear" text="No members are waiting for access." />
      ) : (
        <ul>
          {items.map((request) => (
            <li key={request.id} className={rowClass}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{request.memberName}</p>
                <p className="label-mono mt-1 text-muted-foreground">{request.memberId}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">{timeAgo(request.requestedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function StaffActivity({ items }) {
  return (
    <Panel title="Recent activity" description="Payments and access decisions you can see">
      {items.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" text="Payments and decisions will be listed here." />
      ) : (
        <ul>
          {items.map((entry) => (
            <li key={entry.id} className={rowClass}>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{entry.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                <p className="label-mono mt-1 text-muted-foreground">By {entry.by}</p>
              </div>
              <p className="shrink-0 self-start text-xs text-muted-foreground">{timeAgo(entry.at)}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function StaffAnnouncements({ items, canManage }) {
  return (
    <Panel title="Gym updates" action={canManage ? <PanelLink to="/staff/updates">Manage</PanelLink> : undefined}>
      {items.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nothing published" text="Gym announcements appear here." />
      ) : (
        <ul className="grid gap-6">
          {items.map((post) => (
            <li key={post.id} className="border-l-2 border-foreground pl-4">
              <p className="label-mono text-muted-foreground">{formatDate(post.publishedOn)}</p>
              <p className="mt-2 font-semibold">{post.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}