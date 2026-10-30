import { useState } from "react";
import { ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

const PREVIEW_COUNT = 5;

export function PaymentsSection({ payments, currency, onReceipt }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? payments : payments.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby="payments-heading">
      <h2 id="payments-heading" className="font-display text-2xl font-extrabold uppercase leading-none">
        Renewals &amp; payments
      </h2>

      {payments.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={ReceiptText}
          title="No payments yet"
          text="Your payments and renewals will be listed here once the gym records them."
        />
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border border border-border">
            {rows.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                  </p>
                  <p className="label-mono mt-1 text-muted-foreground">
                    {payment.planName} · Paid {formatDate(payment.date)} · {payment.methodLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-semibold">{formatMoney(payment.amount, currency)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReceipt(payment.receipt)}
                    aria-label={`View receipt ${payment.receiptNo}`}
                  >
                    <ReceiptText aria-hidden="true" />
                    Receipt
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {payments.length > PREVIEW_COUNT && (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAll((value) => !value)}>
              {showAll ? "Show fewer" : `Show all ${payments.length}`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}