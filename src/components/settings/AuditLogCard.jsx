import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_FILTERS, auditMeta, countByCategory, describeAudit } from "@/lib/auditLog";
import { formatDateTime } from "@/lib/security";

const PAGE_SIZE = 8;

export function AuditLogCard({ entries, currency }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.at.localeCompare(a.at)), [entries]);
  const counts = useMemo(() => countByCategory(sorted), [sorted]);

  const rows = filter === "all" ? sorted : sorted.filter((entry) => auditMeta(entry.action).category === filter);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const items = AUDIT_FILTERS.map((item) => ({
    id: item.id,
    label: item.label,
    count: item.id === "all" ? sorted.length : (counts[item.id] ?? 0),
  }));

  const changeFilter = (next) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>
          Who changed what, newest first. Entries are only ever added. Demo: the log lives in this browser, so anyone
          with developer tools could change it. The server will keep it tamper-proof.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SegmentedControl label="Filter the audit log" value={filter} onChange={changeFilter} items={items} />

        {rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nothing here yet"
            text="Payments, access decisions, staff and settings changes, and exports appear here as they happen."
          />
        ) : (
          <>
            <ul className="divide-y divide-border rounded-sm border border-border">
              {visible.map((entry) => {
                const meta = auditMeta(entry.action);
                const text = describeAudit(entry, currency);
                return (
                  <li key={entry.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {text && <p className="mt-2 break-words text-sm">{text}</p>}
                    </div>
                    <p className="label-mono shrink-0 text-muted-foreground sm:text-right">
                      {formatDateTime(entry.at)}
                      <br />
                      by {entry.by}
                    </p>
                  </li>
                );
              })}
            </ul>
            <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} onPageChange={setPage} label="entries" />
          </>
        )}
      </CardContent>
    </Card>
  );
}