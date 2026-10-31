import { History } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { useDb } from "@/hooks/useDb";
import { timeAgo } from "@/lib/format";

function Change({ change }) {
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{change.label}:</span>{" "}
      {change.added.length > 0 && <span>added {change.added.join(", ")}</span>}
      {change.added.length > 0 && change.removed.length > 0 && <span>; </span>}
      {change.removed.length > 0 && <span>removed {change.removed.join(", ")}</span>}
    </p>
  );
}

/** Every time the owner changed what a role can do, newest first. */
export function PermissionHistoryCard() {
  const db = useDb();
  const entries = db.auditLog
    .filter((entry) => entry.action === "roles.updated")
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <Panel title="Permission history" description="Who changed what each role can do, and when">
      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No changes yet"
          text="Changes to role permissions are listed here once you save one."
        />
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id} className="border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{entry.summary}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.at)}</p>
              </div>
              {Array.isArray(entry.changes) && entry.changes.map((change) => <Change key={change.role} change={change} />)}
              <p className="label-mono mt-2 text-muted-foreground">By {entry.by}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}