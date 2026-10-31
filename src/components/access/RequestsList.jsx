
import { Check, ShieldOff, X } from "lucide-react";

import { LoadingButton } from "@/components/common/LoadingButton";
import { MemberStatusBadge } from "@/components/members/MemberStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  REQUEST_STATUS_LABELS,
  REQUEST_VALID_HOURS,
} from "@/lib/accessRequests";

import { formatDate } from "@/lib/dates";
import { timeAgo } from "@/lib/format";

const BADGE_VARIANT = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
  expired: "secondary",
  revoked: "destructive",
};

const who = (name, role) =>
  [name, role].filter(Boolean).join(" · ");

function StatusCell({ row }) {
  let detail = null;

  if (row.status === "approved" || row.status === "rejected") {
    detail = `${who(
      row.decidedBy ?? "Owner",
      row.decidedByRole,
    )} · ${timeAgo(row.decidedAt)}`;
  } else if (row.status === "revoked") {
    detail = `${who(
      row.revokedBy ?? "Owner",
      row.revokedByRole,
    )} · ${timeAgo(row.revokedAt)}`;
  } else if (row.status === "cancelled") {
    detail = "Cancelled by the member";
  } else if (row.status === "expired") {
    detail = `No answer within ${REQUEST_VALID_HOURS} hours`;
  }

  return (
    <div>
      <Badge
        variant={BADGE_VARIANT[row.status] ?? "outline"}
      >
        {REQUEST_STATUS_LABELS[row.status] ?? row.status}
      </Badge>

      {detail && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {detail}
        </p>
      )}

      {row.reason && (
        <p className="mt-1 max-w-56 break-words text-xs text-muted-foreground">
          Note: {row.reason}
        </p>
      )}
    </div>
  );
}

function Standing({ row }) {
  if (!row.standing) {
    return (
      <p className="text-sm text-muted-foreground">
        Member removed
      </p>
    );
  }

  return (
    <div>
      <MemberStatusBadge {...row.standing} />

      <p className="mt-1 text-xs text-muted-foreground">
        Expires {formatDate(row.member.expiresOn)}
      </p>
    </div>
  );
}

function Actions({
  row,
  busyId,
  onApprove,
  onReject,
  onRevoke,
}) {
  // Approved requests can be revoked.
  if (row.status === "approved") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={Boolean(busyId)}
        onClick={() => onRevoke(row)}
        aria-label={`Revoke access for ${row.name}`}
      >
        <ShieldOff aria-hidden="true" />
        Revoke access
      </Button>
    );
  }

  // Only pending requests can be approved or rejected.
  if (row.status !== "pending") return null;

  const busy = busyId === row.id;
  const locked = Boolean(busyId) && !busy;

  return (
    <div>
      <div className="flex items-center gap-2">
        <LoadingButton
          size="sm"
          loading={busy}
          loadingText="Approving…"
          disabled={Boolean(row.block) || locked}
          onClick={() => onApprove(row)}
          aria-label={`Approve ${row.name}`}
        >
          <Check aria-hidden="true" />
          Approve
        </LoadingButton>

        <Button
          size="sm"
          variant="outline"
          disabled={busy || locked}
          onClick={() => onReject(row)}
          aria-label={`Reject ${row.name}`}
        >
          <X aria-hidden="true" />
          Reject
        </Button>
      </div>

      {row.block && (
        <p className="mt-2 max-w-64 text-xs text-warning">
          {row.block}
        </p>
      )}
    </div>
  );
}

export function RequestsList({
  rows,
  busyId,
  onApprove,
  onReject,
  onRevoke,
}) {
  const actions = {
    busyId,
    onApprove,
    onReject,
    onRevoke,
  };

  return (
    <>
      {/* Tablet and desktop: table */}
      <div className="hidden overflow-hidden rounded-sm border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {[
                "Member",
                "Membership",
                "Requested",
                "Status",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="label-mono px-4 py-3 text-muted-foreground"
                >
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
              <tr
                key={row.id}
                className="align-top transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold">
                    {row.name}
                  </p>

                  <p className="label-mono mt-1 text-muted-foreground">
                    {[row.memberId, row.planName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <Standing row={row} />
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  <p>{timeAgo(row.requestedAt)}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(
                      row.requestedAt.slice(0, 10),
                    )}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <StatusCell row={row} />
                </td>

                <td className="px-4 py-3">
                  <Actions
                    row={row}
                    {...actions}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-sm border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {row.name}
                </p>

                <p className="label-mono mt-1 text-muted-foreground">
                  {[row.memberId, row.planName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <p className="shrink-0 text-xs text-muted-foreground">
                {timeAgo(row.requestedAt)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <Standing row={row} />
              <StatusCell row={row} />
            </div>

            {(row.status === "pending" ||
              row.status === "approved") && (
              <div className="mt-4">
                <Actions
                  row={row}
                  {...actions}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
