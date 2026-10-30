import { useMemo, useState } from "react";
import { Plus, Ticket } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlanCard } from "@/components/memberships/PlanCard";
import { PlanSheet } from "@/components/memberships/PlanSheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { approxDays } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { setPlanStatus } from "@/services/planService";

const FILTERS = [
  { id: "active", label: "Active" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];

export default function PlansPage() {
  const { user } = useAuth();
  const db = useDb();

  const [filter, setFilter] = useState("active");
  const [sheet, setSheet] = useState({ open: false, plan: null });
  const [confirm, setConfirm] = useState(null); // the plan about to be archived
  const [busy, setBusy] = useState(false);

  const currency = user.gym?.currency ?? "INR";

  const memberCounts = useMemo(() => {
    const counts = {};
    for (const member of db.members) counts[member.planId] = (counts[member.planId] ?? 0) + 1;
    return counts;
  }, [db.members]);

  const activeCount = db.plans.filter((plan) => plan.status === "active").length;
  const archivedCount = db.plans.length - activeCount;
  const countFor = { active: activeCount, archived: archivedCount, all: db.plans.length };

  const visible = useMemo(
    () =>
      db.plans
        .filter((plan) => filter === "all" || plan.status === filter)
        .sort((a, b) => approxDays(a.duration) - approxDays(b.duration) || a.name.localeCompare(b.name)),
    [db.plans, filter],
  );

  const openCreate = () => setSheet({ open: true, plan: null });
  const openEdit = (plan) => setSheet({ open: true, plan });

  const runArchive = async () => {
    setBusy(true);
    try {
      await setPlanStatus(confirm.id, "archived");
      toast.success(`${confirm.name} archived.`);
      setConfirm(null);
    } catch (error) {
      toast.error(error.message ?? "Could not archive the plan.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async (plan) => {
    try {
      await setPlanStatus(plan.id, "active");
      toast.success(`${plan.name} restored.`);
    } catch (error) {
      toast.error(error.message ?? "Could not restore the plan.");
    }
  };

  const confirmMembers = confirm ? (memberCounts[confirm.id] ?? 0) : 0;
  const confirmText = confirm
    ? [
        confirmMembers > 0
          ? `${confirmMembers} ${confirmMembers === 1 ? "member is" : "members are"} on this plan and keep their current membership.`
          : null,
        "It can no longer be given to new members or offered at renewal. You can restore it any time.",
        activeCount === 1
          ? "This is your only active plan, so you cannot add members until you create or restore one."
          : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <>
      <title>Plans — Gymio</title>

      <PageHeader
        title="Plans"
        description={
          db.plans.length > 0
            ? `${activeCount} active · ${archivedCount} archived`
            : "Create the membership plans you sell."
        }
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus aria-hidden="true" />
            New plan
          </Button>
        }
      />

      {db.plans.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Ticket}
          title="No plans yet"
          text="Create a plan, such as Monthly or Quarterly, before adding members."
          action={
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" />
              Create your first plan
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-6">
          <div role="group" aria-label="Filter plans" className="inline-flex rounded-sm border border-foreground p-0.5">
            {FILTERS.map(({ id, label }) => {
              const active = id === filter;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(id)}
                  className={cn(
                    "h-8 rounded-sm px-3 font-mono text-xs font-bold tracking-widest uppercase transition-colors",
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label} ({countFor[id]})
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={filter === "archived" ? "No archived plans" : "No active plans"}
              text={
                filter === "archived"
                  ? "Plans you archive show up here and can be restored."
                  : "Create a plan or restore an archived one."
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((plan) => (
                <li key={plan.id}>
                  <PlanCard
                    plan={plan}
                    currency={currency}
                    memberCount={memberCounts[plan.id] ?? 0}
                    onEdit={openEdit}
                    onArchive={setConfirm}
                    onRestore={restore}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <PlanSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        plan={sheet.plan}
        currency={currency}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title="Archive plan?"
        description={confirmText}
        confirmLabel="Archive"
        destructive
        loading={busy}
        onConfirm={runArchive}
      />
    </>
  );
}