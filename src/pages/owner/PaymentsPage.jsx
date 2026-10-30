import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Plus, ReceiptText, SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { AmendPaymentSheet } from "@/components/payments/AmendPaymentSheet";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { PaymentHistorySheet } from "@/components/payments/PaymentHistorySheet";
import { PaymentStats } from "@/components/payments/PaymentStats";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { ReceiptSheet } from "@/components/payments/ReceiptSheet";
import { RecordPaymentSheet } from "@/components/payments/RecordPaymentSheet";
import { VoidPaymentDialog } from "@/components/payments/VoidPaymentDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { todayISO } from "@/lib/dates";
import { DEFAULT_FILTERS, filterPayments, sortPayments, summarize } from "@/lib/paymentFilters";
import { isCounted, methodLabels } from "@/lib/payments";

const PAGE_SIZE = 10;

function PaymentsSkeleton() {
  return (
    <div role="status" aria-label="Loading payments" className="mt-8 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const db = useDb();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // The dashboard's "Record payment" button links here with ?new=1
  const [recordOpen, setRecordOpen] = useState(() => searchParams.get("new") === "1");
  const [amend, setAmend] = useState({ open: false, payment: null });
  const [voiding, setVoiding] = useState({ open: false, payment: null });
  const [history, setHistory] = useState({ open: false, payment: null });
  const [receipt, setReceipt] = useState({ open: false, payment: null });

  const currency = user.gym?.currency ?? "INR";
  const today = todayISO();

  useEffect(() => {
    if (searchParams.get("new")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Short pause so the loading state is visible. The real API will make it natural.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const rows = useMemo(() => {
    const memberById = Object.fromEntries(db.members.map((m) => [m.id, m]));
    const planById = Object.fromEntries(db.plans.map((p) => [p.id, p]));
    return db.payments.map((payment) => ({
      ...payment,
      memberName: memberById[payment.memberId]?.name ?? "Unknown member",
      planName: planById[payment.planId]?.name ?? "",
      methodLabel: methodLabels[payment.method] ?? payment.method,
    }));
  }, [db.payments, db.members, db.plans]);

  const visible = useMemo(
    () => sortPayments(filterPayments(rows, filters, today), filters.sort),
    [rows, filters, today],
  );
  const summary = useMemo(() => summarize(visible), [visible]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive = Object.keys(DEFAULT_FILTERS).some(
    (key) => key !== "sort" && filters[key] !== DEFAULT_FILTERS[key],
  );
  const voidedTotal = rows.filter((row) => !isCounted(row)).length;

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters((current) => ({ ...DEFAULT_FILTERS, sort: current.sort }));
    setPage(1);
  };

  const actions = {
    onReceipt: (payment) => setReceipt({ open: true, payment }),
    onHistory: (payment) => setHistory({ open: true, payment }),
    onAmend: (payment) => setAmend({ open: true, payment }),
    onVoid: (payment) => setVoiding({ open: true, payment }),
  };

  const openRecord = () => setRecordOpen(true);

  const description =
    rows.length === 0
      ? "Record payments and keep a clear history."
      : `${rows.length - voidedTotal} payments${voidedTotal > 0 ? ` · ${voidedTotal} voided` : ""}`;

  return (
    <>
      <title>Payments — Gymio</title>

      <PageHeader
        title="Payments"
        description={description}
        actions={
          <Button size="lg" onClick={openRecord}>
            <Plus aria-hidden="true" />
            Record payment
          </Button>
        }
      />

      {loading ? (
        <PaymentsSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ReceiptText}
          title="No payments yet"
          text="Payments you record, including the ones taken when adding or renewing a member, will show up here."
          action={
            <Button onClick={openRecord}>
              <Plus aria-hidden="true" />
              Record your first payment
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-6">
          <PaymentStats summary={summary} currency={currency} />

          <div className="space-y-4">
            <PaymentFilters filters={filters} onChange={setFilter} today={today} />

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                text="No payments fit these filters."
                action={
                  filtersActive ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <PaymentsTable rows={pageRows} currency={currency} actions={actions} />
                <Pagination
                  page={safePage}
                  pageSize={PAGE_SIZE}
                  total={visible.length}
                  onPageChange={setPage}
                  label="payments"
                />
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Payments are recorded by you. Gymio does not verify UPI or cash payments with a bank or payment provider.
            </p>
          </div>
        </div>
      )}

      <RecordPaymentSheet
        open={recordOpen}
        onOpenChange={setRecordOpen}
        members={db.members}
        plans={db.plans}
        currency={currency}
      />

      <AmendPaymentSheet
        open={amend.open}
        onOpenChange={(open) => setAmend((current) => ({ ...current, open }))}
        payment={amend.payment}
        currency={currency}
      />

      <VoidPaymentDialog
        open={voiding.open}
        onOpenChange={(open) => setVoiding((current) => ({ ...current, open }))}
        payment={voiding.payment}
        currency={currency}
      />

      <PaymentHistorySheet
        open={history.open}
        onOpenChange={(open) => setHistory((current) => ({ ...current, open }))}
        payment={history.payment}
        currency={currency}
      />

      <ReceiptSheet
        open={receipt.open}
        onOpenChange={(open) => setReceipt((current) => ({ ...current, open }))}
        payment={receipt.payment}
        currency={currency}
      />
    </>
  );
}