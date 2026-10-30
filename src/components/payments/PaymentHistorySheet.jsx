import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { auditForPayment } from "@/lib/payments";
import { useDb } from "@/hooks/useDb";

const ACTIONS = {
  "payment.recorded": { label: "Recorded", variant: "outline" },
  "payment.amended": { label: "Edited", variant: "secondary" },
  "payment.voided": { label: "Voided", variant: "destructive" },
};

const formatDateTime = (iso) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

const show = (value) => (value ? value : "empty");

function Details({ entry, currency }) {
  const { action, before, after, reason } = entry;

  if (action === "payment.voided") {
    return (
      <>
        <p>Reason: {reason}</p>
        {before && after && before.expiresOn !== after.expiresOn && (
          <p>
            Membership end changed from {formatDate(before.expiresOn)} to {formatDate(after.expiresOn)}.
          </p>
        )}
        {after?.paymentStatus === "pending" && <p>The period is unpaid again.</p>}
      </>
    );
  }

  if (action === "payment.amended") {
    return (
      <>
        {before.reference !== after.reference && (
          <p>
            Reference: {show(before.reference)} → {show(after.reference)}
          </p>
        )}
        {before.note !== after.note && (
          <p>
            Note: {show(before.note)} → {show(after.note)}
          </p>
        )}
      </>
    );
  }

  return (
    <p>
      {formatMoney(entry.amount, currency)}
      {after?.periodStart && ` for ${formatDate(after.periodStart)} to ${formatDate(after.periodEnd)}`}
    </p>
  );
}

/** Live: reads the audit log, so a change made while it is open shows up at once. */
export function PaymentHistorySheet({ open, onOpenChange, payment, currency }) {
  const db = useDb();
  const entries = payment ? auditForPayment(db.auditLog, payment.id) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>Payment history</SheetTitle>
          <SheetDescription>{payment ? `${payment.receiptNo} · ${payment.memberName}` : ""}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No changes are logged for this payment. Sample payments that came with the demo gym were added before the
              audit trail existed.
            </p>
          ) : (
            <ol className="space-y-5">
              {entries.map((entry) => {
                const meta = ACTIONS[entry.action] ?? { label: entry.action, variant: "outline" };
                return (
                  <li key={entry.id} className="space-y-2 border-b border-border pb-5 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <p className="label-mono text-muted-foreground">{formatDateTime(entry.at)}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <Details entry={entry} currency={currency} />
                    </div>
                    <p className="label-mono text-muted-foreground">By {entry.by}</p>
                  </li>
                );
              })}
            </ol>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Demo only: this trail is stored in your browser. In the real version the server keeps it and nobody can edit
            it.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}