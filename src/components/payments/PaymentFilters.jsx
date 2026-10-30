import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { paymentMethodOptions } from "@/data/options";
import { DATE_RANGES, isBackwardsRange, SORTS, STATUS_FILTERS } from "@/lib/paymentFilters";

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const methodFilterOptions = [{ value: "all", label: "All methods" }, ...paymentMethodOptions];

export function PaymentFilters({ filters, onChange, today }) {
  const backwards = isBackwardsRange(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search payments"
            placeholder="Search receipt, member, ID or reference"
            value={filters.query}
            onChange={(event) => onChange("query", event.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <FilterSelect label="Filter by date" value={filters.range} onChange={(v) => onChange("range", v)} options={DATE_RANGES} />
        <FilterSelect label="Filter by method" value={filters.method} onChange={(v) => onChange("method", v)} options={methodFilterOptions} />
        <FilterSelect label="Filter by status" value={filters.status} onChange={(v) => onChange("status", v)} options={STATUS_FILTERS} />
        <FilterSelect label="Sort payments" value={filters.sort} onChange={(v) => onChange("sort", v)} options={SORTS} />
      </div>

      {filters.range === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="label-mono text-muted-foreground" htmlFor="payments-from">
            From
          </label>
          <Input
            id="payments-from"
            type="date"
            max={today}
            value={filters.from}
            onChange={(event) => onChange("from", event.target.value)}
            aria-invalid={backwards || undefined}
            className="h-10 w-auto"
          />
          <label className="label-mono text-muted-foreground" htmlFor="payments-to">
            To
          </label>
          <Input
            id="payments-to"
            type="date"
            max={today}
            value={filters.to}
            onChange={(event) => onChange("to", event.target.value)}
            aria-invalid={backwards || undefined}
            className="h-10 w-auto"
          />
          {backwards && (
            <p role="alert" className="text-sm text-destructive">
              The start date is after the end date.
            </p>
          )}
        </div>
      )}
    </div>
  );
}