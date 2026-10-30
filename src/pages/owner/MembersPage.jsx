import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search, SearchX, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { MemberDetailSheet } from "@/components/members/MemberDetailSheet";
import { MembersList } from "@/components/members/MembersList";
import { MemberSheet } from "@/components/members/MemberSheet";
import { RenewSheet } from "@/components/members/RenewSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { todayISO } from "@/lib/dates";
import { getMemberStatus } from "@/lib/membership";
import { setAccessStatus } from "@/services/memberService";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring soon" },
  { value: "grace", label: "In grace period" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A to Z" },
  { value: "expiry_asc", label: "Expiry: soonest" },
  { value: "expiry_desc", label: "Expiry: latest" },
];

const sorters = {
  newest: (a, b) => b.joinedOn.localeCompare(a.joinedOn) || b.id.localeCompare(a.id),
  name: (a, b) => a.name.localeCompare(b.name),
  expiry_asc: (a, b) => a.expiresOn.localeCompare(b.expiresOn),
  expiry_desc: (a, b) => b.expiresOn.localeCompare(a.expiresOn),
};

const confirmCopy = {
  deactivate: {
    status: "inactive",
    title: "Deactivate member?",
    label: "Deactivate",
    done: "deactivated",
    text: (name) =>
      `${name} will lose access and any access code they hold is revoked. Their records and history stay. You can reactivate them later.`,
  },
  suspend: {
    status: "suspended",
    title: "Suspend access?",
    label: "Suspend",
    done: "suspended",
    text: (name) =>
      `${name} is blocked until you lift the suspension. Their membership dates keep running while suspended.`,
  },
};

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function MembersPage() {
  const { user } = useAuth();
  const db = useDb();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({ query: "", status: "all", plan: "all", sort: "newest" });
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState({ open: false, member: null });
  const [detail, setDetail] = useState({ open: false, id: null }); // live: follows the member's data
  const [renew, setRenew] = useState({ open: false, member: null }); // snapshot taken when opened
  const [confirm, setConfirm] = useState(null); // { member, action }
  const [busy, setBusy] = useState(false);

  const currency = user.gym?.currency ?? "INR";
  const graceDays = user.gym?.graceDays ?? 10;
  const reminderDays = user.gym?.reminderDays ?? 7;
  const today = todayISO();

  // Dashboard quick action links here with ?new=1 to open the add drawer
  useEffect(() => {
    if (searchParams.get("new")) {
      setSheet({ open: true, member: null });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const rows = useMemo(() => {
    const planNames = Object.fromEntries(db.plans.map((plan) => [plan.id, plan.name]));
    return db.members.map((member) => ({
      ...member,
      ...getMemberStatus(member, today, { graceDays, reminderDays }),
      planName: planNames[member.planId] ?? "Unknown plan",
    }));
  }, [db.members, db.plans, today, graceDays, reminderDays]);

  const visible = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (query && ![row.name, row.id, row.phone, row.email].some((v) => v && v.toLowerCase().includes(query))) {
          return false;
        }
        if (filters.plan !== "all" && row.planId !== filters.plan) return false;
        if (filters.status === "all") return true;
        if (filters.status === "expiring") return row.expiringSoon;
        if (filters.status === "grace") return row.inGrace;
        return row.status === filters.status;
      })
      .sort(sorters[filters.sort]);
  }, [rows, filters]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeCount = rows.filter((row) => row.status === "active").length;
  const filtersActive = filters.query || filters.status !== "all" || filters.plan !== "all";
  const detailRow = detail.id ? rows.find((row) => row.id === detail.id) : undefined;

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters((current) => ({ ...current, query: "", status: "all", plan: "all" }));
    setPage(1);
  };

  const openAdd = () => setSheet({ open: true, member: null });
  const openEdit = (member) => setSheet({ open: true, member });
  const openDetail = (member) => setDetail({ open: true, id: member.id });
  const openRenew = (member) => setRenew({ open: true, member });

  const changeStatus = async (member, status, message) => {
    try {
      await setAccessStatus(member.id, status);
      toast.success(message);
    } catch (error) {
      toast.error(error.message ?? "Could not update the member.");
    }
  };

  const runConfirm = async () => {
    const copy = confirmCopy[confirm.action];
    setBusy(true);
    try {
      await setAccessStatus(confirm.member.id, copy.status);
      toast.success(`${confirm.member.name} ${copy.done}.`);
      setConfirm(null);
    } catch (error) {
      toast.error(error.message ?? "Could not update the member.");
    } finally {
      setBusy(false);
    }
  };

  const menuActions = {
    onView: openDetail,
    onRenew: openRenew,
    onEdit: openEdit,
    onDeactivate: (member) => setConfirm({ member, action: "deactivate" }),
    onSuspend: (member) => setConfirm({ member, action: "suspend" }),
    onActivate: (member) => changeStatus(member, "active", `${member.name} reactivated.`),
    onLift: (member) => changeStatus(member, "active", `Suspension lifted for ${member.name}.`),
  };

  const copy = confirm ? confirmCopy[confirm.action] : null;

  return (
    <>
      <title>Members — Gymio</title>

      <PageHeader
        title="Members"
        description={
          rows.length > 0
            ? `${rows.length} members · ${activeCount} active`
            : "Add, search and manage your members."
        }
        actions={
          <Button size="lg" onClick={openAdd}>
            <UserPlus aria-hidden="true" />
            Add member
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Users}
          title="No members yet"
          text="Add your first member to start tracking memberships, expiry dates and payments."
          action={
            <Button onClick={openAdd}>
              <UserPlus aria-hidden="true" />
              Add your first member
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search members"
                placeholder="Search name, ID, phone or email"
                value={filters.query}
                onChange={(event) => setFilter("query", event.target.value)}
                className="h-10 pl-9"
              />
            </div>
            <FilterSelect label="Filter by status" value={filters.status} onChange={(v) => setFilter("status", v)} options={statusOptions} />
            <FilterSelect
              label="Filter by plan"
              value={filters.plan}
              onChange={(v) => setFilter("plan", v)}
              options={[{ value: "all", label: "All plans" }, ...db.plans.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <FilterSelect label="Sort members" value={filters.sort} onChange={(v) => setFilter("sort", v)} options={sortOptions} />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              text="No members fit these filters."
              action={
                filtersActive ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <MembersList rows={pageRows} menuActions={menuActions} />
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={visible.length}
                onPageChange={setPage}
                label="members"
              />
            </>
          )}
        </div>
      )}

      <MemberSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        member={sheet.member}
        plans={db.plans}
        currency={currency}
      />

      <MemberDetailSheet
        open={detail.open}
        onOpenChange={(open) => setDetail((current) => ({ ...current, open }))}
        row={detailRow}
        currency={currency}
        onEdit={(member) => {
          setDetail((current) => ({ ...current, open: false }));
          openEdit(member);
        }}
        onRenew={(member) => {
          setDetail((current) => ({ ...current, open: false }));
          openRenew(member);
        }}
      />

      <RenewSheet
        open={renew.open}
        onOpenChange={(open) => setRenew((current) => ({ ...current, open }))}
        member={renew.member}
        plans={db.plans}
        currency={currency}
        graceDays={graceDays}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title={copy?.title ?? ""}
        description={confirm ? copy.text(confirm.member.name) : ""}
        confirmLabel={copy?.label}
        destructive
        loading={busy}
        onConfirm={runConfirm}
      />
    </>
  );
}