import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { KeyRound, Search, SearchX } from "lucide-react";
import { toast } from "sonner";

import { RejectRequestDialog } from "@/components/access/RejectRequestDialog";
import { RequestsList } from "@/components/access/RequestsList";
import { RequestTabs } from "@/components/access/RequestTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { buildRequestRows, countByStatus, filterRequests } from "@/lib/accessRequests";
import { todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { approveRequest } from "@/services/accessRequestService";

const PAGE_SIZE = 8;

function RequestsSkeleton() {
  return (
    <div role="status" aria-label="Loading access requests" className="mt-8 space-y-4">
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

const emptyText = {
  pending: "No members are waiting for access right now.",
  approved: "Approved requests will be listed here.",
  rejected: "Rejected requests will be listed here.",
  all: "No requests match your search.",
};

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const db = useDb();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState({ open: false, row: null });

  const graceDays = user.gym?.graceDays ?? 10;
  const reminderDays = user.gym?.reminderDays ?? 7;

  // Short pause so the loading state is visible. The real API will make it natural.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(
    () => buildRequestRows(db, todayISO(), { graceDays, reminderDays }),
    [db, graceDays, reminderDays],
  );
  const counts = useMemo(() => countByStatus(rows), [rows]);
  const visible = useMemo(() => filterRequests(rows, { tab, query }), [rows, tab, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeTab = (next) => {
    setTab(next);
    setPage(1);
  };

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const handleApprove = async (row) => {
    setBusyId(row.id);
    try {
      const { name } = await approveRequest(row.id);
      toast.success(`${name} approved. They can now open their member area.`);
    } catch (error) {
      toast.error(error.message ?? "Could not approve this request.");
    } finally {
      setBusyId(null);
    }
  };

  const description =
    counts.pending > 0
      ? `${counts.pending} ${counts.pending === 1 ? "member is" : "members are"} waiting for your approval.`
      : "Approve or reject members who ask to open their member area.";

  return (
    <>
      <title>Access requests — Gymio</title>

      <PageHeader title="Access requests" description={description} />

      {loading ? (
        <RequestsSkeleton />
      ) : db.accessRequests.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={KeyRound}
          title="No requests yet"
          text="When a member enters your gym username and their access code in the member portal, their request appears here."
          action={
            <Link to="/app/members" className={cn(buttonVariants({ variant: "outline" }))}>
              Go to members
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <RequestTabs value={tab} onChange={changeTab} counts={counts} />
            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label="Search requests"
                placeholder="Search name or member ID"
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={query ? SearchX : KeyRound}
              title={query ? "No matches" : tab === "pending" ? "All clear" : "Nothing here"}
              text={query ? "No requests match your search." : emptyText[tab]}
            />
          ) : (
            <>
              <RequestsList
                rows={pageRows}
                busyId={busyId}
                onApprove={handleApprove}
                onReject={(row) => setRejecting({ open: true, row })}
              />
              <Pagination
                page={safePage}
                pageSize={PAGE_SIZE}
                total={visible.length}
                onPageChange={setPage}
                label="requests"
              />
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Approving lets this member open their member area on the device they used. Their access code is not
            shown to you or stored in readable form. In this demo, approval is simulated in your browser.
          </p>
        </div>
      )}

      <RejectRequestDialog
        open={rejecting.open}
        onOpenChange={(open) => setRejecting((current) => ({ ...current, open }))}
        row={rejecting.row}
      />
    </>
  );
}