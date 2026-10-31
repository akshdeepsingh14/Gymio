import { Pencil, RefreshCw, Wallet } from "lucide-react";

import { CredentialPanel } from "@/components/members/CredentialPanel";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { ManualEntryTag } from "@/components/payments/ManualEntryTag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { paymentMethodOptions } from "@/data/options";
import { useDb } from "@/hooks/useDb";
import { usePermissions } from "@/hooks/usePermissions";
import { describeActor } from "@/lib/attribution";
import { auditMeta, describeAudit } from "@/lib/auditLog";
import { formatDate, formatShortDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { memberActivity } from "@/lib/memberActivity";
import { isCounted, MANUAL_ENTRY_NOTE } from "@/lib/payments";
import { describeDaysLeft } from "@/lib/renewal";
import { formatDateTime } from "@/lib/security";
import { cn } from "@/lib/utils";

const methodLabels = Object.fromEntries(paymentMethodOptions.map((option) => [option.value, option.label]));
const ACTIVITY_LIMIT = 10;

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

function buildPeriods(row, payments, planNames) {
  const periods = payments.map((p) => ({
    key: p.id,
    plan: planNames[p.planId] ?? "Unknown plan",
    start: p.periodStart,
    end: p.periodEnd,
    unpaid: false,
  }));
  if (row.paymentStatus === "pending") {
    periods.push({ key: "unpaid", plan: row.planName, start: row.joinedOn, end: row.expiresOn, unpaid: true });
  }
  return periods.sort((a, b) => b.start.localeCompare(a.start));
}

function periodState(period, today) {
  if (period.unpaid) return { label: "Unpaid", variant: "destructive" };
  if (period.start > today) return { label: "Upcoming", variant: "secondary" };
  if (period.end >= today) return { label: "Current", variant: "default" };
  return { label: "Ended", variant: "outline" };
}

export function MemberDetailSheet({ open, onOpenChange, row, currency, onRenew, onEdit }) {
  const db = useDb();
  const { can } = usePermissions();
  const today = todayISO();

  const canManage = can("members.manage");
  const canSeePayments = can("payments.view");
  const canCollect = can("payments.record");

  const planNames = Object.fromEntries(db.plans.map((plan) => [plan.id, plan.name]));
  const payments = row
    ? db.payments
        .filter((p) => p.memberId === row.id)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }))
    : [];
  // Membership periods come from payment dates only. Amounts are shown only to people who may see payments.
  const periods = row ? buildPeriods(row, payments.filter(isCounted), planNames) : []; // voided payments cover no period
  const activity = row ? memberActivity(db.auditLog, row.id, { includePayments: canSeePayments }) : [];
  const canRenew = Boolean(row) && row.accessStatus !== "inactive" && canCollect;
  const collecting = row?.paymentStatus === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{row?.name ?? "Member"}</SheetTitle>
          <SheetDescription>{row ? `${row.id} · Joined ${formatDate(row.joinedOn)}` : ""}</SheetDescription>
        </SheetHeader>

        {row && (
          <>
            <div className="flex-1 space-y-8 overflow-y-auto p-5">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <MemberStatusBadge {...row} />
                  {row.paymentStatus === "pending" && <Badge variant="destructive">Unpaid</Badge>}
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Plan">{row.planName}</Field>
                  <Field label="Expires">
                    {formatDate(row.expiresOn)}
                    <span className="block text-xs text-muted-foreground">{describeDaysLeft(row.daysLeft)}</span>
                  </Field>
                  <Field label="Phone">{row.phone}</Field>
                  <Field label="Email">{row.email}</Field>
                  <Field label="Locality">{row.locality}</Field>
                  <Field label="Access">
                    {row.accessStatus === "active" ? "On" : row.accessStatus === "suspended" ? "Suspended" : "Deactivated"}
                  </Field>
                </dl>
                {row.notes && (
                  <div>
                    <p className="label-mono text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{row.notes}</p>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <SectionTitle>Record</SectionTitle>
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Added by">{describeActor(row.createdBy, "Not recorded")}</Field>
                  <Field label="Last edited by">
                    {row.updatedBy ? describeActor(row.updatedBy) : "Not edited yet"}
                    {row.updatedAt && (
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(row.updatedAt.slice(0, 10))}
                      </span>
                    )}
                  </Field>
                </dl>
              </section>

              {canManage && <CredentialPanel member={row} />}

              <section className="space-y-3">
                <SectionTitle>Membership history</SectionTitle>
                {periods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No membership periods recorded yet.</p>
                ) : (
                  <ul>
                    {periods.map((period) => {
                      const state = periodState(period, today);
                      return (
                        <li
                          key={period.key}
                          className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{period.plan}</p>
                            <p className="label-mono mt-1 text-muted-foreground">
                              {formatShortDate(period.start)} to {formatDate(period.end)}
                            </p>
                          </div>
                          <Badge variant={state.variant}>{state.label}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {canSeePayments && (
                <section className="space-y-3">
                  <SectionTitle>Payment history</SectionTitle>
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                  ) : (
                    <>
                      <ul>
                        {payments.map((payment) => (
                          <li
                            key={payment.id}
                            className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{formatDate(payment.date)}</p>
                              <p className="label-mono mt-1 break-words text-muted-foreground">
                                {[payment.receiptNo, methodLabels[payment.method] ?? payment.method, payment.reference]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              {payment.recordedBy?.name && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Recorded by {payment.recordedBy.name}
                                </p>
                              )}
                              <ManualEntryTag method={payment.method} className="mt-1" />
                            </div>
                            <div className="shrink-0 text-right">
                              <p
                                className={cn(
                                  "font-mono text-sm font-semibold",
                                  !isCounted(payment) && "text-muted-foreground line-through",
                                )}
                              >
                                {formatMoney(payment.amount, currency)}
                              </p>
                              {!isCounted(payment) && <p className="label-mono mt-1 text-destructive">Voided</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground">{MANUAL_ENTRY_NOTE}</p>
                    </>
                  )}
                </section>
              )}

              <section className="space-y-3">
                <SectionTitle>Activity</SectionTitle>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing logged yet. Changes made from now on appear here.
                  </p>
                ) : (
                  <>
                    <ul>
                      {activity.slice(0, ACTIVITY_LIMIT).map((entry) => {
                        const meta = auditMeta(entry.action);
                        const text = describeAudit(entry, currency);
                        return (
                          <li key={entry.id} className="border-b border-border py-3 last:border-0">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                            {text && <p className="mt-2 break-words text-sm">{text}</p>}
                            <p className="label-mono mt-1 text-muted-foreground">
                              {formatDateTime(entry.at)} · by {entry.by}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                    {activity.length > ACTIVITY_LIMIT && (
                      <p className="text-xs text-muted-foreground">
                        Showing the latest {ACTIVITY_LIMIT} of {activity.length}. The owner can see everything in the
                        audit log.
                      </p>
                    )}
                  </>
                )}
              </section>
            </div>

            {(canManage || canRenew) && (
              <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
                {canManage && (
                  <Button variant="outline" onClick={() => onEdit(row)}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Button>
                )}
                {canRenew && (
                  <Button onClick={() => onRenew(row)}>
                    {collecting ? <Wallet aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                    {collecting ? "Collect payment" : "Renew"}
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}