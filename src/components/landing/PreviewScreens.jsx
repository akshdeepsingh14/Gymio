import { useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  House,
  Megaphone,
  Plus,
  QrCode,
  Receipt,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader } from "@/components/ui/card";
import { LogoMark } from "@/components/common/Logo";
import {
  accessRequests,
  attention,
  feedPosts,
  gym,
  kpis,
  memberFilters,
  memberPass,
  members,
  methodSplit,
  navItems,
  paymentSummary,
  payments,
  revenue,
  rupees,
  statusMeta,
  toneDot,
  weekday,
} from "@/data/previewData";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Everything here is sample data, drawn at a fixed design size and
   scaled to fit its device frame by <Screen> in DashboardPreview.jsx.

   The owner dashboard uses container queries (@3xl = 48rem):
     wide container  -> sidebar + wide cards   (laptop frame, 1200px)
     narrow container -> top bar + bottom tabs (phone frame, 390px)
------------------------------------------------------------------- */

const LABEL =
  "font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

const TABLE_HEAD =
  "border-b border-border bg-muted/50 px-4 py-2 " + LABEL;

function Avatar({ initials }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-sm bg-muted font-mono text-[11px] font-semibold @3xl:size-8"
    >
      {initials}
    </span>
  );
}

function ViewTitle({ title, sub, children }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-[28px] font-extrabold uppercase leading-none @3xl:text-[34px]">
          {title}
        </p>
        <p className="mt-1 truncate text-[12px] text-muted-foreground @3xl:text-[13px]">
          {sub}
        </p>
      </div>
      {children}
    </div>
  );
}

function StatusLabel({ status }) {
  const meta = statusMeta[status];

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[12px] font-medium">
      <span aria-hidden="true" className={cn("size-2 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ==================================================================
   OWNER DASHBOARD
================================================================== */

/* ---------- Overview ---------- */
function Overview({ requests, onResolve, onNavigate }) {
  const stats = kpis.map((item) =>
    item.label === "Awaiting approval"
      ? {
          ...item,
          value: String(requests.length),
          note: requests.length ? "Access requests" : "All caught up",
        }
      : item
  );

  const attentionItems = [
    ...attention.filter((item) => item.tone !== "info"),
    ...(requests.length
      ? [
          {
            name: `${requests.length} access request${requests.length === 1 ? "" : "s"}`,
            note: "Waiting for your approval",
            tone: "info",
          },
        ]
      : []),
  ];

  const max = Math.max(...revenue.values);

  return (
    <div className="flex h-full flex-col gap-3 @3xl:gap-4">
      <div>
        <p className={LABEL}>{weekday} overview</p>
        <p className="mt-1 font-display text-[28px] font-extrabold uppercase leading-none @3xl:text-[38px]">
          Good morning, {gym.ownerFirstName}
        </p>
      </div>

      {/* Quick numbers */}
      <ul className="grid grid-cols-2 gap-2.5 @3xl:grid-cols-4 @3xl:gap-4">
        {stats.map((item) => (
          <li key={item.label}>
            <Card size="sm" className="h-full">
              <CardContent>
                <p className="text-[12px] text-muted-foreground @3xl:text-[13px]">
                  {item.label}
                </p>
                <p className="mt-1.5 font-display text-[32px] font-extrabold leading-none tabular-nums @3xl:text-[40px]">
                  {item.value}
                </p>
                <p className="mt-1.5 hidden text-[12px] text-muted-foreground @3xl:block">
                  {item.note}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {/* Revenue and needs attention */}
      <div className="grid gap-3 @3xl:grid-cols-5 @3xl:gap-4">
        <Card size="sm" className="@3xl:col-span-3">
          <CardHeader>
            <p className="text-[12px] text-muted-foreground @3xl:text-[13px]">
              Revenue · this month
            </p>
            <p className="font-display text-[32px] font-extrabold leading-none @3xl:text-[40px]">
              {revenue.total}
            </p>
            <CardAction>
              <Badge variant="outline" className="gap-1">
                <TrendingUp aria-hidden="true" />
                {revenue.change}
              </Badge>
            </CardAction>
          </CardHeader>

          <CardContent>
            <div
              role="img"
              aria-label={`Monthly revenue in lakh rupees: ${revenue.months
                .map((month, i) => `${month} ${revenue.values[i]}`)
                .join(", ")}`}
              className="mt-2 flex h-[56px] items-end gap-2 @3xl:h-[96px] @3xl:gap-3"
            >
              {revenue.values.map((value, index) => {
                const isLast = index === revenue.values.length - 1;

                return (
                  <div
                    key={revenue.months[index]}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span
                      className={cn(
                        "hidden font-mono text-[10px] @3xl:block",
                        isLast ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      ₹{value.toFixed(1)}L
                    </span>
                    <div
                      className={cn("w-full flex-none", isLast ? "bg-foreground" : "bg-foreground/20")}
                      style={{ height: `${(value / max) * 80}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div aria-hidden="true" className="mt-1.5 flex gap-2 @3xl:gap-3">
              {revenue.months.map((month) => (
                <span key={month} className="flex-1 text-center text-[11px] text-muted-foreground">
                  {month}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="@3xl:col-span-2">
          <CardHeader>
            <p className={LABEL}>Needs attention</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {attentionItems.map((item) => (
                <li key={item.name} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", toneDot[item.tone])}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{item.name}</p>
                    <p className="text-[12px] text-muted-foreground">{item.note}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              className="mt-3 h-9 w-full text-[13px]"
              onClick={() => onNavigate("renewals")}
            >
              Review renewals
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wide only: recent payments and access requests */}
      <div className="hidden gap-4 @3xl:grid @3xl:grid-cols-5">
        <Card size="sm" className="col-span-3">
          <CardHeader>
            <p className={LABEL}>Recent payments</p>
            <CardAction>
              <button
                type="button"
                onClick={() => onNavigate("payments")}
                className="text-[12px] font-semibold underline underline-offset-4 hover:text-muted-foreground"
              >
                View all
              </button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {payments.slice(0, 3).map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 py-1.5">
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {payment.member}
                    <span className="ml-2 font-normal text-muted-foreground">{payment.plan}</span>
                  </p>
                  <Badge variant="outline">{payment.method}</Badge>
                  <span className="w-16 text-right text-[13px] font-semibold tabular-nums">
                    {rupees(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card size="sm" className="col-span-2">
          <CardHeader>
            <p className={LABEL}>Awaiting approval</p>
          </CardHeader>
          <CardContent>
            {requests.length ? (
              <ul className="space-y-1.5">
                {requests.map((request) => (
                  <li key={request.name} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{request.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{request.note}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Approve ${request.name}`}
                      onClick={() => onResolve(request.name, true)}
                    >
                      <Check aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Reject ${request.name}`}
                      onClick={() => onResolve(request.name, false)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-[13px] text-muted-foreground">
                All caught up. No access requests are waiting.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Members ---------- */
function MembersView() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const active = memberFilters.find((item) => item.key === filter);
  const needle = query.trim().toLowerCase();

  const rows = members.filter(
    (member) =>
      (!active.statuses || active.statuses.includes(member.status)) &&
      member.name.toLowerCase().includes(needle)
  );

  const columns = "grid-cols-[1fr_auto] @3xl:grid-cols-[2.4fr_1fr_1.3fr_1fr]";

  return (
    <div className="flex h-full flex-col gap-2.5 @3xl:gap-3">
      <ViewTitle title="Members" sub={`${rows.length} shown · 248 in total`}>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 px-3 text-[13px]"
          onClick={() =>
            toast("Add member", { description: "Sample data. The real form opens here." })
          }
        >
          <Plus aria-hidden="true" />
          Add<span className="hidden @3xl:inline"> member</span>
        </Button>
      </ViewTitle>

      <div className="flex flex-col gap-2.5 @3xl:flex-row @3xl:items-center">
        <label className="relative block @3xl:w-72">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            aria-label="Search sample members"
            // 16px keeps iPhones from zooming the page when the field is focused
            className="h-10 w-full rounded-sm border border-border bg-transparent pl-9 pr-3 text-[16px] outline-none placeholder:text-muted-foreground focus-visible:border-foreground"
          />
        </label>

        <div role="group" aria-label="Filter by status" className="flex gap-2">
          {memberFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "h-9 rounded-sm border px-3 text-[12px] font-semibold transition-colors",
                filter === item.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border">
        <div className={cn("hidden gap-3 @3xl:grid", columns, TABLE_HEAD)}>
          <span>Member</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Expires</span>
        </div>

        {rows.length ? (
          <ul className="divide-y divide-border">
            {rows.map((member) => (
              <li
                key={member.id}
                className={cn("grid items-center gap-3 px-3 py-2 @3xl:px-4 @3xl:py-1.5", columns)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={member.initials} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{member.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      <span className="@3xl:hidden">
                        {member.plan} · ends {member.expires}
                      </span>
                      <span className="hidden font-mono @3xl:inline">{member.id}</span>
                    </p>
                  </div>
                </div>

                <span className="hidden text-[13px] @3xl:block">{member.plan}</span>

                <StatusLabel status={member.status} />

                <span className="hidden @3xl:block">
                  <span className="block text-[13px]">{member.expires}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {member.expiresNote}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            No members match. Try a different name or filter.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Payments ---------- */
function PaymentsView() {
  const columns =
    "grid-cols-[1fr_auto] @3xl:grid-cols-[0.8fr_1.8fr_0.8fr_1.2fr_0.9fr_88px]";

  return (
    <div className="flex h-full flex-col gap-2.5 @3xl:gap-4">
      <ViewTitle title="Payments" sub="Recorded by the gym, not verified by a bank" />

      <div className="grid grid-cols-3 gap-2.5 @3xl:grid-cols-4 @3xl:gap-4">
        {paymentSummary.map((item) => (
          <Card key={item.label} size="sm">
            <CardContent>
              <p className="text-[12px] text-muted-foreground @3xl:text-[13px]">{item.label}</p>
              <p className="mt-1 font-display text-[24px] font-extrabold leading-none tabular-nums @3xl:text-[34px]">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card size="sm" className="col-span-3 @3xl:col-span-1">
          <CardContent>
            <p className="text-[12px] text-muted-foreground @3xl:text-[13px]">Payment methods</p>
            <div
              role="img"
              aria-label={`UPI ${methodSplit.upi} percent, cash ${methodSplit.cash} percent`}
              className="mt-2.5 flex h-2.5 overflow-hidden"
            >
              <span className="bg-foreground" style={{ flex: methodSplit.upi }} />
              <span className="bg-foreground/30" style={{ flex: methodSplit.cash }} />
            </div>
            <p className="mt-2 flex justify-between font-mono text-[11px]">
              <span>UPI {methodSplit.upi}%</span>
              <span className="text-muted-foreground">Cash {methodSplit.cash}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border">
        <div className={cn("hidden gap-3 @3xl:grid", columns, TABLE_HEAD)}>
          <span>Receipt</span>
          <span>Member</span>
          <span>Method</span>
          <span>When</span>
          <span className="text-right">Amount</span>
          <span />
        </div>

        <ul className="divide-y divide-border">
          {payments.map((payment, index) => (
            <li
              key={payment.id}
              className={cn(
                "grid items-center gap-3 px-3 py-2 @3xl:px-4 @3xl:py-1.5",
                columns,
                // The phone has less height, so it shows six rows
                index > 5 && "@max-3xl:hidden"
              )}
            >
              <span className="hidden font-mono text-[12px] @3xl:block">{payment.id}</span>

              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{payment.member}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  <span className="@3xl:hidden">
                    {payment.plan} · {payment.method} · {payment.when}
                  </span>
                  <span className="hidden @3xl:inline">{payment.plan}</span>
                </p>
              </div>

              <span className="hidden @3xl:block">
                <Badge variant="outline">{payment.method}</Badge>
              </span>

              <span className="hidden text-[13px] text-muted-foreground @3xl:block">
                {payment.when}
              </span>

              <span className="text-right text-[14px] font-semibold tabular-nums">
                {rupees(payment.amount)}
              </span>

              <span className="hidden justify-end @3xl:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[12px]"
                  onClick={() =>
                    toast(`Receipt ${payment.id}`, {
                      description: "Sample data. The real app opens a PDF here.",
                    })
                  }
                >
                  Receipt
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Renewals ---------- */
const GRACE_DAYS = 10;

function RenewalsView({ sent, onRemind, onRemindAll }) {
  const groups = [
    {
      key: "week",
      label: "Expiring this week",
      items: members.filter((m) => m.offset >= 0 && m.offset <= 7),
    },
    {
      key: "grace",
      label: "In grace period",
      items: members.filter((m) => m.status === "grace"),
    },
    {
      key: "later",
      label: "Later this month",
      items: members.filter((m) => m.offset > 7 && m.offset <= 30),
    },
  ];

  const everyone = groups.flatMap((group) => group.items);
  const unsent = everyone.filter((member) => !sent.has(member.name));

  return (
    <div className="flex h-full flex-col gap-2.5 @3xl:gap-4">
      <ViewTitle title="Renewals" sub={`${GRACE_DAYS}-day grace period after expiry`}>
        <Button
          type="button"
          size="sm"
          className="h-9 gap-1.5 px-3 text-[13px]"
          disabled={unsent.length === 0}
          onClick={() => onRemindAll(unsent.map((member) => member.name))}
        >
          <BellRing aria-hidden="true" />
          Remind all
        </Button>
      </ViewTitle>

      <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-border">
        <ul>
          {groups.map((group) => (
            <li key={group.key}>
              <div
                className={cn(
                  "flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2",
                  LABEL
                )}
              >
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </div>

              <ul className="divide-y divide-border border-b border-border last:border-b-0">
                {group.items.map((member) => {
                  const isSent = sent.has(member.name);
                  const graceLeft = GRACE_DAYS - Math.abs(member.offset);

                  return (
                    <li key={member.id} className="flex items-center gap-3 px-3 py-2 @3xl:px-4">
                      <Avatar initials={member.initials} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{member.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {member.status === "grace"
                            ? `Ended ${member.expires} · ${graceLeft} days of grace left`
                            : `${member.plan} · ends ${member.expires} (${member.expiresNote})`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={isSent ? "ghost" : "outline"}
                        size="sm"
                        disabled={isSent}
                        className="h-8 gap-1.5 px-3 text-[12px]"
                        onClick={() => onRemind(member.name)}
                      >
                        {isSent ? (
                          <>
                            <Check aria-hidden="true" />
                            Sent
                          </>
                        ) : (
                          <>
                            <BellRing aria-hidden="true" />
                            Remind
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Shell: sidebar, top bar, bottom tabs ---------- */
function TopBar({ title, pending }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 pb-3 pt-[54px] @3xl:px-7 @3xl:py-3.5">
      {/* Phone: brand. Laptop: where you are. */}
      <div className="flex items-center gap-2.5 @3xl:hidden">
        <LogoMark decorative className="size-8" />
        <span className="font-display text-[22px] font-extrabold uppercase leading-none">
          Gymio
        </span>
      </div>
      <p className={cn("hidden @3xl:block", LABEL)}>
        {gym.name} / {title}
      </p>

      <div aria-hidden="true" className="flex items-center gap-2.5">
        <span className="relative grid size-9 place-items-center rounded-sm border border-border">
          <Bell className="size-[17px]" />
          {pending > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-foreground" />
          )}
        </span>
        <span className="grid size-9 place-items-center rounded-sm bg-primary font-mono text-[12px] font-bold text-primary-foreground">
          {gym.ownerInitials}
        </span>
      </div>
    </div>
  );
}

export function OwnerApp() {
  const [view, setView] = useState("overview");
  const [requests, setRequests] = useState(accessRequests);
  const [sent, setSent] = useState(() => new Set());

  const current = navItems.find((item) => item.id === view);

  const resolveRequest = (name, approved) => {
    setRequests((list) => list.filter((request) => request.name !== name));
    toast(approved ? `${name} approved` : `${name} rejected`, {
      description: "Sample data. Nothing was saved.",
    });
  };

  const remind = (name) => {
    setSent((prev) => new Set(prev).add(name));
    toast.success(`Reminder queued for ${name}`, {
      description: "This is a demo. Nothing is actually sent.",
    });
  };

  const remindAll = (names) => {
    setSent((prev) => new Set([...prev, ...names]));
    toast.success(`${names.length} reminders queued`, {
      description: "This is a demo. Nothing is actually sent.",
    });
  };

  return (
    <div className="@container size-full">
      <div className="relative flex size-full flex-col overflow-hidden bg-background text-foreground @3xl:flex-row">
        {/* Phone only: the camera cut-out of the iPhone frame */}
        <div
          aria-hidden="true"
          className="absolute left-[133px] top-[11px] z-10 h-[37px] w-[124px] rounded-full bg-black @3xl:hidden"
        />

        {/* Laptop only: sidebar */}
        <aside className="hidden w-[216px] shrink-0 flex-col border-r border-border p-5 @3xl:flex">
          <div className="flex items-center gap-3">
            <LogoMark decorative className="size-9" />
            <span className="font-display text-[26px] font-extrabold uppercase leading-none">
              Gymio
            </span>
          </div>

          <nav aria-label="Sample dashboard sections" className="mt-8">
            <ul className="space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => {
                const isActive = view === id;

                return (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setView(id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-[14px] font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-[18px]" />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto border-t border-border pt-4">
            <p className={LABEL}>Your gym</p>
            <p className="mt-1.5 text-[14px] font-semibold">{gym.name}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{gym.owner}</p>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar title={current.label} pending={requests.length} />

          <div className="min-h-0 flex-1 overflow-hidden px-5 pb-3 pt-3 @3xl:px-7 @3xl:pb-6 @3xl:pt-4">
            {view === "overview" && (
              <Overview requests={requests} onResolve={resolveRequest} onNavigate={setView} />
            )}
            {view === "members" && <MembersView />}
            {view === "payments" && <PaymentsView />}
            {view === "renewals" && (
              <RenewalsView sent={sent} onRemind={remind} onRemindAll={remindAll} />
            )}
          </div>

          {/* Phone only: bottom tabs */}
          <nav
            aria-label="Sample dashboard sections"
            className="grid shrink-0 grid-cols-4 border-t border-border bg-background px-2 pb-6 @3xl:hidden"
          >
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = view === id;

              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setView(id)}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("mb-0.5 h-0.5 w-6 bg-foreground", isActive ? "opacity-100" : "opacity-0")}
                  />
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   MEMBER PORTAL (iPhone, 389.5 x 843.5)
================================================================== */
function RingProgress() {
  // r = 40, so the circumference is about 251.3
  const circumference = 251.3;
  const filled = circumference * (memberPass.daysLeft / memberPass.totalDays);

  return (
    <div className="relative size-[116px] shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="11" style={{ stroke: "var(--muted)" }} />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="11"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ stroke: "var(--brand)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-[40px] font-extrabold leading-none tabular-nums">
            {memberPass.daysLeft}
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            days left
          </p>
        </div>
      </div>
    </div>
  );
}

export function MemberApp() {
  return (
    <div className="relative size-full bg-background text-foreground">
      {/* Camera cut-out */}
      <div className="absolute left-[133px] top-[11px] h-[37px] w-[124px] rounded-full bg-black" />

      <div className="px-5 pt-[68px]">
        <p className="text-[12px] uppercase tracking-widest text-muted-foreground">Welcome back</p>
        <p className="mt-1 font-display text-[40px] font-extrabold uppercase leading-none">
          {memberPass.name}
        </p>

        {/* Validity */}
        <div className="mt-5 flex items-center gap-4 rounded-sm border border-foreground/40 bg-foreground/10 p-4">
          <RingProgress />
          <div className="min-w-0">
            <p className="text-[13px] text-muted-foreground">{memberPass.plan}</p>
            <p className="mt-0.5 text-[15px] font-semibold">Valid until</p>
            <p className="font-display text-[26px] font-extrabold leading-tight tabular-nums">
              {memberPass.validUntil}
            </p>
          </div>
        </div>

        {/* Pass */}
        <div className="mt-3 flex items-center justify-between rounded-sm border border-border bg-card p-4">
          <div>
            <p className="text-[12px] text-muted-foreground">Member ID</p>
            <p className="mt-0.5 font-mono text-[15px] font-semibold">{memberPass.id}</p>
          </div>
          <QrCode className="size-10" />
        </div>

        {/* History */}
        <p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          Payment history
        </p>
        <ul className="divide-y divide-border">
          {memberPass.history.map((payment) => (
            <li key={payment.date} className="flex items-center gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-muted">
                <Receipt className="size-[18px] text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{payment.label}</p>
                <p className="text-[12px] text-muted-foreground">{payment.date}</p>
              </div>
              <span className="text-[15px] font-semibold tabular-nums">{rupees(payment.amount)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-sm bg-primary py-3.5 text-center text-[15px] font-semibold text-primary-foreground">
          Renew plan
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   GYM FEED (Android, 360 x 800)
================================================================== */
export function FeedApp() {
  return (
    <div className="relative size-full bg-background text-foreground">
      {/* Camera dot */}
      <div className="absolute left-[171px] top-[5px] size-[18px] rounded-full bg-black" />

      <div className="px-5 pt-[46px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-widest text-muted-foreground">Gym feed</p>
            <p className="mt-1 font-display text-[34px] font-extrabold uppercase leading-none">
              Iron Forge
            </p>
          </div>
          <Megaphone className="size-6" />
        </div>

        <div className="mt-4 flex gap-2">
          <Badge className="h-7 px-3 text-[12px]">All</Badge>
          <Badge variant="outline" className="h-7 px-3 text-[12px]">
            Timings
          </Badge>
          <Badge variant="outline" className="h-7 px-3 text-[12px]">
            Events
          </Badge>
        </div>

        <ul className="mt-4 space-y-3">
          {feedPosts.map((post) => (
            <li key={post.title} className="overflow-hidden rounded-sm border border-border bg-card">
              <div className="bg-stripes h-12 bg-muted text-foreground/40" />
              <div className="p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-[22px] font-extrabold uppercase leading-none">
                    {post.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{post.time}</span>
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">{post.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 border-t border-border bg-background py-3 text-center text-[11px] text-muted-foreground">
        <span className="flex flex-col items-center gap-1 text-foreground">
          <House className="size-5" />
          Feed
        </span>
        <span className="flex flex-col items-center gap-1">
          <Receipt className="size-5" />
          Receipts
        </span>
        <span className="flex flex-col items-center gap-1">
          <QrCode className="size-5" />
          Pass
        </span>
      </div>
    </div>
  );
}