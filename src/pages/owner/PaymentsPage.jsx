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

import { PermissionGuard } from "@/components/common/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/useAuth";
import { useDb } from "@/hooks/useDb";
import { usePermissions } from "@/hooks/usePermissions";

import { todayISO } from "@/lib/dates";
import {
  DEFAULT_FILTERS,
  filterPayments,
  sortPayments,
  summarize,
} from "@/lib/paymentFilters";

import {
  isCounted,
  MANUAL_ENTRY_NOTE,
  methodLabels,
} from "@/lib/payments";

const PAGE_SIZE = 10;

function PaymentsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading payments"
      className="mt-8 space-y-4"
    >
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
  const { can } = usePermissions();
  const db = useDb();

  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // Open the record payment sheet when redirected with ?new=1.
  // Only users with permission can record payments.
  const [recordOpen, setRecordOpen] = useState(
    () =>
      searchParams.get("new") === "1" &&
      can("payments.record"),
  );

  const [amend, setAmend] = useState({
    open: false,
    payment: null,
  });

  const [voiding, setVoiding] = useState({
    open: false,
    payment: null,
  });

  const [history, setHistory] = useState({
    open: false,
    payment: null,
  });

  const [receipt, setReceipt] = useState({
    open: false,
    payment: null,
  });

  const currency = user.gym?.currency ?? "INR";
  const today = todayISO();

  // Remove the redirect query parameter after handling it.
  useEffect(() => {
    if (searchParams.get("new")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Short pause so the loading state is visible.
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  // Prepare payment rows with member, plan, and method information.
  const rows = useMemo(() => {
    const memberById = Object.fromEntries(
      db.members.map((member) => [member.id, member]),
    );

    const planById = Object.fromEntries(
      db.plans.map((plan) => [plan.id, plan]),
    );

    return db.payments.map((payment) => ({
      ...payment,

      memberName:
        memberById[payment.memberId]?.name ??
        "Unknown member",

      planName:
        planById[payment.planId]?.name ?? "",

      methodLabel:
        methodLabels[payment.method] ??
        payment.method,
    }));
  }, [db.payments, db.members, db.plans]);

  // Apply filters and sorting.
  const visible = useMemo(
    () =>
      sortPayments(
        filterPayments(rows, filters, today),
        filters.sort,
      ),
    [rows, filters, today],
  );

  // Calculate payment statistics.
  const summary = useMemo(
    () => summarize(visible),
    [visible],
  );

  // Pagination.
  const pageCount = Math.max(
    1,
    Math.ceil(visible.length / PAGE_SIZE),
  );

  const safePage = Math.min(page, pageCount);

  const pageRows = visible.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Check whether filters are active.
  const filtersActive = Object.keys(DEFAULT_FILTERS).some(
    (key) =>
      key !== "sort" &&
      filters[key] !== DEFAULT_FILTERS[key],
  );

  // Calculate the number of voided payments.
  const voidedTotal = rows.filter(
    (row) => !isCounted(row),
  ).length;

  // Update an individual filter.
  const setFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  };

  // Clear filters while preserving the current sort order.
  const clearFilters = () => {
    setFilters((current) => ({
      ...DEFAULT_FILTERS,
      sort: current.sort,
    }));

    setPage(1);
  };

  // Payment table actions.
  const actions = {
    onReceipt: (payment) =>
      setReceipt({
        open: true,
        payment,
      }),

    onHistory: (payment) =>
      setHistory({
        open: true,
        payment,
      }),

    onAmend: (payment) =>
      setAmend({
        open: true,
        payment,
      }),

    onVoid: (payment) =>
      setVoiding({
        open: true,
        payment,
      }),
  };

  const openRecord = () => {
    setRecordOpen(true);
  };

  // Page description.
  const description =
    rows.length === 0
      ? "Record payments and keep a clear history."
      : `${rows.length - voidedTotal} payments${
          voidedTotal > 0
            ? ` · ${voidedTotal} voided`
            : ""
        }`;

  return (
    <>
      <title>Payments — Gymio</title>

      <PageHeader
        title="Payments"
        description={description}
        actions={
          <PermissionGuard permission="payments.record">
            <Button
              size="lg"
              onClick={openRecord}
            >
              <Plus aria-hidden="true" />
              Record payment
            </Button>
          </PermissionGuard>
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
            <PermissionGuard permission="payments.record">
              <Button onClick={openRecord}>
                <Plus aria-hidden="true" />
                Record your first payment
              </Button>
            </PermissionGuard>
          }
        />
      ) : (
        <div className="mt-8 space-y-6">
          {/* Revenue totals need the reports permission. Without it, only counts are shown. */}
          <PaymentStats
            summary={summary}
            currency={currency}
            showMoney={can("reports.view")}
          />

          <div className="space-y-4">
            <PaymentFilters
              filters={filters}
              onChange={setFilter}
              today={today}
            />

            {visible.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                text="No payments fit these filters."
                action={
                  filtersActive ? (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : null
                }
              />
            ) : (
              <>
                <PaymentsTable
                  rows={pageRows}
                  currency={currency}
                  actions={actions}
                />

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
              {MANUAL_ENTRY_NOTE}
            </p>
          </div>
        </div>
      )}

      {/* Record payment */}
      <RecordPaymentSheet
        open={recordOpen}
        onOpenChange={setRecordOpen}
        members={db.members}
        plans={db.plans}
        currency={currency}
      />

      {/* Amend payment */}
      <AmendPaymentSheet
        open={amend.open}
        onOpenChange={(open) =>
          setAmend((current) => ({
            ...current,
            open,
          }))
        }
        payment={amend.payment}
        currency={currency}
      />

      {/* Void payment */}
      <VoidPaymentDialog
        open={voiding.open}
        onOpenChange={(open) =>
          setVoiding((current) => ({
            ...current,
            open,
          }))
        }
        payment={voiding.payment}
        currency={currency}
      />

      {/* Payment history */}
      <PaymentHistorySheet
        open={history.open}
        onOpenChange={(open) =>
          setHistory((current) => ({
            ...current,
            open,
          }))
        }
        payment={history.payment}
        currency={currency}
      />

      {/* Payment receipt */}
      <ReceiptSheet
        open={receipt.open}
        onOpenChange={(open) =>
          setReceipt((current) => ({
            ...current,
            open,
          }))
        }
        payment={receipt.payment}
        currency={currency}
      />
    </>
  );
}