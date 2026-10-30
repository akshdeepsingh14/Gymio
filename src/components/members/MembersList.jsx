import { MemberRowMenu } from "@/components/members/MemberRowMenu";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";

function expiryHint(daysLeft) {
  if (daysLeft === 0) return "today";
  if (daysLeft > 0) return `in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  const ago = Math.abs(daysLeft);
  return `${ago} ${ago === 1 ? "day" : "days"} ago`;
}

function NameButton({ row, onView }) {
  return (
    <button
      type="button"
      onClick={() => onView(row)}
      className="max-w-full truncate text-left font-semibold underline-offset-4 hover:underline"
    >
      {row.name}
    </button>
  );
}

export function MembersList({ rows, menuActions }) {
  return (
    <>
      {/* Tablet and desktop: table */}
      <div className="hidden overflow-hidden rounded-sm border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {["Member", "Plan", "Expires", "Status"].map((heading) => (
                <th key={heading} scope="col" className="label-mono px-4 py-3 text-muted-foreground">
                  {heading}
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <NameButton row={row} onView={menuActions.onView} />
                  <p className="label-mono mt-1 text-muted-foreground">
                    {[row.id, row.phone].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{row.planName}</p>
                  {row.paymentStatus === "pending" && (
                    <Badge variant="destructive" className="mt-1">
                      Unpaid
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p>{formatDate(row.expiresOn)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{expiryHint(row.daysLeft)}</p>
                </td>
                <td className="px-4 py-3">
                  <MemberStatusBadge {...row} />
                </td>
                <td className="px-2 py-3 text-right">
                  <MemberRowMenu member={row} {...menuActions} />
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <NameButton row={row} onView={menuActions.onView} />
                <p className="label-mono mt-1 text-muted-foreground">
                  {[row.id, row.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <MemberRowMenu member={row} {...menuActions} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="label-mono text-muted-foreground">Plan</dt>
                <dd className="mt-1">{row.planName}</dd>
              </div>
              <div>
                <dt className="label-mono text-muted-foreground">Expires</dt>
                <dd className="mt-1">
                  {formatDate(row.expiresOn)}
                  <span className="block text-xs text-muted-foreground">{expiryHint(row.daysLeft)}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <MemberStatusBadge {...row} />
              {row.paymentStatus === "pending" && <Badge variant="destructive">Unpaid</Badge>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}