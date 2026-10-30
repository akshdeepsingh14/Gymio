import { Pencil, RefreshCw, Wallet } from "lucide-react";

import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { CredentialPanel } from "@/components/members/CredentialPanel";
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
import { formatDate, formatShortDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { isCounted } from "@/lib/payments";
import { describeDaysLeft } from "@/lib/renewal";
import { cn } from "@/lib/utils";
import { useDb } from "@/hooks/useDb";

const methodLabels = Object.fromEntries(paymentMethodOptions.map((option) => [option.value, option.label]));

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
  const today = todayISO();

  const planNames = Object.fromEntries(db.plans.map((plan) => [plan.id, plan.name]));
  const payments = row
    ? db.payments
        .filter((p) => p.memberId === row.id)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, undefined, { numeric: true }))
    : [];
  const periods = row ? buildPeriods(row, payments.filter(isCounted), planNames) : []; // voided payments cover no period
  const canRenew = row && row.accessStatus !== "inactive";
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
                <CredentialPanel member={row} />
                
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
                    <p className="text-xs text-muted-foreground">
                      Payments are recorded by you. Gymio does not verify them with a bank or UPI provider.
                    </p>
                  </>
                )}
              </section>
            </div>

            <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
              <Button variant="outline" onClick={() => onEdit(row)}>
                <Pencil aria-hidden="true" />
                Edit
              </Button>
              {canRenew && (
                <Button onClick={() => onRenew(row)}>
                  {collecting ? <Wallet aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                  {collecting ? "Collect payment" : "Renew"}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}