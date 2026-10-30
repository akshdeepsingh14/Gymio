import { PaymentRowMenu } from "@/components/payments/PaymentRowMenu";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { isCounted } from "@/lib/payments";
import { cn } from "@/lib/utils";

function StatusBadge({ payment }) {
  return isCounted(payment) ? (
    <Badge variant="outline">Recorded</Badge>
  ) : (
    <Badge variant="destructive">Voided</Badge>
  );
}

function Amount({ payment, currency, className }) {
  return (
    <span
      className={cn(
        "font-mono font-semibold",
        !isCounted(payment) && "text-muted-foreground line-through",
        className,
      )}
    >
      {formatMoney(payment.amount, currency)}
    </span>
  );
}

const methodLine = (payment) => [payment.methodLabel, payment.reference].filter(Boolean).join(" · ");

function VoidReason({ payment }) {
  if (isCounted(payment) || !payment.voidReason) return null;
  return <p className="mt-1.5 max-w-56 break-words text-xs text-muted-foreground">Reason: {payment.voidReason}</p>;
}

export function PaymentsTable({ rows, currency, actions }) {
  return (
    <>
      {/* Tablet and desktop: table */}
      <div className="hidden overflow-hidden rounded-sm border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {["Receipt", "Member", "Date", "Method"].map((heading) => (
                <th key={heading} scope="col" className="label-mono px-4 py-3 text-muted-foreground">
                  {heading}
                </th>
              ))}
              <th scope="col" className="label-mono px-4 py-3 text-right text-muted-foreground">
                Amount
              </th>
              <th scope="col" className="label-mono px-4 py-3 text-muted-foreground">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-top transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{row.receiptNo}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.memberName}</p>
                  <p className="label-mono mt-1 text-muted-foreground">
                    {[row.memberId, row.planName].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date)}</td>
                <td className="max-w-48 px-4 py-3">
                  <p className="break-words">{methodLine(row)}</p>
                  {row.note && <p className="mt-1 break-words text-xs text-muted-foreground">{row.note}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Amount payment={row} currency={currency} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge payment={row} />
                  <VoidReason payment={row} />
                </td>
                <td className="px-2 py-2 text-right">
                  <PaymentRowMenu payment={row} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-sm border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.memberName}</p>
                <p className="label-mono mt-1 text-muted-foreground">{[row.receiptNo, row.memberId].join(" · ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Amount payment={row} currency={currency} />
                <PaymentRowMenu payment={row} {...actions} />
              </div>
            </div>
            <p className="mt-3 break-words text-sm text-muted-foreground">
              {formatDate(row.date)} · {methodLine(row)}
            </p>
            {row.note && <p className="mt-1 break-words text-xs text-muted-foreground">{row.note}</p>}
            <div className="mt-3">
              <StatusBadge payment={row} />
              <VoidReason payment={row} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}