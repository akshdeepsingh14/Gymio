import { formatMoney } from "@/lib/format";

export function MethodBreakdown({ data, currency }) {
  const total = data.reduce((sum, method) => sum + method.amount, 0);

  return (
    <div>
      <ul className="space-y-5">
        {data.map((method) => {
          const percent = total ? Math.round((method.amount / total) * 100) : 0;
          return (
            <li key={method.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{method.label}</span>
                <span className="font-mono text-sm">{formatMoney(method.amount, currency)}</span>
              </div>
              <div className="mt-2 h-2 bg-muted" aria-hidden="true">
                <div
                  className="h-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="label-mono mt-1.5 text-muted-foreground">
                {percent}% · {method.count} {method.count === 1 ? "payment" : "payments"}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
        Payments are recorded manually by you. Gymio does not verify them with a bank or UPI provider.
      </p>
    </div>
  );
}